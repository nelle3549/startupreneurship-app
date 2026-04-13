import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to Facilitator Portal",
    body: "Here you can monitor learner progress, identify who needs attention, and send notifications.",
    target: null,
    showOverlay: true,
  },
  {
    id: "dashboard",
    title: "Dashboard Overview",
    body: "View completion stats, pending learners, and average scores at a glance.",
    target: "[data-tour='dashboard-stats']",
    showOverlay: true,
  },
  {
    id: "filters",
    title: "Filter Learners",
    body: "Use search and cohort filters to find specific learners. Try them now!",
    target: "[data-tour='filters']",
    showOverlay: false, // Allow interaction
  },
  {
    id: "learner-list",
    title: "Learner Progress Table",
    body: "Each row shows a learner's completion, score, and status. Click a row to drill down.",
    target: "[data-tour='learner-table']",
    showOverlay: true,
  },
  {
    id: "select-pending",
    title: "Select All Pending",
    body: "Click this button to automatically select learners who are incomplete, inactive, or have low scores. Try it!",
    target: "[data-tour='select-pending']",
    showOverlay: false, // Allow clicking the button
  },
  {
    id: "notify",
    title: "Send Notifications",
    body: "After selecting learners, click Notify to send them reminders or encouragement.",
    target: "[data-tour='notify-button']",
    showOverlay: false,
  },
  {
    id: "finish",
    title: "You're All Set!",
    body: "You can now monitor progress and support your learners effectively.",
    target: null,
    showOverlay: true,
  },
];

export default function PortalOnboardingTour({ onComplete, onSkip }) {
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState({ top: "50%", left: "50%", mode: "center" });

  const currentStep = STEPS[step];

  React.useEffect(() => {
    // Always center the modal for all steps
    setPosition({ top: "50%", left: "50%", mode: "center" });
    
    // Scroll target into view if it exists
    if (currentStep.target) {
      const el = document.querySelector(currentStep.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [step, currentStep.target]);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Overlay */}
        {currentStep.showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 pointer-events-auto"
            onClick={handleSkip}
          />
        )}

        {/* Spotlight */}
        {currentStep.target && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
              borderRadius: "12px",
              pointerEvents: currentStep.showOverlay ? "none" : "auto",
              ...(() => {
                const el = document.querySelector(currentStep.target);
                if (!el) return {};
                const rect = el.getBoundingClientRect();
                return {
                  top: `${rect.top}px`,
                  left: `${rect.left}px`,
                  width: `${rect.width}px`,
                  height: `${rect.height}px`,
                };
              })(),
            }}
          />
        )}

        {/* Modal Wrapper (handles centering) */}
        <div
          className="absolute pointer-events-auto"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
        >
          {/* Modal (handles animation) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-[90vw]"
          >
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-2 pr-6">{currentStep.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{currentStep.body}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {step + 1} of {STEPS.length}
              </span>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={handleNext} className="brand-gradient text-white rounded-full px-6">
                  {step < STEPS.length - 1 ? "Next" : "Got it"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
}