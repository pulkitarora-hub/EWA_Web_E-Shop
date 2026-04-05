import { type SchemaTypeDefinition } from "sanity";
import { homePage } from "./documents/homePage";
import { post } from "./documents/post";
import { productMerch } from "./documents/productMerch";
import { siteSettings } from "./documents/siteSettings";

export const schemaTypes: SchemaTypeDefinition[] = [
  siteSettings,
  homePage,
  post,
  productMerch,
];
