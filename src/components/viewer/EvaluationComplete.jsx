import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft, Download, BookOpen, FileText } from "lucide-react";
import { createPageUrl } from "@/utils";
import { ICON_URL } from "../data/courseData";

export default function EvaluationComplete({ yearLevel, onGoPortal, onGoLibrary, onViewLocked, onViewSlide }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto text-center py-12 px-6"
    >
      <div className="w-20 h-20 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center mx-auto mb-6">
        <img src={ICON_URL} alt="" className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Evaluation Complete!</h2>
      <p className="text-gray-500 text-sm mb-8">
        You've completed the Lesson 1 deep demo for {yearLevel.grade}: {yearLevel.subtitle}. 
        Explore the Facilitator Portal to see the monitoring and notification experience.
      </p>
      <div className="space-y-3">
        <Button
          onClick={onViewLocked}
          className="w-full brand-gradient text-white rounded-full gap-2 py-3"
        >
          <BookOpen className="w-4 h-4" />
          View all lesson summaries
        </Button>
        <Button
          onClick={onGoPortal}
          variant="outline"
          className="w-full rounded-full gap-2 py-3"
        >
          <Users className="w-4 h-4" />
          Open Facilitator Portal
        </Button>
        <Button
          variant="outline"
          onClick={onViewSlide}
          className="w-full rounded-full gap-2 py-3"
        >
          <FileText className="w-4 h-4" />
          View Lesson PPT
        </Button>
        <Button
          variant="outline"
          onClick={onGoLibrary}
          className="w-full rounded-full gap-2 py-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Evaluate Another Year Level
        </Button>
      </div>
    </motion.div>
  );
}