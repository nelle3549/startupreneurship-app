import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap } from "lucide-react";

export default function ActivityShortcuts({ activities, studentProgress, onActivitySelect }) {
  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Quick Access - Activities</h4>
      <div className="space-y-2">
        {activities.map((activity) => {
          // studentProgress is an array of attempt objects
          const activityAttempts = Array.isArray(studentProgress) 
            ? studentProgress.filter(p => p.activity_id === activity.id)
            : [];
          const latestAttempt = activityAttempts[activityAttempts.length - 1];
          const isCompleted = latestAttempt?.retake_status === "completed" || latestAttempt?.retake_status === "retake_completed";
          const score = latestAttempt?.score;

          return (
            <Button
              key={activity.id}
              variant="outline"
              size="sm"
              onClick={() => onActivitySelect(activity.id)}
              className="w-full justify-start h-auto py-2 px-3 text-left"
            >
              <div className="flex items-center justify-between flex-1 gap-2">
                <div className="flex items-center gap-2 flex-1">
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Zap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isCompleted && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                      {score !== undefined ? `${score}%` : "Done"}
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}