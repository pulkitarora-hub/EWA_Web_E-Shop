"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as standalone
    const standalone = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if user has permanently installed the app
    const installed = localStorage.getItem("pwa-installed") === "true";
    if (installed || standalone) {
      return;
    }

    // Improved iOS detection (works with newer iOS versions)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const dismissedThisSession = sessionStorage.getItem("pwa-prompt-dismissed-session");
      if (!dismissedThisSession) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show iOS prompt after delay if not installed
    if (ios && !standalone) {
      const dismissedThisSession = sessionStorage.getItem("pwa-prompt-dismissed-session");
      if (!dismissedThisSession) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    }

    // Listen for successful app installation
    const appInstalledHandler = () => {
      localStorage.setItem("pwa-installed", "true");
      setShowPrompt(false);
    };
    window.addEventListener("appinstalled", appInstalledHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      localStorage.setItem("pwa-installed", "true");
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowPrompt(false);
    sessionStorage.setItem("pwa-prompt-dismissed-session", "true");
  }

  function handleIOSInstalled() {
    localStorage.setItem("pwa-installed", "true");
    setShowPrompt(false);
  }

  if (isStandalone || !showPrompt) return null;

  // Safari Share Icon (square with arrow pointing up)
  const SafariShareIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );

  return (
    <div className="fixed bottom-0 inset-x-0 p-4 z-50 animate-slide-up safe-area-bottom">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-warm-200 overflow-hidden">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <img
                src="/icons/icon-72x72.png"
                alt="App Icon"
                className="w-14 h-14 rounded-xl shadow-md"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-warm-900 mb-1">
                Install Evolve Wellness
              </h3>
              {isIOS ? (
                <div className="text-sm text-warm-600 mb-3">
                  <p className="mb-2">Add to your home screen for the best experience:</p>
                  <ol className="space-y-2 text-xs">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-xs">1</span>
                      <span>
                        Tap the <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-700 font-medium">
                          <SafariShareIcon /> Share
                        </span> button at the <strong>bottom of Safari</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-xs">2</span>
                      <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-xs">3</span>
                      <span>Tap <strong>"Add"</strong> in the top right corner</span>
                    </li>
                  </ol>
                </div>
              ) : (
                <p className="text-sm text-warm-600 mb-3">
                  Install our app for quick access, push notifications, and offline support.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {!isIOS && deferredPrompt && (
                  <button
                    onClick={handleInstall}
                    className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Install App
                  </button>
                )}
                {isIOS && (
                  <button
                    onClick={handleIOSInstalled}
                    className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Done, I've added it
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-warm-600 text-sm font-medium hover:text-warm-800 hover:bg-warm-100 rounded-lg transition-colors"
                >
                  Remind me later
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 text-warm-400 hover:text-warm-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* iOS Safari hint */}
        {isIOS && (
          <div className="bg-amber-50 px-4 py-3 border-t border-amber-100">
            <div className="flex items-center gap-2 text-xs text-amber-700">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span><strong>Note:</strong> You must use Safari browser. The share button <SafariShareIcon /> is at the bottom toolbar.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
