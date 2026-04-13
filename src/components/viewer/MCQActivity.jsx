import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { pickRandomMCQ } from "../data/activityData";

export default function MCQActivity({ yearLevelKey, questions: customQuestions, onComplete }) {
  const questions = useMemo(() => {
    if (customQuestions && customQuestions.length > 0) return customQuestions;
    return yearLevelKey ? pickRandomMCQ(yearLevelKey, 5) : [];
  }, [yearLevelKey, customQuestions]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No MCQ questions available for this level.</p>
        <Button onClick={onComplete} className="mt-4">Continue</Button>
      </div>
    );
  }

  const q = questions[currentIdx];

  const handleSelect = (idx) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === q.answer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
      const finalScore = selected === q.answer ? score + 1 : score;
      onComplete(Math.round((finalScore / questions.length) * 100));
    }
  };

  if (finished) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-full brand-gradient flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">{score}/{questions.length}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Quiz Complete!</h3>
        <p className="text-gray-500 text-sm">You scored {score} out of {questions.length} questions.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400 font-medium">Question {currentIdx + 1} of {questions.length}</span>
        <span className="text-xs text-emerald-600 font-medium">Score: {score}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div className="brand-gradient h-1.5 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-5">{q.q}</h3>
      <div className="space-y-3">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.answer;
          const isSelected = selected === i;
          let borderClass = "border-gray-200 hover:border-gray-300";
          if (showResult && isCorrect) borderClass = "border-emerald-400 bg-emerald-50";
          if (showResult && isSelected && !isCorrect) borderClass = "border-red-400 bg-red-50";

          return (
            <motion.button
              key={i}
              whileHover={!showResult ? { scale: 1.01 } : {}}
              onClick={() => handleSelect(i)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${borderClass}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                showResult && isCorrect ? "bg-emerald-100 text-emerald-600" :
                showResult && isSelected && !isCorrect ? "bg-red-100 text-red-600" :
                "bg-gray-100 text-gray-500"
              }`}>
                {showResult && isCorrect ? <CheckCircle className="w-4 h-4" /> :
                 showResult && isSelected && !isCorrect ? <XCircle className="w-4 h-4" /> :
                 String.fromCharCode(65 + i)}
              </div>
              <span className="text-sm">{opt}</span>
            </motion.button>
          );
        })}
      </div>
      {showResult && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center">
          <Button onClick={handleNext} className="brand-gradient text-white rounded-full px-8">
            {currentIdx < questions.length - 1 ? "Next Question" : "See Results"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}