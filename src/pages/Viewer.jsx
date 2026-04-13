import React, { useState, useEffect, useMemo, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, ArrowRight, CheckCircle, Info, Lock, BookOpen, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCurrentUser } from "../components/useCurrentUser";
import { ICON_URL } from "../components/data/courseData";
import { useCoursewares } from "../hooks/useCoursewares";
import { hasWordle, pickRandomMCQ } from "../components/data/activityData";
import MCQActivity from "../components/viewer/MCQActivity";
import MCQCompletionPage from "../components/viewer/MCQCompletionPage";
import WordleActivity from "../components/viewer/WordleActivity";

import ImageViewer from "../components/viewer/ImageViewer";
import SlideViewer from "../components/library/SlideViewer";

import MatchObjectsToBusinessesActivity from "../components/viewer/MatchObjectsToBusinessesActivity";
import OddOneOutActivity from "../components/viewer/OddOneOutActivity";
import JigsawPuzzleActivity from "../components/viewer/JigsawPuzzleActivity";

import LessonRenderer from "../components/viewer/LessonRenderer";

function getSteps(yearLevelKey, lessonNumber, dbLessonContent, courseDetails) {
  // Lesson 0 = Course Overview
  if (lessonNumber === 0) {
    return [
      { id: "course_overview", label: "Course Overview", type: "course_overview" },
      { id: "complete", label: "Mark as Complete", type: "static" },
    ];
  }

  const baseSteps = [];

  // Add lesson objectives as first step if available
  if (dbLessonContent?.lesson_objectives && dbLessonContent.lesson_objectives.length > 0) {
    baseSteps.push({
      id: "objectives",
      label: "Learning Objectives",
      type: "objectives"
    });
  }

  // Add sections from database if available
  if (dbLessonContent?.sections && dbLessonContent.sections.length > 0) {
    dbLessonContent.sections.forEach((section) => {
      baseSteps.push({
        id: section.id,
        label: section.title || "Section",
        type: "content"
      });
    });
  }

  baseSteps.push({ id: "complete", label: "Mark as Complete", type: "static" });

  return baseSteps;
}

