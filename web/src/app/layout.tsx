import "./globals.css";
import Script from "next/script";
import { GoogleOAuthWrapper } from "./GoogleOAuthWrapper";

export const metadata = {
  title: "Evolve with Avadhi",
  description: "A conscious space for emotional healing, inner clarity, and psychospiritual transformation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-warm-50">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        <GoogleOAuthWrapper>
          {children}
        </GoogleOAuthWrapper>
      </body>
    </html>
  );
}
