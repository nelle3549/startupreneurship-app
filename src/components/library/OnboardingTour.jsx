import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ICON_URL } from "../data/courseData";

const getSteps = (userName) => [
  {
    id: "welcome",
    title: `Welcome to Startupreneur, ${userName}!`,
    body: "Choose a segment, pick a year level, and complete the Lesson 1 deep demo to experience the course.",
    target: null,
  },
  {
    id: "segments",
    title: "Choose a Segment",
    body: "These tabs let you filter by Grade 1–6, Grade 7–12, or College. Click any to browse year levels.",
    target: "[data-tour='segments']",
  },
  {
    id: "year-card",
    title: "Year Level Cards",
    body: "Each card shows the book title, your status badge, and a Download PDF action. Click a card to start!",
    target: "[data-tour='year-card']",
  },
  {
    id: "finish",
    title: "You're Ready!",
    body: "Choose a year level to begin your evaluation. You can always come back here.",
    target: null,
  },
];

export default function OnboardingTour({ hasProgress, onComplete, userName = "Evaluator" }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  // Step 3 (resume behavior) only shows if there's progress
  const STEPS = getSteps(userName);
  const steps = hasProgress ? STEPS : STEPS.filter(s => s.id !== "resume");

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      setVisible(false);
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    setVisible(false);
    onComplete();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/40" onClick={handleSkip} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 z-10"
          >
            <button onClick={handleSkip} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            {current.id === "welcome" && (
              <img src={ICON_URL} alt="Startupreneur" className="w-12 h-12 mb-3" />
            )}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 font-medium">Step {step + 1} of {steps.length}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{current.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">{current.body}</p>
            <div className="flex items-center justify-between">
              <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-gray-600">Skip</button>
              <Button onClick={handleNext} className="brand-gradient text-white rounded-full px-6">
                {isLast ? "Choose a Year Level" : "Next"}
              </Button>
            </div>
            <div className="flex gap-1 justify-center mt-4">
              {steps.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-red-500 w-6" : "bg-gray-200"}`} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}