import { headers } from "next/headers";
import AppClient from "./AppClient";

export const dynamic = "force-dynamic";

export default function Page() {
  headers();
  return <AppClient />;
}
