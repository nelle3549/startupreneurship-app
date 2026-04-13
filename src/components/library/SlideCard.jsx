import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function SlideCard({ slide, onView, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => onView(slide)}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 truncate">{slide.title}</h3>
              {slide.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{slide.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  View Presentation
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}