"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";

type NewProfileModalProps = {
  open: boolean;
  onClose: () => void;
};

export function NewProfileModal({ open, onClose }: NewProfileModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl focus:outline-none" role="dialog" aria-modal="true">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">New profile</h2>
            <p className="text-sm text-slate-500">The full multi-step wizard will arrive in the next phase of the redesign.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <div className="mt-6 space-y-3 text-sm text-slate-600">
          <p>This modal currently acts as a placeholder while we rebuild the full ProfileForm wizard.</p>
          <p>
            The upcoming steps will include Identity → Health → Diet → Availability → Review, complete with Zod validation, autosave, and progressive
            disclosure. Stay tuned!
          </p>
        </div>
        <footer className="mt-8 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
