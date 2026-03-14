import React, { useRef, useState, useEffect } from "react";
import SignaturePad from "signature_pad";

type PolicyData = {
  signedName: string;
  signatureDataUrl: string;
  agreedAt: string;
};

type Props = {
  userName: string;
  onConfirm: (data: PolicyData) => void;
  onCancel: () => void;
};

export function PolicyModal({ userName, onConfirm, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const [signedName, setSignedName] = useState(userName || "");
  const [agreed, setAgreed] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      // Set canvas size for crisp rendering
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
      }

      const pad = new SignaturePad(canvas, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "#2d2d2d",
      });

      pad.addEventListener("endStroke", () => {
        setHasSigned(!pad.isEmpty());
      });

      signaturePadRef.current = pad;
    }

    // Prevent body scroll while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function clearSignature() {
    signaturePadRef.current?.clear();
    setHasSigned(false);
  }

  function handleConfirm() {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) return;
    const dataUrl = signaturePadRef.current.toDataURL("image/png");
    onConfirm({
      signedName,
      signatureDataUrl: dataUrl,
      agreedAt: new Date().toISOString(),
    });
  }

  const canProceed = signedName.trim() && hasSigned && agreed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-deep/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] mx-4 flex flex-col overflow-hidden">
        {/* Header – dark */}
        <div className="flex items-center justify-between px-6 py-4 bg-deep shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Individual Therapy Policies — 2026
            </h2>
            <p className="text-xs text-brand-300 mt-0.5">
              Please read and sign before proceeding
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-deep-light transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto policy-scroll px-6 py-4 space-y-6">
          {/* PDF Viewer */}
          <div className="rounded-xl border border-warm-200 overflow-hidden bg-warm-50">
            <iframe
              src="/policy.pdf"
              className="w-full"
              style={{ height: "400px" }}
              title="Therapy Policy Document"
            />
          </div>
          <a
            href="https://policies.evolvewithavadhi.com/acknowledge"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View full policy on website
          </a>

          {/* Divider */}
          <div className="border-t border-warm-200" />

          {/* Signature Section */}
          <div>
            <h3 className="text-base font-semibold text-charcoal mb-4">
              Client Agreement &amp; Signature
            </h3>

            {/* Client Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                Client Name
              </label>
              <input
                type="text"
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-xl border border-warm-300 bg-warm-50/50 text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              />
            </div>

            {/* Signature Canvas */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-charcoal-light mb-1.5">
                Your Signature
              </label>
              <div className="rounded-xl border-2 border-dashed border-brand-300 bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="signature-canvas w-full"
                  style={{ height: "150px" }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-charcoal-lighter">
                  Draw your signature above using mouse or touch
                </p>
                <button
                  onClick={clearSignature}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  Clear signature
                </button>
              </div>
            </div>

            {/* Agreement checkbox */}
            <label className="flex items-start gap-3 mt-5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-warm-300 text-brand-500 focus:ring-brand-400/40 cursor-pointer"
              />
              <span className="text-sm text-charcoal-light leading-snug">
                I have read and agree to the{" "}
                <span className="font-medium text-charcoal">
                  Individual Therapy Policies 2026
                </span>
                , including all terms related to session structure, payment, confidentiality, and boundaries.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-warm-200 shrink-0 flex items-center justify-between gap-3 bg-warm-50/80">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-charcoal-lighter hover:text-charcoal rounded-xl hover:bg-warm-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canProceed}
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:bg-warm-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md shadow-brand-500/20 transition"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
