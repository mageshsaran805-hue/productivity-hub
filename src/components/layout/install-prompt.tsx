"use client";

import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { Download, X } from "lucide-react";
import { useState } from "react";

export function InstallPrompt() {
  const { canInstall, isStandalone, isIos, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (isStandalone || dismissed) return null;

  // On iOS there's no install event — show a hint instead.
  if (isIos) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-900/90 dark:bg-gray-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
          <Download className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Install Productivity Hub</p>
            <p className="text-xs text-gray-300 mt-0.5">
              Tap the Share button <span className="inline-block mx-0.5 px-1 rounded bg-white/10">Share</span> then{" "}
              <span className="font-medium text-white">Add to Home Screen</span> to install.
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!canInstall) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shrink-0">
          <Download className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Install Productivity Hub</p>
          <p className="text-xs text-gray-300">Use it like a native app, even offline.</p>
        </div>
        <button
          onClick={promptInstall}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-colors"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}