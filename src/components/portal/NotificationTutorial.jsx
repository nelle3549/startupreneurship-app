import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";

const TUTORIAL_STEPS = [
  { id: "select", label: "1. Select learners", description: "Use checkboxes or 'Select All Pending' button" },
  { id: "notify", label: "2. Click Notify button", description: "Opens the notification dialog" },
  { id: "type", label: "3. Choose message type", description: "Select reminder, encouragement, or deadline" },
  { id: "send", label: "4. Send notification", description: "Click Send to deliver messages" },
];

export default function NotificationTutorial({ currentState, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  // currentState: "none" | "selected" | "dialog-open" | "sent"
  const activeStep = 
    currentState === "sent" ? 4 :
    currentState === "dialog-open" ? 2 :
    currentState === "selected" ? 1 :
    0;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 right-6 z-40 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 max-w-xs"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-bold text-sm text-gray-900">Sending Notifications</h4>
            <p className="text-xs text-gray-500 mt-0.5">Follow these steps</p>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {TUTORIAL_STEPS.map((s, i) => (
            <div key={s.id} className={`flex gap-3 ${i < activeStep ? "opacity-50" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i < activeStep ? "bg-emerald-100 text-emerald-600" :
                i === activeStep ? "brand-gradient text-white" :
                "bg-gray-100 text-gray-400"
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-xs font-semibold text-gray-900">{s.label}</p>
                <p className="text-xs text-gray-500">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
        {activeStep === 4 && (
          <Button onClick={handleDismiss} className="w-full mt-4 brand-gradient text-white rounded-full text-xs">
            Got it
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}