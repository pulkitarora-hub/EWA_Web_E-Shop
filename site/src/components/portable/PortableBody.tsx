import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="mt-4 leading-relaxed text-muted first:mt-0">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mt-10 font-display text-2xl text-eva-midnight">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 font-display text-xl text-eva-midnight">{children}</h3>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-4 list-inside list-disc space-y-2 text-muted">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="mt-4 list-inside list-decimal space-y-2 text-muted">{children}</ol>
    ),
  },
};

type Props = { value: PortableTextBlock[] };

export function PortableBody({ value }: Props) {
  return <PortableText value={value} components={components} />;
}
