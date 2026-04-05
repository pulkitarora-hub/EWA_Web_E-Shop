import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Site title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Default meta description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "whatsappUrl",
      title: "WhatsApp booking URL",
      type: "url",
    }),
    defineField({
      name: "nadaAcademyUrl",
      title: "Nada Wellness Academy (WhatsApp group) URL",
      type: "url",
    }),
    defineField({
      name: "ogImage",
      title: "Default social share image",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
});
