import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function MicroValidationActivity({ item, onComplete }) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSelect = (idx) => {
    setSelectedIdx(idx);
    setShowExplanation(true);
  };

  const isCorrect = selectedIdx === item.correct_answer;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{item.q}</h3>
      
      <div className="space-y-3 mb-6">
        {item.options?.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const optionClass = showExplanation && isSelected
            ? isCorrect
              ? "border-emerald-400 bg-emerald-50"
              : "border-red-400 bg-red-50"
            : "border-gray-200 hover:border-gray-300";

          return (
            <motion.button
              key={idx}
              whileHover={!showExplanation ? { scale: 1.01 } : {}}
              onClick={() => handleSelect(idx)}
              disabled={showExplanation}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${optionClass} ${
                showExplanation ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  showExplanation && isSelected
                    ? isCorrect
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {showExplanation && isSelected
                  ? isCorrect
                    ? "✓"
                    : "✕"
                  : String.fromCharCode(65 + idx)}
              </div>
              <span className="text-sm flex-1">{opt.text}</span>
            </motion.button>
          );
        })}
      </div>

      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-6"
        >
          <p className="text-sm text-blue-900">
            <strong>Explanation:</strong> {item.options[selectedIdx]?.explanation}
          </p>
        </motion.div>
      )}

      {showExplanation && (
        <Button
          onClick={onComplete}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Continue
        </Button>
      )}
    </div>
  );
}