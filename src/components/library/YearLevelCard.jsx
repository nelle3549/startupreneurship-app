import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Circle, Download, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ICON_URL } from "../data/courseData";

const STATUS_CONFIG = {
  "not-started": { label: "Not Started", icon: Circle, color: "bg-gray-100 text-gray-600" },
  "in-progress": { label: "In Progress", icon: Clock, color: "bg-amber-100 text-amber-700" },
  "completed": { label: "Completed", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700" },
};

export default function YearLevelCard({ yearLevel, status, onOpen, onDownload, index }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["not-started"];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      data-tour="year-card"
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 cursor-pointer"
      onClick={() => onOpen(yearLevel)}
    >
      <div className="relative h-36 brand-gradient flex items-center justify-center overflow-hidden">
        <img src={ICON_URL} alt="Startupreneur" className="w-16 h-16 opacity-30 absolute right-4 bottom-2" />
        <div className="text-center z-10 px-4">
          <p className="text-white/80 text-xs font-medium uppercase tracking-wider">{yearLevel.grade}</p>
          <h3 className="text-white font-bold text-lg mt-1 leading-tight">{yearLevel.subtitle}</h3>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <Badge className={`${cfg.color} border-0 gap-1 text-xs font-medium`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </Badge>
        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{yearLevel.summary}</p>
        <div className="flex items-center justify-between pt-1">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-gray-400 hover:text-gray-700 gap-1 px-2"
            onClick={(e) => { e.stopPropagation(); onDownload(yearLevel); }}
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </Button>
          <Button
            size="sm"
            className="brand-gradient text-white text-xs px-4 rounded-full border-0 hover:opacity-90"
            onClick={(e) => { e.stopPropagation(); onOpen(yearLevel); }}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            Open
          </Button>
        </div>
      </div>
    </motion.div>
  );
}