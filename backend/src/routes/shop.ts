import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import Razorpay from "razorpay";

const prisma = new PrismaClient();

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

const razorpay =
  RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    : null;

const router = Router();

router.get("/shop/products", async (_req, res) => {
  try {
    const products = await prisma.shopProduct.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return res.json({ products });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server_error" });
  }
});

type CartLine = { productId: string; quantity: number };

router.post("/shop/checkout/create", async (req, res) => {
  const { items, customerEmail, customerName, customerPhone } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "empty_cart" });
  }
  if (!razorpay) {
    return res.status(400).json({ error: "razorpay_not_configured" });
  }

  const normalized: CartLine[] = items
    .map((x: CartLine) => ({
      productId: String(x.productId || ""),
      quantity: Math.max(1, Math.min(99, parseInt(String(x.quantity), 10) || 1)),
    }))
    .filter((x) => x.productId);

  if (normalized.length === 0) {
    return res.status(400).json({ error: "invalid_items" });
  }

  const productIds = [...new Set(normalized.map((i) => i.productId))];
  const products = await prisma.shopProduct.findMany({
    where: { id: { in: productIds }, active: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  let totalInr = 0;
  const lineData: { productId: string; quantity: number; unitPriceInr: number }[] =
    [];

  for (const line of normalized) {
    const p = byId.get(line.productId);
    if (!p) {
      return res
        .status(400)
        .json({ error: "unknown_product", productId: line.productId });
    }
    if (p.stock != null && p.stock < line.quantity) {
      return res
        .status(400)
        .json({ error: "insufficient_stock", productId: line.productId });
    }
    if (p.priceInr <= 0) {
      return res
        .status(400)
        .json({ error: "price_not_set", productId: line.productId });
    }
    totalInr += p.priceInr * line.quantity;
    lineData.push({
      productId: p.id,
      quantity: line.quantity,
      unitPriceInr: p.priceInr,
    });
  }

  if (totalInr <= 0) {
    return res.status(400).json({ error: "invalid_total" });
  }

  const order = await prisma.shopOrder.create({
    data: {
      customerEmail: customerEmail
        ? String(customerEmail).slice(0, 256)
        : null,
      customerName: customerName
        ? String(customerName).slice(0, 256)
        : null,
      customerPhone: customerPhone
        ? String(customerPhone).slice(0, 32)
        : null,
      status: "pending",
      amountInr: totalInr,
      currency: "INR",
      items: {
        create: lineData.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPriceInr: l.unitPriceInr,
        })),
      },
    },
  });

  const rzOrder = await razorpay.orders.create({
    amount: totalInr * 100,
    currency: "INR",
    receipt: `shop_${order.id.replace(/-/g, "").slice(0, 14)}`,
    notes: { shopOrderId: order.id },
  });

  await prisma.shopOrder.update({
    where: { id: order.id },
    data: { razorpayOrderId: rzOrder.id },
  });

  return res.json({
    orderId: order.id,
    razorpayOrderId: rzOrder.id,
    amount: totalInr,
    currency: "INR",
    razorpayKeyId: RAZORPAY_KEY_ID,
  });
});

router.post("/shop/checkout/verify", async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    req.body || {};
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ error: "missing_fields" });
  }
  if (!RAZORPAY_KEY_SECRET) {
    return res.status(400).json({ error: "razorpay_not_configured" });
  }

  const order = await prisma.shopOrder.findUnique({
    where: { id: String(orderId) },
  });
  if (!order) {
    return res.status(404).json({ error: "order_not_found" });
  }
  if (order.status === "paid") {
    return res.json({ ok: true, orderId: order.id, alreadyPaid: true });
  }
  if (order.razorpayOrderId !== razorpayOrderId) {
    return res.status(400).json({ error: "order_mismatch" });
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(String(razorpaySignature), "hex");
  if (
    expectedBuf.length !== signatureBuf.length ||
    !crypto.timingSafeEqual(expectedBuf, signatureBuf)
  ) {
    return res.status(400).json({ error: "invalid_signature" });
  }

  const items = await prisma.shopOrderItem.findMany({
    where: { orderId: order.id },
    include: { product: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.shopOrder.update({
      where: { id: order.id },
      data: {
        status: "paid",
        razorpayPaymentId: String(razorpayPaymentId),
        paidAt: new Date(),
      },
    });
    for (const item of items) {
      if (item.product.stock != null) {
        await tx.shopProduct.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }
  });

  return res.json({ ok: true, orderId: order.id });
});

export default router;
