export default function ResetSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md text-center">
        <img
          src="/ea-logo.png"
          alt="Evolve with Avadhi"
          className="h-16 sm:h-20 mx-auto mb-4"
        />
        <h1 className="text-2xl font-semibold text-charcoal mb-2">
          Password updated
        </h1>
        <p className="text-sm text-charcoal-lighter mb-6">
          Your password has been reset successfully. You can now sign in.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition"
        >
          Go to sign in
        </a>
      </div>
    </div>
  );
}
