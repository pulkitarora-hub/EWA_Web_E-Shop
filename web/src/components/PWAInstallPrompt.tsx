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

    // Improved iOS detection (works with newer iOS versions)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad with iPadOS
    setIsIOS(ios);

    // Listen for beforeinstallprompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay
      setTimeout(() => {
        const dismissed = localStorage.getItem("pwa-prompt-dismissed");
        const dismissedTime = localStorage.getItem("pwa-prompt-dismissed-time");
        
        // Show again if dismissed more than 7 days ago
        if (dismissedTime) {
          const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed > 7) {
            setShowPrompt(true);
            return;
          }
        }
        
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show iOS prompt after delay if not installed
    if (ios && !standalone) {
      setTimeout(() => {
        const dismissed = localStorage.getItem("pwa-prompt-dismissed");
        const dismissedTime = localStorage.getItem("pwa-prompt-dismissed-time");
        
        if (dismissedTime) {
          const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed > 7) {
            setShowPrompt(true);
            return;
          }
        }
        
        if (!dismissed) {
          setShowPrompt(true);
        }
      }, 3000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
    localStorage.setItem("pwa-prompt-dismissed-time", Date.now().toString());
  }

  if (isStandalone || !showPrompt) return null;

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
                Add to Home Screen
              </h3>
              {isIOS ? (
                <div className="text-sm text-warm-600 mb-3">
                  <p className="mb-2">Install this app for the best experience:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li className="flex items-center gap-2">
                      Tap the <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 rounded text-blue-700">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </span> Share button
                    </li>
                    <li>Scroll and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> in the top right</li>
                  </ol>
                </div>
              ) : (
                <p className="text-sm text-warm-600 mb-3">
                  Install our app for quick access, push notifications, and offline support.
                </p>
              )}
              <div className="flex items-center gap-2">
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
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-warm-600 text-sm font-medium hover:text-warm-800 hover:bg-warm-100 rounded-lg transition-colors"
                >
                  {isIOS ? "Got it" : "Not now"}
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
        
        {/* iOS visual guide */}
        {isIOS && (
          <div className="bg-warm-50 px-4 py-3 border-t border-warm-100">
            <div className="flex items-center justify-center gap-2 text-xs text-warm-500">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              <span>Works best in Safari</span>
              <span className="mx-1">•</span>
              <span>Look for share icon at bottom</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
