import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Play, Flame } from "lucide-react";
import { createPageUrl } from "@/utils";
import { getAllProgress } from "../progressStorage";
import StreakCard from "./StreakCard";

const STREAK_KEY = "startupreneur_streaks";

function getStreakData() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || "{}");
  } catch {
    return {};
  }
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function countConsecutiveDays(datesArray) {
  if (!datesArray || datesArray.length === 0) return 0;
  const sorted = [...new Set(datesArray)].sort().reverse();
  let streak = 0;
  let prev = null;
  for (const d of sorted) {
    if (!prev) {
      // Must include today or yesterday to be active
      const diff = (new Date(todayStr()) - new Date(d)) / 86400000;
      if (diff > 1) break;
      streak = 1;
      prev = d;
    } else {
      const diff = (new Date(prev) - new Date(d)) / 86400000;
      if (diff === 1) {
        streak++;
        prev = d;
      } else {
        break;
      }
    }
  }
  return streak;
}

export function recordLoginStreak() {
  const data = getStreakData();
  const today = todayStr();
  const loginDays = data.login_days || [];
  if (!loginDays.includes(today)) {
    loginDays.push(today);
    localStorage.setItem(STREAK_KEY, JSON.stringify({ ...data, login_days: loginDays }));
  }
}

export function recordVideoDay() {
  const data = getStreakData();
  const today = todayStr();
  const days = data.video_days || [];
  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem(STREAK_KEY, JSON.stringify({ ...data, video_days: days }));
  }
}

export function recordGoalDay() {
  const data = getStreakData();
  const today = todayStr();
  const days = data.goal_days || [];
  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem(STREAK_KEY, JSON.stringify({ ...data, goal_days: days }));
  }
}

export function recordCourseCompleteDay() {
  const data = getStreakData();
  const today = todayStr();
  const days = data.course_days || [];
  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem(STREAK_KEY, JSON.stringify({ ...data, course_days: days }));
  }
}

export default function StreaksSection() {
  const streaks = useMemo(() => {
    const data = getStreakData();
    return {
      login: countConsecutiveDays(data.login_days || []),
      video: countConsecutiveDays(data.video_days || []),
      goal: countConsecutiveDays(data.goal_days || []),
      course: countConsecutiveDays(data.course_days || []),
    };
  }, []);

  const progressMap = getAllProgress();
  const inProgress = Object.entries(progressMap).find(([, p]) =>
    p && (p.current_step_index > 0 || p.current_lesson_number > 0) &&
    !(p.lesson_completions && p.lesson_completions["1"] === true)
  );
  const resumeKey = inProgress?.[0];
  const resumeProgress = inProgress?.[1];

  const cards = [
    { label: "Days Logged In", value: streaks.login, icon: "📅", color: "bg-blue-100", active: streaks.login > 0 },
    { label: "Days Watching Videos", value: streaks.video, icon: "🎬", color: "bg-purple-100", active: streaks.video > 0 },
    { label: "Daily Goals Achieved", value: streaks.goal, icon: "🎯", color: "bg-green-100", active: streaks.goal > 0 },
    { label: "Courses Completed", value: streaks.course, icon: "🏆", color: "bg-amber-100", active: streaks.course > 0 },
  ];

  const totalFlame = Math.max(...Object.values(streaks));

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-base font-bold text-gray-900">Your Streaks</h2>
        </div>
        {totalFlame > 0 && (
          <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-200">
            🔥 {totalFlame} day streak
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {cards.map((c) => (
          <StreakCard key={c.label} {...c} />
        ))}
      </div>

      {resumeKey && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Continue where you left off</p>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">{resumeKey.replace("-", " ").replace(/(\w)/, c => c.toUpperCase())}</p>
          </div>
          <Button
            size="sm"
            className="brand-gradient text-white rounded-full gap-1.5 flex-shrink-0"
            onClick={() => {
              window.location.href = createPageUrl(`Viewer?yearLevel=${resumeKey}&resume=true`);
            }}
          >
            <Play className="w-3.5 h-3.5" />
            Resume
          </Button>
        </div>
      )}
    </div>
  );
}