import React from "react";
import { Share2, Check, Flame, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function AchievementDialog({ isOpen, onClose, userName, loginStreak, triesUsed, copied, onShare }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10"
        >
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-5">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Awesome job, {userName}!
            </h3>
            <p className="text-sm text-gray-500">
              Solved in {triesUsed} {triesUsed === 1 ? "try" : "tries"}!
            </p>
            {loginStreak > 0 && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-600">
                  {loginStreak}-day streak! Keep it up.
                </span>
              </div>
            )}
          </div>

          <Button
            onClick={onShare}
            variant="outline"
            className="w-full rounded-full gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? "Copied!" : "Share Achievement"}
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}