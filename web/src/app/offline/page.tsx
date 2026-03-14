"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <img
            src="/ea-logo.png"
            alt="Evolve with Avadhi"
            className="h-20 mx-auto mb-6 opacity-50"
          />
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warm-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-warm-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-7.072 7.072a9 9 0 010-12.728m3.536 3.536a4 4 0 010 5.656"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-deep mb-3">
          You&apos;re Offline
        </h1>
        <p className="text-warm-600 mb-8">
          It looks like you&apos;ve lost your internet connection. Don&apos;t worry, you can still access some features.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent/90 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full px-6 py-3 bg-warm-100 text-deep rounded-xl font-medium hover:bg-warm-200 transition-colors"
          >
            Go Back
          </button>
        </div>

        <p className="mt-8 text-sm text-warm-500">
          Some features require an internet connection. Your data will sync automatically when you&apos;re back online.
        </p>
      </div>
    </div>
  );
}
