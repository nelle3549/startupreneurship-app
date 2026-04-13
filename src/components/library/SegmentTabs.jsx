import React from "react";
import { motion } from "framer-motion";
import { SEGMENTS } from "../data/courseData";

export default function SegmentTabs({ active, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap justify-center sm:justify-start" data-tour="segments">
      {SEGMENTS.map(seg => (
        <button
          key={seg.id}
          onClick={() => onChange(seg.id)}
          className={`relative px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
            active === seg.id
              ? "text-white shadow-lg"
              : "text-gray-600 bg-white border border-gray-200 hover:border-gray-300"
          }`}
        >
          {active === seg.id && (
            <motion.div
              layoutId="segment-pill"
              className="absolute inset-0 brand-gradient rounded-full"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10">{seg.label}</span>
        </button>
      ))}
    </div>
  );
}