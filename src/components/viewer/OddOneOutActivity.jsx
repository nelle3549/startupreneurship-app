import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";

const SETS = [
  {
    id: 1,
    items: ["Mirror", "Notebook", "Crayon", "Banana"],
    oddOne: "Banana",
    explanation: "Mirror, Notebook, and Crayon are all tools that help you learn about yourself. A Banana is food!"
  },
  {
    id: 2,
    items: ["Family photo", "Name tag", "Pencil", "Spoon"],
    oddOne: "Spoon",
    explanation: "Family photo, Name tag, and Pencil help you learn about yourself and your identity. A Spoon is a utensil!"
  },
  {
    id: 3,
    items: ["Heart sticker", "Smiley face", "Journal notebook", "Hammer"],
    oddOne: "Hammer",
    explanation: "Heart sticker, Smiley face, and Journal notebook are all related to self-discovery and emotions. A Hammer is a tool for building!"
  }
];

export default function OddOneOutActivity({ onComplete }) {
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [completedSets, setCompletedSets] = useState(0);
  const [shuffledItems, setShuffledItems] = useState([]);

  const currentSet = SETS[currentSetIdx];
  const isCorrect = selected === currentSet.oddOne;
  const isLastSet = completedSets + 1 === SETS.length;

  React.useEffect(() => {
    const shuffled = [...currentSet.items].sort(() => Math.random() - 0.5);
    setShuffledItems(shuffled);
  }, [currentSetIdx]);

  // Auto-complete on last correct answer
  const autoCompleteRef = React.useRef(false);
  React.useEffect(() => {
    if (isCorrect && feedback === "correct" && isLastSet && !autoCompleteRef.current) {
      autoCompleteRef.current = true;
      setTimeout(() => onComplete(), 1500);
    }
  }, [isCorrect, feedback, isLastSet, onComplete]);

  const handleSelect = (item) => {
    if (selected || feedback) return;
    setSelected(item);
    
    if (item === currentSet.oddOne) {
      setFeedback("correct");
    } else {
      setFeedback("incorrect");
      setTimeout(() => {
        setSelected(null);
        setFeedback(null);
      }, 1000);
    }
  };

  const handleContinue = () => {
    if (completedSets + 1 === SETS.length) {
      onComplete();
    } else {
      setCurrentSetIdx(currentSetIdx + 1);
      setSelected(null);
      setFeedback(null);
      setCompletedSets(completedSets + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {SETS.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 w-12 rounded-full transition-all ${
              idx < completedSets ? "bg-emerald-500" : idx === currentSetIdx ? "bg-blue-500" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-200">
        <p className="text-sm text-gray-700 font-medium">
          Which item does <span className="font-bold text-blue-700">NOT</span> belong?
        </p>
        <p className="text-xs text-gray-600 mt-1">Tap on the item that is the odd one out</p>
      </div>

      {/* Items Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSetIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="grid grid-cols-2 gap-3 sm:gap-4"
        >
          {shuffledItems.map((item, idx) => (
            <motion.button
              key={item}
              onClick={() => handleSelect(item)}
              disabled={selected !== null}
              whileHover={{ scale: selected === null ? 1.02 : 1 }}
              whileTap={{ scale: selected === null ? 0.98 : 1 }}
              className={`relative p-4 sm:p-5 rounded-2xl font-medium transition-all text-sm sm:text-base flex flex-col items-center justify-center gap-2 h-24 sm:h-28 ${
                selected === item
                  ? isCorrect
                    ? "bg-emerald-100 border-2 border-emerald-500 text-emerald-700"
                    : "bg-red-100 border-2 border-red-500 text-red-700"
                  : feedback
                  ? "bg-gray-100 border-2 border-gray-200 text-gray-400"
                  : "bg-white border-2 border-gray-200 text-gray-900 hover:border-blue-300 hover:bg-blue-50"
              } ${selected === null ? "cursor-pointer" : "cursor-default"}`}
            >
              <span className="text-xl sm:text-2xl">
                {item === "Mirror" && "🪞"}
                {item === "Notebook" && "📓"}
                {item === "Crayon" && "🖍️"}
                {item === "Banana" && "🍌"}
                {item === "Family photo" && "📷"}
                {item === "Name tag" && "🏷️"}
                {item === "Pencil" && "✏️"}
                {item === "Spoon" && "🥄"}
                {item === "Heart sticker" && "❤️"}
                {item === "Smiley face" && "😊"}
                {item === "Journal notebook" && "📔"}
                {item === "Hammer" && "🔨"}
              </span>
              <span className="text-xs sm:text-sm font-medium">{item}</span>
              
              {selected === item && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </motion.div>
              )}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-2xl p-4 text-center ${
              feedback === "correct"
                ? "bg-emerald-50 border-2 border-emerald-200"
                : "bg-red-50 border-2 border-red-200"
            }`}
          >
            <p className={`font-bold text-sm sm:text-base ${feedback === "correct" ? "text-emerald-700" : "text-red-700"}`}>
              {feedback === "correct" ? "✨ Correct!" : "Try again!"}
            </p>
            {feedback === "correct" && (
              <>
                <p className="text-xs sm:text-sm text-gray-700 mt-1">{currentSet.explanation}</p>
                {!isLastSet && (
                  <Button onClick={handleContinue} className="mt-3 brand-gradient text-white rounded-full px-6 text-sm">
                    Continue
                  </Button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set Counter */}
      <div className="text-center text-xs sm:text-sm text-gray-500">
        Set {completedSets + 1} of {SETS.length}
      </div>
    </div>
  );
}