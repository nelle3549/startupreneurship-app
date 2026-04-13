import React from "react";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";

export default function StreakCard({ label, value, icon, color, active }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 flex flex-col items-center gap-2 border-2 transition-all ${
        active
          ? "bg-white border-orange-300 shadow-md"
          : "bg-white border-gray-100 opacity-60"
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${color}`}>
        {icon}
      </div>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-500 text-center leading-tight">{label}</span>
      {active && (
        <div className="flex items-center gap-1 text-orange-500">
          <Flame className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">Active</span>
        </div>
      )}
    </motion.div>
  );
}