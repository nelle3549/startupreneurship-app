import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, X } from "lucide-react";

export default function ResumeModal({ open, yearLevel, onContinue, onReplay, onClose }) {
  if (!open || !yearLevel) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 z-10 text-center"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Continue where you left off?</h3>
          <p className="text-sm text-gray-500 mb-6">
            {yearLevel.grade}: {yearLevel.subtitle}
          </p>
          <div className="space-y-3">
            <Button
              onClick={onContinue}
              className="w-full brand-gradient text-white rounded-full gap-2"
            >
              <Play className="w-4 h-4" />
              Continue
            </Button>
            <Button
              variant="outline"
              onClick={onReplay}
              className="w-full rounded-full gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Replay Lesson 1
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}