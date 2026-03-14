import express from "express";
import jwt from "jsonwebtoken";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function getUserFromToken(token?: string) {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    return prisma.user.findUnique({ 
      where: { id: payload.sub },
      include: {
        therapistProfile: true,
        clientProfile: true,
      }
    });
  } catch {
    return null;
  }
}

export function authMiddleware() {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;
    const user = await getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    (req as any).user = user;
    next();
  };
}

export function adminMiddleware() {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user?.isAdmin && user?.role !== "ADMIN") {
      return res.status(403).json({ error: "admin_required" });
    }
    next();
  };
}

export function requireRole(...roles: Role[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  };
}