export default function Viewer() {
  const params = new URLSearchParams(window.location.search);
  const yearLevelKey = params.get("yearLevel") || "grade-1";
  const lessonNumber = params.get("lesson") !== null ? parseInt(params.get("lesson"), 10) : 1;
  const isResume = params.get("resume") === "true";
  const isReplay = params.get("replay") === "true";
  const returnTo = params.get("returnTo"); // e.g. "CourseBuilder"
  const navigate = useNavigate();
  const { user, isAdmin, isFacilitator } = useCurrentUser();
  const isStudent = !isAdmin && !isFacilitator;
  const { getCourseware, isLoading: cwLoading } = useCoursewares();

  const yl = getCourseware(yearLevelKey);

  const [stepIdx, setStepIdx] = useState(0);
  const [activityDone, setActivityDone] = useState({});
  const [mcqScore, setMcqScore] = useState(null);
  const [reachedBottom, setReachedBottom] = useState(false);
  const mainScrollRef = React.useRef(null);
  const [selectedSlide, setSelectedSlide] = useState(null);
  const [inRetakeMode, setInRetakeMode] = useState(false);

  const { data: slides = [] } = useQuery({
    queryKey: ["presentation-slides"],
    queryFn: () => base44.entities.PresentationSlide.list("order"),
    initialData: []
  });

  // Get classroom ID from URL or localStorage (set when student joins via Portal)
  const classroomId = new URLSearchParams(window.location.search).get("classroomId") ||
    localStorage.getItem("currentClassroomId");

  // Check lesson access permissions
  const { data: lessonAccess = [], isLoading: accessLoading } = useQuery({
    queryKey: ["lesson-access", classroomId, yearLevelKey],
    queryFn: () => classroomId 
      ? base44.entities.LessonAccess.filter({ classroom_id: classroomId, year_level_key: yearLevelKey })
      : Promise.resolve([]),
    enabled: !!classroomId,
  });

  // Fetch all student progress for this classroom (needed for sequential completion check)
  const { data: allMyProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ["all-my-progress-viewer", classroomId, yearLevelKey, user?.id],
    queryFn: () => base44.entities.StudentLessonProgress.filter({
      classroom_id: classroomId,
      student_id: user.id,
      year_level_key: yearLevelKey,
    }),
    enabled: !!classroomId && !!user?.id && isStudent,
  });

  // Fetch lesson content from database (only for numbered lessons)
  const { data: dbLessonContent = null } = useQuery({
    queryKey: ["lesson-content-viewer", yearLevelKey, lessonNumber],
    queryFn: () => base44.entities.LessonContent.filter({
      year_level_key: yearLevelKey,
      lesson_number: lessonNumber
    }).then(results => results[0] || null),
    enabled: lessonNumber > 0,
  });

  // Fetch course details for Lesson 0
  const { data: courseDetails = null } = useQuery({
    queryKey: ["course-details-viewer", yearLevelKey],
    queryFn: () => base44.entities.CourseDetails.filter({ year_level_key: yearLevelKey }).then(r => r[0] || null),
    enabled: lessonNumber === 0,
  });

  // Build steps after dbLessonContent is available
  const steps = useMemo(() => getSteps(yearLevelKey, lessonNumber, dbLessonContent, courseDetails), [yearLevelKey, lessonNumber, dbLessonContent, courseDetails]);

  // Fetch current student lesson progress (for MCQ completion state)
  const { data: currentStudentProgress } = useQuery({
    queryKey: ["current-student-progress", classroomId, yearLevelKey, lessonNumber, user?.id],
    queryFn: () => classroomId && user?.id
      ? base44.entities.StudentLessonProgress.filter({
          classroom_id: classroomId,
          student_id: user.id,
          year_level_key: yearLevelKey,
          lesson_number: lessonNumber,
        }).then(results => results[0] || null)
      : Promise.resolve(null),
    enabled: !!classroomId && !!user?.id,
  });



  useEffect(() => {
    setStepIdx(0);
  }, []);

  // Reset reachedBottom whenever the step changes
  useEffect(() => {
    setReachedBottom(false);
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0 });
    }
  }, [stepIdx]);

  // Track scroll position to detect bottom
  useEffect(() => {
    const el = mainScrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      if (atBottom) setReachedBottom(true);
    };
    el.addEventListener("scroll", handleScroll);
    // Check immediately in case content is shorter than viewport
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, [stepIdx]);

  const currentStep = steps[stepIdx];
  const isActivity = currentStep?.type === "activity";
  const activityReady = !isActivity || activityDone[currentStep?.id];
  const canGoNext = activityReady && reachedBottom;

  const scrollPageDown = () => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollBy({ top: mainScrollRef.current.clientHeight * 0.8, behavior: "smooth" });
    }
  };

  const goNext = () => {
    if (!canGoNext) {
      scrollPageDown();
      return;
    }
    if (stepIdx < steps.length - 1) {
      let next = stepIdx + 1;
      // Skip MCQ step if no questions available
      if (steps[next]?.id === "mcq" && pickRandomMCQ(yearLevelKey, 5).length === 0) {
        next = next + 1;
      }
      if (next < steps.length) {
        setStepIdx(next);
        // Save in-progress to StudentLessonProgress (students only)
        if (classroomId && user?.id && isStudent) {
          base44.entities.StudentLessonProgress.filter({
            classroom_id: classroomId,
            student_id: user.id,
            year_level_key: yearLevelKey,
            lesson_number: lessonNumber,
          }).then((existing) => {
            const data = { current_step_index: next, total_steps: steps.length };
            if (existing.length > 0) {
              base44.entities.StudentLessonProgress.update(existing[0].id, data);
            } else {
              base44.entities.StudentLessonProgress.create({
                classroom_id: classroomId,
                student_id: user.id,
                year_level_key: yearLevelKey,
                lesson_number: lessonNumber,
                ...data,
              });
            }
          }).catch(console.error);
        }
      }
    }
  };

  const handleSkip = () => {
    if (stepIdx < steps.length - 1) {
      let next = stepIdx + 1;
      // Skip MCQ step if no questions available
      if (steps[next]?.id === "mcq" && pickRandomMCQ(yearLevelKey, 5).length === 0) {
        next = next + 1;
      }
      if (next < steps.length) {
        setStepIdx(next);
      }
    }
  };

  const goPrev = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };

  const handleMarkComplete = async () => {

    // Save StudentLessonProgress if in a classroom context (students only)
    if (classroomId && user?.id && isStudent) {
      try {
        const existing = await base44.entities.StudentLessonProgress.filter({
          classroom_id: classroomId,
          student_id: user.id,
          year_level_key: yearLevelKey,
          lesson_number: lessonNumber,
        });
        const activityScores = mcqScore !== null ? { mcq: mcqScore } : {};
        const prevRecord = existing.length > 0 ? existing[0] : null;
        const prevHighest = prevRecord?.highest_score ?? prevRecord?.overall_score ?? 0;
        const newScore = mcqScore ?? 0;
        const newHighest = Math.max(prevHighest, newScore);
        const newHighestDate = newScore >= prevHighest ? new Date().toISOString() : prevRecord?.highest_score_date;
        const prevAllScores = prevRecord?.all_scores || [];
        const newAllScores = mcqScore !== null
          ? [...prevAllScores, { score: newScore, timestamp: new Date().toISOString() }]
          : prevAllScores;
        const progressData = {
          completed: true,
          status: "completed",
          retake_requested: false,
          retake_approved: false,
          completion_date: new Date().toISOString(),
          current_step_index: steps.length - 1,
          total_steps: steps.length,
          activity_scores: activityScores,
          overall_score: newScore,
          highest_score: newHighest,
          highest_score_date: newHighestDate,
          all_scores: newAllScores,
        };
        if (existing.length > 0) {
          await base44.entities.StudentLessonProgress.update(existing[0].id, progressData);
        } else {
          await base44.entities.StudentLessonProgress.create({
            classroom_id: classroomId,
            student_id: user.id,
            year_level_key: yearLevelKey,
            lesson_number: lessonNumber,
            status: "completed",
            ...progressData,
          });
        }
      } catch (err) {
        console.error("Failed to save lesson progress:", err);
      }
    }

    // Log activity
    try {
      await base44.entities.UserActivity.create({
        activity_type: "lesson_completed",
        activity_details: { year_level_key: yearLevelKey, lesson_number: lessonNumber }
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }

    // Redirect back based on context
    if (returnTo === "CourseBuilder") {
      navigate(`/CourseBuilder?yearLevel=${yearLevelKey}`);
    } else if (classroomId) {
      window.location.href = `/ClassroomView?id=${classroomId}`;
    } else {
      navigate("/Home");
    }
  };

  const handleActivityComplete = (id, score) => {
    setActivityDone((prev) => ({ ...prev, [id]: true }));
    if (id === "mcq" && score !== undefined) {
      setMcqScore(score);
    }
    // Save in-progress state to StudentLessonProgress (students only)
    if (classroomId && user?.id && isStudent) {
      base44.entities.StudentLessonProgress.filter({
        classroom_id: classroomId,
        student_id: user.id,
        year_level_key: yearLevelKey,
        lesson_number: lessonNumber,
      }).then((existing) => {
        const timestamp = new Date().toISOString();
        const attemptNumber = existing.length > 0 
          ? (existing[0].all_scores?.filter(a => a.activity_id === id).length || 0) + 1
          : 1;
        
        const newScoreEntry = {
          activity_id: id,
          score: score,
          timestamp,
          attempt_number: attemptNumber,
          retake_status: inRetakeMode ? "retake_completed" : "completed",
        };

        const activityScores = id === "mcq" && score !== undefined ? { mcq: score } : {};
        const prevRecord = existing.length > 0 ? existing[0] : null;
        const prevHighest = prevRecord?.highest_score ?? prevRecord?.overall_score ?? 0;
        const newHighest = Math.max(prevHighest, score ?? 0);
        const newHighestDate = (score ?? 0) >= prevHighest ? timestamp : prevRecord?.highest_score_date;
        const prevAllScores = prevRecord?.all_scores || [];
        const newAllScores = [...prevAllScores, newScoreEntry];

        const data = {
          current_step_index: stepIdx,
          total_steps: steps.length,
          activity_scores: activityScores,
          overall_score: score,
          highest_score: newHighest,
          highest_score_date: newHighestDate,
          all_scores: newAllScores,
          status: inRetakeMode ? "retake_in_progress" : "in_progress",
        };
        
        if (existing.length > 0) {
          base44.entities.StudentLessonProgress.update(existing[0].id, data);
        } else {
          base44.entities.StudentLessonProgress.create({
            classroom_id: classroomId,
            student_id: user.id,
            year_level_key: yearLevelKey,
            lesson_number: lessonNumber,
            ...data,
          });
        }
      }).catch(console.error);
    }
  };

  if (cwLoading && !yl) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  if (!yl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Year level not found.</p>
      </div>);
  }

  // Check if lesson is accessible:
  // 1. All lessons from 1 up to targetLessonNum must be open (is_open)
  // 2. All lessons from 1 up to targetLessonNum - 1 must be completed by the student
  const canAccessLesson = (targetLessonNum) => {
    if (!classroomId) return true; // No classroom = direct access
    if (targetLessonNum === 0) return true; // Course overview always accessible
    for (let i = 1; i <= targetLessonNum; i++) {
      const access = lessonAccess.find(la => la.lesson_number === i);
      if (!access || !access.is_open) return false;
    }
    // All preceding lessons must be completed
    for (let i = 1; i < targetLessonNum; i++) {
      const prog = allMyProgress.find(p => p.lesson_number === i);
      if (!prog?.completed) return false;
    }
    return true;
  };

  // Wait for access data before gating (prevent false locked screen flash)
  if (classroomId && isStudent && (accessLoading || progressLoading)) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }

  if (classroomId && isStudent && !canAccessLesson(lessonNumber)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold mb-1">This lesson is not yet available.</p>
          <p className="text-sm text-gray-500">Complete all previous lessons first, and make sure your teacher has unlocked this lesson.</p>
        </div>
      </div>
    );
  }

  const renderSection = (sectionData) => {
    if (!sectionData) return null;

    return (
      <div className="mx-auto px-8 py-8 max-w-3xl">
        <div>
          {sectionData.image &&
          <ImageViewer
            src={sectionData.image}
            alt={sectionData.title || "Section image"}
            className="w-full max-w-2xl mx-auto mb-6" />

          }
          
          {sectionData.title &&
          <h2 className="text-lg sm:text-2xl font-bold text-[#0B5394] mb-3">{sectionData.title}</h2>
          }

          {sectionData.type === "story" &&
          <>
              <p className="text-gray-600 mb-4">{sectionData.description}</p>
              {sectionData.scenes?.map((scene, idx) =>
            <div key={idx} className="mb-6">
                  <ImageViewer
                src={scene.image}
                alt={`Scene ${idx + 1}`}
                className="w-full max-w-md mx-auto mb-3" />

                  {scene.text?.map((paragraph, pIdx) =>
              <p key={pIdx} className="text-gray-600 italic mb-2">{paragraph}</p>
              )}
                </div>
            )}
            </>
          }

          {sectionData.content && Array.isArray(sectionData.content) &&
          <>
              {sectionData.content.map((para, idx) =>
            <p key={idx} className="text-gray-700 leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: para }} />
            )}
            </>
          }

          {sectionData.intro &&
          <p className="text-gray-700 leading-relaxed mb-4">{sectionData.intro}</p>
          }

          {sectionData.steps &&
          <ol className="space-y-2 text-gray-700 list-decimal list-inside">
              {sectionData.steps.map((step, idx) =>
            <li key={idx}>{step}</li>
            )}
            </ol>
          }

          {sectionData.differences &&
          <div className="space-y-4 text-gray-700">
              {sectionData.differences.map((diff, idx) =>
            <div key={idx}>
                  <h3 className="font-bold text-gray-900 mb-2">{diff.title}</h3>
                  <p className="leading-relaxed">{diff.description}</p>
                </div>
            )}
            </div>
          }

          {sectionData.elements &&
          <ul className="space-y-3 text-gray-700">
              {sectionData.elements.map((el, idx) =>
            <li key={idx} className="flex gap-3">
                  <span className="text-[#0B5394] text-xl leading-none">•</span>
                  <span className="leading-relaxed">
                    <strong>{el.title}</strong> - {el.description}
                  </span>
                </li>
            )}
            </ul>
          }

          {sectionData.tips &&
          <div className="space-y-4 text-gray-700">
              {sectionData.tips.map((tip, idx) =>
            <div key={idx}>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="leading-relaxed">{tip.description}</p>
                </div>
            )}
            </div>
          }

          {sectionData.video &&
          <>
              <div className="relative bg-gray-100 rounded-2xl overflow-hidden mb-4" style={{ paddingTop: "56.25%" }}>
                <iframe
                src={sectionData.video.url}
                className="absolute inset-0 w-full h-full"
                allow="autoplay"
                allowFullScreen />

              </div>
              {sectionData.video.title &&
            <h3 className="text-base font-bold text-gray-900 mb-3">VIDEO: {sectionData.video.title}</h3>
            }
              {sectionData.video.reflections &&
            <ul className="space-y-2 text-sm text-gray-700">
                  {sectionData.video.reflections.map((ref, idx) =>
              <li key={idx} className="flex gap-2">
                      <span className="text-red-600">•</span>
                      {ref}
                    </li>
              )}
                </ul>
            }
              {sectionData.video.reflection &&
            <p className="text-sm text-gray-700">{sectionData.video.reflection}</p>
            }
            </>
          }
        </div>
      </div>);

  };

  const getYearLevelSlide = () => {
    const gradeMap = {
      "grade-1": "Grade 1",
      "grade-2": "Grade 2",
      "grade-3": "Grade 3",
      "grade-4": "Grade 4",
      "grade-5": "Grade 5",
      "grade-6": "Grade 6",
      "grade-7": "Grade 7",
      "grade-8": "Grade 8",
      "grade-9": "Grade 9",
      "grade-10": "Grade 10",
      "grade-11": "Grade 11",
      "grade-12": "Grade 12",
      "college-1": "College Year 1",
      "college-2": "College Year 2",
      "college-3": "College Year 3",
      "college-4": "College Year 4"
    };
    return slides.find((s) => s.title?.includes(gradeMap[yearLevelKey]));
  };

  const renderStep = () => {
    switch (currentStep?.type) {
      case "course_overview":
        return (
          <div className="mx-auto px-8 py-8 max-w-3xl w-full">
            <h2 className="text-2xl font-bold text-[#0B5394] mb-1">{yl.grade}</h2>
            <p className="text-base font-medium text-gray-500 italic mb-6">{courseDetails?.subtitle || yl.subtitle}</p>
            {(courseDetails?.quote || yl.quote) && (
              <blockquote className="border-l-4 border-[#F9A825] pl-4 my-6">
                <p className="italic text-gray-600 mb-1">"{courseDetails?.quote || yl.quote}"</p>
                <footer className="text-sm font-semibold text-gray-700">— {courseDetails?.quoteAuthor || yl.quoteAuthor}</footer>
              </blockquote>
            )}
            <p className="text-gray-700 leading-relaxed mb-8">{courseDetails?.summary || yl.summary}</p>
            {(courseDetails?.objectives || yl.objectives || []).length > 0 && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h3 className="font-bold text-[#0B5394] mb-4">Course Objectives</h3>
                <ul className="space-y-2">
                  {(courseDetails?.objectives || yl.objectives || []).map((obj, i) => (
                    <li key={i} className="flex gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case "objectives":
        return (
          <div className="mx-auto px-8 py-8 max-w-3xl">
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-2xl font-bold text-[#0B5394] mb-4">Learning Objectives</h2>
              <ul className="space-y-2">
                {dbLessonContent?.lesson_objectives?.map((obj, idx) => (
                  <li key={idx} className="flex gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case "static":
        if (currentStep?.id === "complete")
          return (
            <div className="max-w-lg mx-auto py-12 px-4 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Complete!</h2>
              <p className="text-gray-500 text-sm mb-8">
                You've gone through all the sections and activities for this lesson. 
                Mark it as complete to finish.
              </p>
              {returnTo === "CourseBuilder" ? (
                <Button
                  onClick={() => navigate(`/CourseBuilder?yearLevel=${yearLevelKey}`)}
                  className="brand-gradient text-white rounded-full px-8 py-3 text-base gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Back to Course Builder
                </Button>
              ) : isAdmin ? (
                <Link to="/Admin">
                  <Button className="brand-gradient text-white rounded-full px-8 py-3 text-base gap-2">
                    <ArrowRight className="w-5 h-5" />
                    Continue to Admin
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={handleMarkComplete}
                  className="brand-gradient text-white rounded-full px-8 py-3 text-base gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Mark as Complete
                </Button>
              )}
            </div>
          );
        return null;

      default:
        // Handle content type steps (sections from database)
        if (currentStep?.type === "content") {
          const dbSection = dbLessonContent?.sections?.find(s => s.id === currentStep?.id);
          if (dbSection) {
            return (
              <LessonRenderer
                section={dbSection}
                onActivityComplete={handleActivityComplete}
                lessonObjectives={dbLessonContent?.lesson_objectives}
              />
            );
          }
        }
        return null;
    }
  };




  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <header className="flex-shrink-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px] sm:max-w-none">{currentStep?.label}</p>
          <p className="text-xs text-gray-400">Section {stepIdx + 1} of {steps.length}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <a
              href="/Admin"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </a>
          )}
          {returnTo === "CourseBuilder" ? (
            <a
              href={`/CourseBuilder?yearLevel=${yearLevelKey}`}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Course Builder</span>
            </a>
          ) : classroomId ? (
            <a
              href={`/ClassroomView?id=${classroomId}`}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Classroom</span>
            </a>
          ) : null}
        </div>
      </header>

        <div className="flex-shrink-0 w-full bg-gray-100 h-1">
          <div className="brand-gradient h-1 transition-all duration-300" style={{ width: `${(stepIdx + 1) / steps.length * 100}%` }} />
        </div>

        <main ref={mainScrollRef} className="flex-1 overflow-y-auto">
          <div className="w-full min-h-full flex items-center justify-center">
            {renderStep()}
          </div>
        </main>

      <footer className="sticky bottom-0 border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-white z-20">
        <Button
          variant="ghost"
          onClick={goPrev}
          disabled={stepIdx === 0}
          className="gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>
        {currentStep?.id !== "complete" &&
          <div className="flex items-center gap-3">
            {isActivity && !activityReady && !isStudent &&
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSkip}
                      className="text-sm text-gray-500 hover:text-gray-700 underline flex items-center gap-1">
                      Skip
                      <Info className="w-3 h-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Skip this activity</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            }
            <Button
              onClick={goNext}
              className={`gap-1 text-sm rounded-full px-6 transition-all ${canGoNext ? "brand-gradient text-white" : "bg-gray-100 text-gray-400"}`}>
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        }
      </footer>

      {/* Slide Viewer */}
      {selectedSlide &&
        <SlideViewer
          slide={selectedSlide}
          onClose={() => setSelectedSlide(null)} />
      }
    </div>);

}