import { defineField, defineType } from "sanity";

export const homePage = defineType({
  name: "homePage",
  title: "Home page",
  type: "document",
  fields: [
    defineField({
      name: "tagline",
      title: "Tagline (e.g. Empower. Thrive. Transcend.)",
      type: "string",
    }),
    defineField({
      name: "heroHeadline",
      title: "Hero headline",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "heroSub",
      title: "Hero subtext",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "heroPrimaryCtaLabel",
      title: "Primary CTA label",
      type: "string",
      initialValue: "Book a session",
    }),
    defineField({
      name: "heroPrimaryCtaPath",
      title: "Primary CTA path",
      type: "string",
      initialValue: "/contact",
    }),
    defineField({
      name: "heroSecondaryCtaLabel",
      title: "Secondary CTA label",
      type: "string",
      initialValue: "WhatsApp",
    }),
    defineField({
      name: "heroSecondaryCtaUrl",
      title: "Secondary CTA URL",
      type: "url",
    }),
    defineField({
      name: "heroCardTitle",
      title: "Hero card — title",
      type: "string",
    }),
    defineField({
      name: "heroCardBody",
      title: "Hero card — body",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "sayYesHeading",
      title: "Section: Say yes to yourself",
      type: "string",
    }),
    defineField({
      name: "nadaSectionTitle",
      title: "Nada Academy — title",
      type: "string",
    }),
    defineField({
      name: "nadaSectionSubtitle",
      title: "Nada Academy — subtitle",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "nadaBullets",
      title: "Nada Academy — bullets",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "nadaCtaLabel",
      title: "Nada Academy — button label",
      type: "string",
    }),
    defineField({
      name: "nadaCtaUrl",
      title: "Nada Academy — button URL",
      type: "url",
    }),
    defineField({
      name: "painPoints",
      title: "Pain points / questions (one per line)",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "text", title: "Question", type: "string" },
          ],
          preview: {
            select: { title: "text" },
          },
        },
      ],
    }),
    defineField({
      name: "aboutLead",
      title: "About teaser — lead",
      type: "string",
    }),
    defineField({
      name: "aboutBody",
      title: "About teaser — body",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "aboutAvadhi",
      title: "About teaser — Avadhi bio",
      type: "text",
      rows: 5,
    }),
    defineField({
      name: "servicesIntro",
      title: "Services — intro heading",
      type: "string",
    }),
    defineField({
      name: "servicesSub",
      title: "Services — intro subtext",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "services",
      title: "Services",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", title: "Title", type: "string" },
            { name: "body", title: "Body", type: "text", rows: 6 },
            {
              name: "accent",
              title: "Accent",
              type: "string",
              options: {
                list: [
                  { title: "Teal", value: "teal" },
                  { title: "Coral", value: "coral" },
                  { title: "Gold", value: "gold" },
                  { title: "Lavender", value: "lavender" },
                ],
              },
            },
          ],
          preview: {
            select: { title: "title" },
          },
        },
      ],
    }),
    defineField({
      name: "sessionCadenceTitle",
      title: "Session cadence — title",
      type: "string",
    }),
    defineField({
      name: "sessionCadenceBody",
      title: "Session cadence — body",
      type: "text",
      rows: 5,
    }),
    defineField({
      name: "outcomes",
      title: "Outcomes (qualitative — no fake percentages)",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", title: "Short title", type: "string" },
            { name: "body", title: "Description", type: "text", rows: 3 },
          ],
          preview: {
            select: { title: "title" },
          },
        },
      ],
    }),
    defineField({
      name: "testimonialQuote",
      title: "Testimonial quote",
      type: "text",
      rows: 6,
    }),
    defineField({
      name: "testimonialName",
      title: "Testimonial name",
      type: "string",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Home page" }),
  },
});
