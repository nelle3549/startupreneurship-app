import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, RotateCcw } from "lucide-react";
import { format } from "date-fns";

export default function MCQCompletionPage({
  score,
  studentProgress,
  classroom,
  yearLevelKey,
  lessonNumber,
  user,
  onRetakeStart,
}) {
  const queryClient = useQueryClient();
  const [retakeConfirmDialog, setRetakeConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const highestScore = studentProgress?.highest_score ?? studentProgress?.overall_score ?? 0;
  const highestScoreDate = studentProgress?.highest_score_date;
  const allAttempts = studentProgress?.all_scores?.filter(a => a.activity_id === "mcq") || [];
  const mcqAttempts = allAttempts.length;

  // Retake eligibility
  const lessonAccessQuery = base44.entities.LessonAccess.filter({
    classroom_id: classroom.id,
    year_level_key: yearLevelKey,
    lesson_number: lessonNumber,
  });

  const handleRequestRetake = async () => {
    setLoading(true);
    try {
      // Update progress with retake request
      await base44.entities.StudentLessonProgress.update(studentProgress.id, {
        retake_requested: true,
        status: "retake_requested",
      });
      queryClient.invalidateQueries({ queryKey: ["student-lesson-progress"] });
      setRetakeConfirmDialog(false);
    } catch (err) {
      console.error("Failed to request retake:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRetake = () => {
    // Update status to retake_in_progress and trigger retake
    base44.entities.StudentLessonProgress.update(studentProgress.id, {
      status: "retake_in_progress",
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["student-lesson-progress"] });
      onRetakeStart();
    }).catch(console.error);
  };

  return (
    <div className="max-w-lg mx-auto py-12 px-4 text-center">
      {/* Score Display */}
      <div className="w-28 h-28 rounded-full brand-gradient flex items-center justify-center mx-auto mb-6">
        <span className="text-white text-4xl font-bold">{score}%</span>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
      <p className="text-gray-500 text-sm mb-6">You scored {score}% on the Assessment Quiz.</p>

      {/* Attempt History */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Highest Score:</span>
          <span className="font-semibold text-gray-900">{highestScore}%</span>
        </div>
        {highestScoreDate && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Achieved on:</span>
            <span className="text-gray-700">{format(new Date(highestScoreDate), "MMM d, yyyy")}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total Attempts:</span>
          <span className="font-semibold text-gray-900">{mcqAttempts}</span>
        </div>
      </div>

      {/* Retake Button or Status */}
      {studentProgress?.status === "retake_requested" ? (
        <div className="space-y-4">
          <Badge className="bg-amber-100 text-amber-700 border-0 gap-1 inline-flex">
            <RotateCcw className="w-3 h-3" />
            Retake Requested
          </Badge>
          <p className="text-xs text-gray-500">Your retake request is pending approval from your facilitator.</p>
        </div>
      ) : studentProgress?.status === "retake_approved" ? (
        <Button
          onClick={handleStartRetake}
          className="brand-gradient text-white rounded-full px-8 w-full gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Start Retake
        </Button>
      ) : (
        <Button
          onClick={() => setRetakeConfirmDialog(true)}
          variant="outline"
          className="rounded-full w-full gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Request Retake
        </Button>
      )}

      {/* Retake Confirmation Dialog */}
      <Dialog open={retakeConfirmDialog} onOpenChange={setRetakeConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Retake</DialogTitle>
            <DialogDescription>Are you sure you want to request a retake?</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• Your current highest score (<strong>{highestScore}%</strong>) will be retained.</p>
            <p>• Only your highest score across all attempts will be recorded.</p>
            <p className="text-amber-600 text-xs">Your request must be approved by your facilitator before you can retake.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetakeConfirmDialog(false)}>Cancel</Button>
            <Button onClick={handleRequestRetake} disabled={loading} className="brand-gradient text-white">
              {loading ? "Requesting..." : "Confirm Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}