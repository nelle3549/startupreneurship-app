import React from "react";
import { CheckCircle, Lock, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LessonNav({ lessons, currentLesson, completions, expandedLesson, onSelectLesson, onToggleExpand }) {
  return (
    <div className="space-y-1">
      {lessons.map((lesson) => {
        const isComplete = completions?.[String(lesson.num)];
        const isLocked = lesson.num > 1;
        const isCurrent = currentLesson === lesson.num;
        const isExpanded = expandedLesson === lesson.num;

        return (
          <div key={lesson.num}>
            <button
              onClick={() => {
                if (!isLocked) {
                  onSelectLesson(lesson.num);
                } else {
                  onToggleExpand(lesson.num);
                }
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm transition-all ${
                isCurrent && !isLocked
                  ? "bg-red-50 text-red-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isComplete ? "bg-emerald-100 text-emerald-600" :
                isCurrent && !isLocked ? "bg-red-100 text-red-600" :
                isLocked ? "bg-gray-100 text-gray-400" :
                "bg-gray-100 text-gray-500"
              }`}>
                {isComplete ? <CheckCircle className="w-3.5 h-3.5" /> :
                 isLocked ? <Lock className="w-3 h-3" /> :
                 lesson.num}
              </div>
              <span className={`flex-1 ${isExpanded && isLocked ? "whitespace-normal" : "truncate"}`}>{lesson.title}</span>
              {isLocked && (
                <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              )}
            </button>
            <AnimatePresence>
              {isLocked && isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden ml-9 mr-2"
                >
                  <div className="py-2 px-3 text-xs text-gray-500 space-y-2 border-l-2 border-gray-100">
                    <p className="font-medium text-gray-700">Summary</p>
                    <p>{lesson.summary}</p>
                    <p className="font-medium text-gray-700 mt-2">Objectives</p>
                    <ul className="list-disc ml-4 space-y-1">
                      {lesson.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {lesson.num === 1 && (
              <div className="mt-3 p-2 bg-amber-50 rounded-lg text-amber-700 text-xs">
                Only Lesson 1 is fully playable in the evaluation copy. Lessons 2 onward are locked, but you can still click each lesson to view its summary.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}