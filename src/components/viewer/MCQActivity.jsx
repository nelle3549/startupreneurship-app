import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, RotateCw, ChevronDown, Clock } from "lucide-react";
import { pickRandomMCQ } from "../data/activityData";

const QUIZ_SIZE = 5;
const PASSING_THRESHOLD = 70;
const QUIZ_DURATION_SECONDS = 10 * 60; // 10 minutes

/**
 * Shuffle array using Fisher-Yates and pick `count` items.
 * Returns a new array — does not mutate the original.
 */
function pickRandom(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MCQActivity({
  yearLevelKey,
  questions: pool,
  title,
  onComplete,
  previousScore,
  highestScore,
  allScores,
  retakesEnabled,
  maxRetakes,
  retakeAttempts = 0,
  // Quiz-in-progress coordination with parent (Viewer):
  // `submitRef` — parent assigns a ref here; we set `.current` to a submitPartial fn.
  // `onInProgressChange(bool)` — fires when quiz starts/finishes so parent can guard nav.
  submitRef,
  onInProgressChange,
}) {
  // If the student has already taken this quiz and is not in a retake, show the past result summary.
  if (previousScore !== undefined && previousScore !== null) {
    const mcqAttempts = (allScores || []).filter(a => a.activity_id === "mcq");
    const best = highestScore ?? previousScore;
    const passed = previousScore >= PASSING_THRESHOLD;
    const hasMaxRetakes = maxRetakes !== null && maxRetakes !== undefined;
    const retakesLeft = hasMaxRetakes ? Math.max(0, maxRetakes - retakeAttempts) : null;
    return (
      <div className="max-w-xl mx-auto">
        {title && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 truncate">{title}</h2>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2.5 py-0.5 flex-shrink-0 ml-3">
              Completed
            </span>
          </div>
        )}
        <div className="text-center mb-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : "bg-gradient-to-br from-gray-300 to-gray-400"}`}>
            <span className="text-white text-3xl font-bold">{previousScore}%</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {passed ? "🎉 Passed" : "Quiz Completed"}
          </h3>
          <p className="text-gray-500 text-sm">
            Your latest score from your most recent attempt.
            {best !== previousScore && <span className="block text-xs text-gray-400 mt-0.5">Best overall: {best}%</span>}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RotateCw className="w-4 h-4 text-gray-400" />
            {!retakesEnabled ? (
              <span>Retakes are currently <span className="font-medium text-gray-700">disabled</span> for this lesson.</span>
            ) : retakesLeft === null ? (
              <span><span className="font-medium text-gray-900">{retakeAttempts}</span> retake{retakeAttempts === 1 ? "" : "s"} used · unlimited remaining</span>
            ) : retakesLeft === 0 ? (
              <span>You've used all <span className="font-medium text-gray-900">{maxRetakes}</span> retakes.</span>
            ) : (
              <span><span className="font-medium text-gray-900">{retakesLeft}</span> retake{retakesLeft === 1 ? "" : "s"} remaining · {retakeAttempts} of {maxRetakes} used</span>
            )}
          </div>
        </div>

        {mcqAttempts.length > 0 && (
          <div className="mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Attempt history</h4>
            <div className="space-y-1.5">
              {mcqAttempts.map((a, i) => {
                const isBest = a.score === best;
                const isLatest = i === mcqAttempts.length - 1;
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-lg text-sm">
                    <span className="text-gray-500 font-medium">Attempt #{i + 1}</span>
                    <div className="flex items-center gap-2">
                      {isLatest && <span className="text-[10px] uppercase tracking-wide bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Latest</span>}
                      {isBest && mcqAttempts.length > 1 && <span className="text-[10px] uppercase tracking-wide bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">Best</span>}
                      <span className={`font-semibold ${a.score >= PASSING_THRESHOLD ? "text-emerald-600" : "text-gray-900"}`}>{a.score}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4 text-center">
          To retake this quiz, request a retake from your Lessons tab.
        </p>
      </div>
    );
  }

  // seed changes on each mount and on retake, forcing new randomization
  const [seed, setSeed] = useState(0);

  // Question set is locked by useMemo for a given seed — no reshuffle on re-renders.
  const questions = useMemo(() => {
    if (pool && pool.length > 0) {
      const normalized = pool.map(src => ({
        q: src.q ?? src.question ?? "",
        options: src.options || [],
        answer: src.answer ?? src.correct_answer_index ?? 0,
      })).filter(q => q.q && q.options.length >= 2);
      return pickRandom(normalized, QUIZ_SIZE);
    }
    return yearLevelKey ? pickRandomMCQ(yearLevelKey, QUIZ_SIZE) : [];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, yearLevelKey, seed]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  // Answers per question. For unanswered questions (timeout/abandon), selectedIdx is null.
  const [answers, setAnswers] = useState([]); // [{ q, options, correctIdx, selectedIdx }]
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION_SECONDS);

  // Keep refs to the latest values so force-submit can be called from imperative
  // contexts (timer expiry, parent-triggered abandon) without stale closures.
  const stateRef = useRef({ questions, answers, selected, currentIdx, finished });
  useEffect(() => {
    stateRef.current = { questions, answers, selected, currentIdx, finished };
  }, [questions, answers, selected, currentIdx, finished]);

  const finalize = useCallback((finalAnswers) => {
    if (stateRef.current.finished) return;
    const correct = finalAnswers.filter(a => a.selectedIdx === a.correctIdx).length;
    setAnswers(finalAnswers);
    setFinished(true);
    if (onInProgressChange) onInProgressChange(false);
    onComplete(Math.round((correct / stateRef.current.questions.length) * 100));
  }, [onComplete, onInProgressChange]);

  // Build the final answers array, padding unanswered questions with selectedIdx=null.
  const buildFinalAnswers = useCallback((includeCurrentSelection = true) => {
    const { questions: qs, answers: ans, selected: sel, currentIdx: idx } = stateRef.current;
    const result = [...ans];
    // If the current question has a selection that isn't yet in answers, include it.
    if (includeCurrentSelection && sel !== null && result.length === idx) {
      result.push({ q: qs[idx].q, options: qs[idx].options, correctIdx: qs[idx].answer, selectedIdx: sel });
    }
    // Pad the rest as unanswered
    for (let i = result.length; i < qs.length; i++) {
      result.push({ q: qs[i].q, options: qs[i].options, correctIdx: qs[i].answer, selectedIdx: null });
    }
    return result;
  }, []);

  // Expose a partial-submit function to the parent via ref + signal when the quiz is active.
  useEffect(() => {
    if (finished || questions.length === 0) return;
    if (onInProgressChange) onInProgressChange(true);
    if (submitRef) submitRef.current = () => finalize(buildFinalAnswers(false));
    return () => {
      if (submitRef) submitRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, questions.length]);

  // Countdown timer. Auto-submits when it hits 0.
  useEffect(() => {
    if (finished || questions.length === 0) return;
    if (timeLeft <= 0) {
      finalize(buildFinalAnswers(true));
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, finished, questions.length, finalize, buildFinalAnswers]);

  // beforeunload warning for refresh/close while quiz is in progress.
  useEffect(() => {
    if (finished || questions.length === 0) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [finished, questions.length]);

  const handleRetake = useCallback(() => {
    setSeed(s => s + 1);
    setCurrentIdx(0);
    setSelected(null);
    setFinished(false);
    setAnswers([]);
    setTimeLeft(QUIZ_DURATION_SECONDS);
  }, []);

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No MCQ questions available.</p>
        <Button onClick={() => onComplete(0)} className="mt-4">Continue</Button>
      </div>
    );
  }

  const q = questions[currentIdx];

  const handleSelect = (idx) => {
    if (finished) return;
    setSelected(idx);
  };

  const handleNext = () => {
    if (selected === null) return;
    const entry = { q: q.q, options: q.options, correctIdx: q.answer, selectedIdx: selected };
    const nextAnswers = [...answers, entry];
    if (currentIdx < questions.length - 1) {
      setAnswers(nextAnswers);
      setCurrentIdx(currentIdx + 1);
      setSelected(null);
    } else {
      finalize(nextAnswers);
    }
  };

  if (finished) {
    const correctCount = answers.filter(a => a.selectedIdx === a.correctIdx).length;
    const pct = Math.round((correctCount / questions.length) * 100);
    const passed = pct >= PASSING_THRESHOLD;
    return (
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : "bg-gradient-to-br from-gray-300 to-gray-400"}`}>
            <span className="text-white text-3xl font-bold">{pct}%</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {passed ? "🎉 Nice work!" : "Quiz Complete"}
          </h3>
          <p className="text-gray-500 text-sm">
            {correctCount} out of {questions.length} correct
            {passed ? " — Passed" : ` · ${PASSING_THRESHOLD}% needed to pass`}
          </p>
        </div>

        <div className="mb-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">Review your answers</h4>
          <div className="space-y-2">
            {answers.map((a, i) => {
              const isCorrect = a.selectedIdx === a.correctIdx;
              const unanswered = a.selectedIdx === null;
              return (
                <details key={i} className="group border border-gray-200 rounded-lg bg-white open:bg-gray-50">
                  <summary className="flex items-start gap-3 p-3 cursor-pointer list-none select-none">
                    {isCorrect
                      ? <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                    <p className="flex-1 text-sm text-gray-900 leading-snug">
                      <span className="font-semibold text-gray-500 mr-1">Q{i + 1}.</span>{a.q}
                      {unanswered && <span className="ml-2 text-[10px] uppercase tracking-wide text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">Not answered</span>}
                    </p>
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-3 pb-3 space-y-1.5">
                    {a.options.map((opt, oi) => {
                      const isRight = oi === a.correctIdx;
                      const isPicked = oi === a.selectedIdx;
                      const wrongPick = isPicked && !isRight;
                      return (
                        <div
                          key={oi}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs ${
                            isRight ? "bg-emerald-100 text-emerald-800 font-medium" :
                            wrongPick ? "bg-red-100 text-red-800" :
                            "text-gray-600"
                          }`}
                        >
                          <span className="font-bold">{String.fromCharCode(65 + oi)}.</span>
                          <span className="flex-1">{opt}</span>
                          {isRight && <span className="text-[10px] uppercase tracking-wide">Correct</span>}
                          {wrongPick && <span className="text-[10px] uppercase tracking-wide">Your pick</span>}
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </div>

        {pool && pool.length > QUIZ_SIZE && (
          <Button variant="outline" onClick={handleRetake} className="gap-2 w-full">
            <RotateCw className="w-4 h-4" />
            Retake with New Questions
          </Button>
        )}
      </div>
    );
  }

  const timerDanger = timeLeft <= 60;

  return (
    <div className="max-w-2xl mx-auto">
      {title && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 gap-3">
          <h2 className="text-lg font-bold text-gray-900 truncate">{title}</h2>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold border rounded-full px-2.5 py-0.5 tabular-nums ${timerDanger ? "bg-red-50 text-red-700 border-red-200 animate-pulse" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2.5 py-0.5">
              Graded · {questions.length}Q
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 font-medium">Question {currentIdx + 1} of {questions.length}</span>
        <span className="text-xs text-gray-400">Answers are revealed at the end</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6">
        <div className="brand-gradient h-1.5 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-5">{q.q}</h3>
      <div className="space-y-3">
        {q.options.map((opt, i) => {
          const isSelected = selected === i;
          const borderClass = isSelected
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300";
          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.01 }}
              onClick={() => handleSelect(i)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${borderClass}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSelected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                {String.fromCharCode(65 + i)}
              </div>
              <span className="text-sm">{opt}</span>
            </motion.button>
          );
        })}
      </div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center">
        <Button
          onClick={handleNext}
          disabled={selected === null}
          className="brand-gradient text-white rounded-full px-8 disabled:opacity-50"
        >
          {currentIdx < questions.length - 1 ? "Next Question" : "Submit Quiz"}
        </Button>
      </motion.div>
    </div>
  );
}
