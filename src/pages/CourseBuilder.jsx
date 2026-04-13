import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCoursewares } from "@/hooks/useCoursewares";
import CourseEditorFullscreen from "@/components/admin/CourseEditorFullscreen";

export default function CourseBuilder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const yearLevelKey = searchParams.get("yearLevel");
  const { getCourseware, isLoading } = useCoursewares();
  const yearLevel = yearLevelKey ? getCourseware(yearLevelKey) : null;

  if (isLoading && !yearLevel) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  if (!yearLevel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Course not found.</p>
      </div>
    );
  }

  return (
    <CourseEditorFullscreen 
      yearLevel={yearLevel} 
      onClose={() => navigate("/Admin?tab=coursewares")}
    />
  );
}