import React, { useState, useEffect, useCallback } from "react";
import { Gamepad2, UserPlus, Share2, Check } from "lucide-react";
import AchievementDialog from "./AchievementDialog";
import { Button } from "@/components/ui/button";
import { getSavedUser } from "../userStorage";
import { useQuery, useMutation } from "@tanstack/react-query";
import { entities } from "@/api/entities";
import LoginSignup from "../registration/LoginSignup";

const FALLBACK_WORDS = [
  { word: "PITCH", hint: "What entrepreneurs do to investors" },
  { word: "BRAND", hint: "Your business identity" },
  { word: "GRANT", hint: "Free money for your project" },
  { word: "SCALE", hint: "Growing your startup bigger" },
  { word: "PIVOT", hint: "Changing your business direction" },
  { word: "FUNDS", hint: "Capital for your venture" },
  { word: "AGILE", hint: "Flexible development approach" },
  { word: "VALUE", hint: "What you offer customers" },
  { word: "ANGEL", hint: "Early-stage investor type" },
  { word: "LEARN", hint: "The entrepreneur's daily habit" },
  { word: "NICHE", hint: "Specialized market segment" },
  { word: "VIRAL", hint: "Spreading rapidly online" },
];

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

function getDayWord(wordList) {
  const today = new Date().toISOString().split("T")[0];
  const all = wordList && wordList.length > 0 ? wordList : FALLBACK_WORDS;
  const active = all.filter(w => !w.hidden);
  // Check for a scheduled entry for today first
  const scheduled = active.find(w => w.scheduled_date === today);
  if (scheduled) return scheduled;
  // Fall back to rotation (only entries without a scheduled_date or past-dated ones)
  const rotatable = active.filter(w => !w.scheduled_date || w.scheduled_date < today);
  if (rotatable.length === 0) return active[0] || FALLBACK_WORDS[0];
  const start = new Date("2024-01-01");
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return rotatable[diff % rotatable.length];
}

export function getLoginStreak() {
  try {
    const data = JSON.parse(localStorage.getItem("startupreneur_streaks") || "{}");
    const days = data.login_days || [];
    if (days.length === 0) return 0;
    const today = new Date().toISOString().split("T")[0];
    const sorted = [...new Set(days)].sort().reverse();
    let streak = 0;
    let prev = null;
    for (const d of sorted) {
      if (!prev) {
        const diff = (new Date(today) - new Date(d)) / 86400000;
        if (diff > 1) break;
        streak = 1; prev = d;
      } else {
        const diff = (new Date(prev) - new Date(d)) / 86400000;
        if (diff === 1) { streak++; prev = d; } else break;
      }
    }
    return streak;
  } catch { return 0; }
}

const KEYBOARD_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

const tileColors = {
  correct: "bg-emerald-500 border-emerald-500 text-white",
  present: "bg-amber-400 border-amber-400 text-white",
  absent: "bg-gray-400 border-gray-400 text-white",
  empty: "bg-white border-gray-300 text-gray-900",
  active: "bg-white border-gray-500 text-gray-900",
};

const keyColors = {
  correct: "bg-emerald-500 text-white",
  present: "bg-amber-400 text-white",
  absent: "bg-gray-400 text-white",
};

