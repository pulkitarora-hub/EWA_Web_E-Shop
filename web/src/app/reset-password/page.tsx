import React, { Suspense } from "react";
import { ResetPasswordClient } from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="w-full max-w-md text-center text-charcoal-lighter text-sm">
            Loading…
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
