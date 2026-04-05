import { defineField, defineType } from "sanity";

/** Merchandising copy and imagery — prices and stock live in the shop API (Prisma). Match `slug` to ShopProduct.slug. */
export const productMerch = defineType({
  name: "productMerch",
  title: "Shop product (merchandising)",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (must match API product slug)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "shortDescription",
      title: "Short description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "category",
      title: "Category label",
      type: "string",
      options: {
        list: [
          { title: "Session", value: "session" },
          { title: "Course", value: "course" },
          { title: "Digital", value: "digital" },
          { title: "Other", value: "other" },
        ],
      },
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "featured",
      title: "Featured on shop home",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current" },
  },
});