function WordleGame({ onComplete, wordList }) {
  const { word: TARGET, hint: HINT } = getDayWord(wordList);
  const [guesses, setGuesses] = useState([]);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState("playing");
  const [shake, setShake] = useState(false);

  const getLetterStates = useCallback(() => {
    const states = {};
    guesses.forEach(guess => {
      guess.split("").forEach((letter, i) => {
        if (TARGET[i] === letter) states[letter] = "correct";
        else if (TARGET.includes(letter) && states[letter] !== "correct") states[letter] = "present";
        else if (!states[letter]) states[letter] = "absent";
      });
    });
    return states;
  }, [guesses, TARGET]);

  const getTileState = (guess, i) => {
    if (TARGET[i] === guess[i]) return "correct";
    if (TARGET.includes(guess[i])) return "present";
    return "absent";
  };

  const submitGuess = useCallback(() => {
    if (current.length !== WORD_LENGTH) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const newGuesses = [...guesses, current];
    setGuesses(newGuesses);
    setCurrent("");
    if (current === TARGET) {
      setStatus("won");
      onComplete("won", newGuesses.length);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setStatus("lost");
      onComplete("lost", MAX_GUESSES);
    }
  }, [current, guesses, TARGET, onComplete]);

  const handleKey = useCallback((key) => {
    if (status !== "playing") return;
    if (key === "ENTER") { submitGuess(); return; }
    if (key === "⌫" || key === "BACKSPACE") { setCurrent(p => p.slice(0, -1)); return; }
    if (/^[A-Z]$/.test(key) && current.length < WORD_LENGTH) setCurrent(p => p + key);
  }, [status, current, submitGuess]);

  useEffect(() => {
    const handler = (e) => handleKey(e.key.toUpperCase());
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const letterStates = getLetterStates();

  return (
    <div className="flex flex-col items-center h-full w-full">
      <p className="text-center text-xs text-gray-500 mb-2 sm:mb-3">
        💡 Hint: <span className="font-medium text-gray-700">{HINT}</span>
      </p>

      {/* Grid — compact on mobile */}
      <div className="flex flex-col items-center gap-1 sm:gap-1.5 mb-2 sm:mb-4 flex-shrink-0">
        {Array.from({ length: MAX_GUESSES }).map((_, row) => {
          const guess = guesses[row];
          const isActive = row === guesses.length && status === "playing";
          const displayWord = isActive ? current : (guess || "");
          return (
            <div key={row} className={`flex gap-1 sm:gap-1.5 ${isActive && shake ? "animate-bounce" : ""}`}>
              {Array.from({ length: WORD_LENGTH }).map((_, col) => {
                const letter = displayWord[col] || "";
                let colorClass = tileColors.empty;
                if (guess) colorClass = tileColors[getTileState(guess, col)];
                else if (isActive && letter) colorClass = tileColors.active;
                return (
                  <div key={col} className={`w-10 h-10 sm:w-12 sm:h-12 border-2 rounded-lg flex items-center justify-center text-sm sm:text-base font-bold uppercase transition-all ${colorClass}`}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Status */}
      {status === "won" && (
        <div className="text-center mb-2 sm:mb-3 p-2 sm:p-3 bg-emerald-50 rounded-xl w-full max-w-xs">
          <p className="text-emerald-700 font-bold text-xs sm:text-sm">🎉 You got it in {guesses.length} {guesses.length === 1 ? "try" : "tries"}!</p>
        </div>
      )}
      {status === "lost" && (
        <div className="text-center mb-2 sm:mb-3 p-2 sm:p-3 bg-red-50 rounded-xl w-full max-w-xs">
          <p className="text-red-700 font-bold text-xs sm:text-sm">The word was <span className="uppercase">{TARGET}</span>. Try again tomorrow!</p>
        </div>
      )}

      {/* Keyboard — compact on mobile */}
      <div className="flex flex-col items-center gap-1 sm:gap-1.5 mt-auto flex-shrink-0 w-full max-w-sm">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex gap-0.5 sm:gap-1 justify-center">
            {row.map(key => {
              const state = letterStates[key];
              const isEnter = key === "ENTER";
              const isBackspace = key === "⌫";
              const isSpecial = isEnter || isBackspace;
              let specialClass = "";
              if (isEnter) specialClass = "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md";
              else if (isBackspace) specialClass = "bg-rose-500 hover:bg-rose-600 text-white shadow-md";
              return (
                <button
                  key={key}
                  onClick={() => handleKey(key)}
                  className={`${isSpecial ? "px-2 sm:px-3 text-[10px] sm:text-xs h-9 sm:h-10" : "w-7 sm:w-8 h-9 sm:h-10"} rounded-md sm:rounded-lg font-bold text-[10px] sm:text-xs uppercase transition-colors ${isSpecial ? specialClass : state ? keyColors[state] : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function GuestStreakDialog({ onClose, emoji, title, subtitle }) {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full z-10">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg font-bold leading-none">✕</button>
          <div className="text-center mb-4">
            <div className="text-5xl mb-3">{emoji}</div>
            <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          <Button
            onClick={() => setShowLogin(true)}
            className="w-full brand-gradient text-white rounded-full gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Create Account
          </Button>
        </div>
      </div>
      {showLogin && (
        <LoginSignup
          onComplete={() => window.location.reload()}
          onCancel={() => setShowLogin(false)}
          defaultSignup={true}
        />
      )}
    </>
  );
}

export default function GameOfTheDay() {
  const [gameState, setGameState] = useState("idle");
  const [triesUsed, setTriesUsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const currentUser = getSavedUser();
  const loginStreak = currentUser ? getLoginStreak() : 0;

  const { data: dbWords = [] } = useQuery({
    queryKey: ["wordle-words"],
    queryFn: () => entities.WordleWord.list("order"),
  });

  const archiveMutation = useMutation({
    mutationFn: (data) => entities.HistoryArchive.create(data),
  });

  const dayGame = getDayWord(dbWords);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const stored = localStorage.getItem("lastArchivedGame");
    if (stored !== today && dayGame?.id && !dayGame.hidden) {
      archiveMutation.mutate({
        content_type: "game",
        content_id: dayGame.id,
        title: dayGame.word || "Untitled Game",
        featured_date: today,
        meta: { word: dayGame.word, hint: dayGame.hint, activity_type: dayGame.activity_type }
      });
      localStorage.setItem("lastArchivedGame", today);
    }
  }, [dayGame?.id]);

  const handleComplete = (result, tries) => {
    setTriesUsed(tries);
    setGameState(result);
  };

  const handleShare = () => {
    const text = `🟩 I solved today's Startupreneur Wordle in ${triesUsed} ${triesUsed === 1 ? "try" : "tries"}! 🔥 ${loginStreak} day streak. Can you beat me?`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Gamepad2 className="w-5 h-5 text-gray-700" />
        <h2 className="text-base font-bold text-gray-900">Game of the Day</h2>

      </div>

      {/* Idle: CTA card */}
      {gameState === "idle" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 flex flex-col items-center text-center gap-4">
          <img src="https://media.base44.com/images/public/69b63e711b4bea41ed3a5bd7/6d1da058f_image.png" alt="Wordle" className="w-20 h-20" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Today's Entrepreneur Wordle</h3>
            <p className="text-sm text-gray-500 mb-4">Guess the 5-letter startup/business word. New word every day. Challenge yourself!</p>
            <Button
              onClick={() => setGameState("playing")}
              className="brand-gradient text-white rounded-full px-6 gap-2"
            >
              <Gamepad2 className="w-4 h-4" />
              Play Today's Word
            </Button>
          </div>
        </div>
      )}

      {/* Floating Wordle Dialog */}
      {gameState !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => gameState !== "playing" && setGameState("idle")} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-[95vw] max-w-md mx-auto flex flex-col max-h-[95dvh] overflow-hidden">
            {/* Dialog header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-bold text-gray-900">Entrepreneur Wordle</h3>
              </div>
              <button
                onClick={() => setGameState("idle")}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold leading-none p-1"
              >
                ✕
              </button>
            </div>

            {/* Game content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 sm:py-4 flex flex-col min-h-0">
              <WordleGame onComplete={handleComplete} wordList={dbWords} />
            </div>

            {/* Post-game overlays */}
            {gameState === "won" && (
              currentUser ? (
                <AchievementDialog
                  isOpen={true}
                  onClose={() => setGameState("idle")}
                  userName={currentUser.first_name ? currentUser.first_name.charAt(0).toUpperCase() + currentUser.first_name.slice(1).toLowerCase() : "Champion"}
                  loginStreak={loginStreak}
                  triesUsed={triesUsed}
                  copied={copied}
                  onShare={handleShare}
                />
              ) : (
                <GuestStreakDialog onClose={() => setGameState("idle")} emoji="🔥" title="Want to track your winning streak?" subtitle="Create a free account to record your daily wins and build your streak." />
              )
            )}

            {gameState === "lost" && !currentUser && (
              <GuestStreakDialog onClose={() => setGameState("idle")} emoji="💪" title="Better luck tomorrow!" subtitle="Create an account to track your progress and come back stronger." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}