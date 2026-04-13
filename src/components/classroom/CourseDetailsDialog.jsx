import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

export default function CourseDetailsDialog({ yearLevelKey, isOpen, onClose }) {
  const { data: courseDetails } = useQuery({
    queryKey: ["course-details", yearLevelKey],
    queryFn: () =>
      base44.entities.CourseDetails.filter({
        year_level_key: yearLevelKey,
      }).then(results => results[0] || null),
    enabled: isOpen && !!yearLevelKey,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between w-full">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-1">
                Introduction and Course Objectives
              </DialogTitle>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quote Section */}
          {courseDetails?.quote && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
              <p className="text-lg italic text-gray-900 mb-3">
                "{courseDetails.quote}"
              </p>
              {courseDetails.quoteAuthor && (
                <p className="text-sm text-gray-600">
                  — {courseDetails.quoteAuthor}
                </p>
              )}
            </div>
          )}

          {/* Summary */}
          {courseDetails?.subtitle && (
            <div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {courseDetails.subtitle}
              </p>
            </div>
          )}

          {/* Learning Goals */}
          {courseDetails?.objectives && courseDetails.objectives.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Learning Goals</h3>
              <p className="text-sm text-gray-600 mb-4">
                Through this course, you should be able to:
              </p>
              <div className="space-y-3">
                {courseDetails.objectives.map((objective, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-rose-700">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 pt-1">{objective}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}