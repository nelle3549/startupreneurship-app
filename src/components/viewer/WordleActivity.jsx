import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Delete } from "lucide-react";
import { pickRandomWordle } from "../data/activityData";

const KEYBOARD_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","DEL"],
];

function WordleGame({ wordObj, onWin, onLose, onHowToPlay }) {
  const word = wordObj.word.toUpperCase();
  const maxGuesses = 6;
  const [guesses, setGuesses] = useState([]);
  const [current, setCurrent] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const letterStatuses = useMemo(() => {
    const map = {};
    guesses.forEach(g => {
      g.split("").forEach((l, i) => {
        if (word[i] === l) map[l] = "correct";
        else if (word.includes(l) && map[l] !== "correct") map[l] = "present";
        else if (!map[l]) map[l] = "absent";
      });
    });
    return map;
  }, [guesses, word]);

  const handleKey = useCallback((key) => {
    if (gameOver) return;
    if (key === "DEL") {
      setCurrent(c => c.slice(0, -1));
    } else if (key === "ENTER") {
      if (current.length === word.length) {
        const newGuesses = [...guesses, current];
        setGuesses(newGuesses);
        if (current === word) {
          setGameOver(true);
          setWon(true);
          setTimeout(() => onWin(), 1500);
        } else if (newGuesses.length >= maxGuesses) {
          setGameOver(true);
          setTimeout(() => onLose(), 1500);
        }
        setCurrent("");
      }
    } else if (current.length < word.length) {
      setCurrent(c => c + key);
    }
  }, [current, guesses, word, gameOver, onWin, onLose]);

  // Physical keyboard support
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      const key = e.key.toUpperCase();
      if (key === "BACKSPACE" || key === "DELETE") {
        handleKey("DEL");
      } else if (key === "ENTER") {
        handleKey("ENTER");
      } else if (/^[A-Z]$/.test(key)) {
        handleKey(key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKey, gameOver]);

  const getLetterColor = (letter, idx, guess) => {
    if (word[idx] === letter) return "bg-emerald-500 text-white border-emerald-500";
    if (word.includes(letter)) return "bg-amber-400 text-white border-amber-400";
    return "bg-gray-400 text-white border-gray-400";
  };

  const emptyRows = maxGuesses - guesses.length - 1;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-gray-400">Hint: {wordObj.hint}</p>
      
      {/* Grid */}
      <div className="space-y-1">
        {guesses.map((guess, gi) => (
          <div key={gi} className="flex gap-1">
            {guess.split("").map((l, li) => (
              <motion.div
                key={li}
                initial={{ rotateX: 90 }}
                animate={{ rotateX: 0 }}
                transition={{ delay: li * 0.1 }}
                className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-base sm:text-lg font-bold rounded-lg border-2 ${getLetterColor(l, li, guess)}`}
              >
                {l}
              </motion.div>
            ))}
          </div>
        ))}
        {!gameOver && (
          <div className="flex gap-1">
            {Array.from({ length: word.length }).map((_, i) => (
              <div key={i} className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-base sm:text-lg font-bold rounded-lg border-2 ${
                current[i] ? "border-gray-400" : "border-gray-200"
              }`}>
                {current[i] || ""}
              </div>
            ))}
          </div>
        )}
        {Array.from({ length: Math.max(0, emptyRows) }).map((_, ri) => (
          <div key={ri} className="flex gap-1">
            {Array.from({ length: word.length }).map((_, i) => (
              <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-gray-100" />
            ))}
          </div>
        ))}
      </div>

      {/* Result */}
      {gameOver && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-1">
          {won ? (
            <p className="text-emerald-600 font-bold">You got it!</p>
          ) : (
            <p className="text-red-600 font-bold">The word was: {word}</p>
          )}
        </motion.div>
      )}

      {/* How to play */}
      <div className="flex justify-center">
        <button
          onClick={onHowToPlay}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          How to play
        </button>
      </div>

      {/* Keyboard */}
      <div className="space-y-1 w-full">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-0.5">
            {row.map(key => {
              const status = letterStatuses[key];
              let bg = "bg-gray-200 text-gray-700";
              if (status === "correct") bg = "bg-emerald-500 text-white";
              else if (status === "present") bg = "bg-amber-400 text-white";
              else if (status === "absent") bg = "bg-gray-400 text-white";

              const isEnter = key === "ENTER";
              const isDel = key === "DEL";
              const isSpecial = isEnter || isDel;

              let specialBg = "";
              if (isEnter) specialBg = "bg-emerald-500 hover:bg-emerald-600 text-white";
              else if (isDel) specialBg = "bg-rose-500 hover:bg-rose-600 text-white";

              return (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className={`${isSpecial ? specialBg : bg} rounded-md font-bold transition-colors active:opacity-70 flex items-center justify-center
                    ${isSpecial ? "px-1.5 text-[9px] min-w-[36px] h-10 sm:h-11" : "text-xs min-w-[28px] sm:min-w-[32px] h-10 sm:h-11"}
                  `}
                >
                  {key === "DEL" ? <Delete className="w-4 h-4" /> : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WordleActivity({ yearLevelKey, usedWords = [], onComplete, onWordsUsed }) {
  const words = useMemo(() => pickRandomWordle(yearLevelKey, usedWords, 2), [yearLevelKey]);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState([]);

  const handleWin = () => {
    const newResults = [...results, "win"];
    setResults(newResults);
    if (onWordsUsed) onWordsUsed([...usedWords, words[currentWordIdx]?.word]);
    if (currentWordIdx < words.length - 1) {
      setTimeout(() => setCurrentWordIdx(currentWordIdx + 1), 500);
    } else {
      setFinished(true);
      setTimeout(() => onComplete(), 500);
    }
  };

  const handleLose = () => {
    const newResults = [...results, "lose"];
    setResults(newResults);
    if (onWordsUsed) onWordsUsed([...usedWords, words[currentWordIdx]?.word]);
    if (currentWordIdx < words.length - 1) {
      setTimeout(() => setCurrentWordIdx(currentWordIdx + 1), 500);
    } else {
      setFinished(true);
      setTimeout(() => onComplete(), 500);
    }
  };

  if (words.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No Wordle words available.</p>
        <Button onClick={onComplete} className="mt-4">Continue</Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Wordle Complete!</h3>
        <p className="text-gray-500 text-sm">
          You solved {results.filter(r => r === "win").length} out of {words.length} words.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col items-center mb-4 gap-1">
        <span className="text-xs text-gray-400 font-medium">Word {currentWordIdx + 1} of {words.length}</span>
      </div>
      <WordleGame
        key={currentWordIdx}
        wordObj={words[currentWordIdx]}
        onWin={handleWin}
        onLose={handleLose}
        onHowToPlay={() => setShowHowToPlay(true)}
      />

      {/* How to Play Dialog */}
      <AnimatePresence>
        {showHowToPlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowHowToPlay(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">How to Play Wordle</h3>
              <div className="text-sm text-gray-600 space-y-3 mb-6">
                <p>Guess the word in 6 tries. Each has a hint to help you.</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 text-white flex items-center justify-center rounded font-bold text-xs flex-shrink-0">A</div>
                  <span>Green = correct letter, correct position</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-400 text-white flex items-center justify-center rounded font-bold text-xs flex-shrink-0">B</div>
                  <span>Yellow = correct letter, wrong position</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-400 text-white flex items-center justify-center rounded font-bold text-xs flex-shrink-0">C</div>
                  <span>Gray = letter not in the word</span>
                </div>
              </div>
              <Button onClick={() => setShowHowToPlay(false)} className="w-full brand-gradient text-white rounded-full">
                Got it
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}