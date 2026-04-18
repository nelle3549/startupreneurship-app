import React, { useState, useEffect, useCallback, useMemo } from "react";
import { entities } from "@/api/entities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

// Extend Quill's Video blot to accept Google Drive URLs (not just YouTube/Vimeo)
const BlockEmbed = Quill.import("blots/block/embed");
class VideoBlot extends BlockEmbed {
  static create(url) {
    const node = super.create();
    node.setAttribute("src", url);
    node.setAttribute("frameborder", "0");
    node.setAttribute("allowfullscreen", true);
    node.setAttribute("allow", "autoplay; encrypted-media");
    return node;
  }
  static value(node) {
    return node.getAttribute("src");
  }
  // Accept any URL — YouTube, Google Drive, Vimeo, etc.
  static sanitize(url) {
    return url;
  }
}
VideoBlot.blotName = "video";
VideoBlot.tagName = "IFRAME";
VideoBlot.className = "ql-video";
Quill.register(VideoBlot, true);
import {
  ChevronUp, ChevronDown, Plus, Trash2, Edit2, X, CheckCircle, HelpCircle, AlertCircle, Eye
} from "lucide-react";
import McqActivityBuilder from "./McqActivityBuilder";
import MicroValidationActivityBuilder from "./MicroValidationActivityBuilder";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const modules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image", "video"],
      ["clean"]
    ],
  },
};

export default function CourseEditorFullscreen({ yearLevel, onClose }) {
  const queryClient = useQueryClient();
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // { kind: "section"|"lesson", id/idx, label }

  // Fetch Course Details from DB
  const { data: dbCourseDetails = null } = useQuery({
    queryKey: ["course-details", yearLevel.key],
    queryFn: async () => {
      const results = await entities.CourseDetails.filter({
        year_level_key: yearLevel.key
      });
      return results[0] || null;
    }
  });

  // Course Details State
  const [details, setDetails] = useState({
    subtitle: yearLevel.subtitle,
    quote: yearLevel.quote,
    quoteAuthor: yearLevel.quoteAuthor,
    summary: yearLevel.summary,
    objectives: yearLevel.objectives || [],
  });
  const [initialDetails, setInitialDetails] = useState({
    subtitle: yearLevel.subtitle,
    quote: yearLevel.quote,
    quoteAuthor: yearLevel.quoteAuthor,
    summary: yearLevel.summary,
    objectives: yearLevel.objectives || [],
  });

  // Sync details from DB on load
  useEffect(() => {
    if (dbCourseDetails) {
      const syncedDetails = {
        subtitle: dbCourseDetails.subtitle || yearLevel.subtitle,
        quote: dbCourseDetails.quote || yearLevel.quote,
        quoteAuthor: dbCourseDetails.quoteAuthor || yearLevel.quoteAuthor,
        summary: dbCourseDetails.summary || yearLevel.summary,
        objectives: dbCourseDetails.objectives || yearLevel.objectives || [],
      };
      setDetails(syncedDetails);
      setInitialDetails(JSON.parse(JSON.stringify(syncedDetails)));
    }
  }, [dbCourseDetails, yearLevel]);

  // Lessons State
  const [lessons, setLessons] = useState(yearLevel.lessons || []);
  const [initialLessons, setInitialLessons] = useState(lessons);
  const [selectedLessonNum, setSelectedLessonNum] = useState(null);
  const [expandedLessons, setExpandedLessons] = useState({});
  const [editingLessonField, setEditingLessonField] = useState(null); // { num, field }

  const updateLesson = (num, updates) => {
    setLessons(prev => prev.map(l => l.num === num ? { ...l, ...updates } : l));
  };

  // Lesson Content State
  const { data: dbLessonContent = null } = useQuery({
    queryKey: ["lesson-content", yearLevel.key, selectedLessonNum],
    queryFn: () => {
      if (!selectedLessonNum) return null;
      return entities.LessonContent.filter({
        year_level_key: yearLevel.key,
        lesson_number: selectedLessonNum
      }).then(results => results[0] || null);
    },
    enabled: !!selectedLessonNum
  });

  const [sections, setSections] = useState([]);
  const [initialSections, setInitialSections] = useState([]);
  const [lessonObjectives, setLessonObjectives] = useState([]);
  const [initialLessonObjectives, setInitialLessonObjectives] = useState([]);
  const [newObjective, setNewObjective] = useState("");
  const [newLessonObjective, setNewLessonObjective] = useState("");

  // Sync lesson content from DB
  useEffect(() => {
    if (dbLessonContent?.sections) {
      setSections(dbLessonContent.sections);
      setInitialSections(JSON.parse(JSON.stringify(dbLessonContent.sections)));
    } else if (selectedLessonNum) {
      setSections([]);
      setInitialSections([]);
    }
    if (dbLessonContent?.lesson_objectives) {
      setLessonObjectives(dbLessonContent.lesson_objectives);
      setInitialLessonObjectives(JSON.parse(JSON.stringify(dbLessonContent.lesson_objectives)));
    } else if (selectedLessonNum) {
      setLessonObjectives([]);
      setInitialLessonObjectives([]);
    }
  }, [dbLessonContent, selectedLessonNum]);

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const detailsChanged = JSON.stringify(details) !== JSON.stringify(initialDetails);
    const lessonsChanged = JSON.stringify(lessons) !== JSON.stringify(initialLessons);
    const sectionsChanged = JSON.stringify(sections) !== JSON.stringify(initialSections);
    const objectivesChanged = JSON.stringify(lessonObjectives) !== JSON.stringify(initialLessonObjectives);
    return detailsChanged || lessonsChanged || sectionsChanged || objectivesChanged;
  }, [details, initialDetails, lessons, initialLessons, sections, initialSections, lessonObjectives, initialLessonObjectives]);

  const countGradedActivities = () => {
    return sections.filter(s => s.type === "activity" && s.activity_type === "mcq").length;
  };

  // Handle lesson switch with unsaved check
  const handleSelectLesson = useCallback((lessonNum) => {
    if (hasUnsavedChanges && selectedLessonNum !== null) {
      setPendingAction({ type: "selectLesson", value: lessonNum });
      setShowUnsavedDialog(true);
      return;
    }
    setSelectedLessonNum(lessonNum);
    setSections([]);
    setLessonObjectives([]);
  }, [hasUnsavedChanges, selectedLessonNum]);

  // Handle close with unsaved check
  const handleCloseClick = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingAction({ type: "close" });
      setShowUnsavedDialog(true);
      return;
    }
    onClose();
  }, [hasUnsavedChanges, onClose]);

  // Handle unsaved dialog actions
  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    if (pendingAction?.type === "selectLesson") {
      setSelectedLessonNum(pendingAction.value);
      setSections([]);
      setLessonObjectives([]);
    } else if (pendingAction?.type === "close") {
      onClose();
    }
    setPendingAction(null);
  };

  const handleSaveAndContinue = async () => {
    await handleSaveAll();
    setShowUnsavedDialog(false);
    if (pendingAction?.type === "selectLesson") {
      setSelectedLessonNum(pendingAction.value);
      setSections([]);
      setLessonObjectives([]);
    } else if (pendingAction?.type === "close") {
      onClose();
    }
    setPendingAction(null);
  };

  // Save all changes
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Validate graded activities for selected lesson
      if (selectedLessonNum) {
        const mcqSections = sections.filter(s => s.type === "activity" && s.activity_type === "mcq");
        if (mcqSections.length > 1) {
          throw new Error("Only one MCQ activity is allowed per lesson.");
        }
        if (mcqSections.length === 1 && sections[sections.length - 1]?.activity_type !== "mcq") {
          throw new Error("The graded MCQ activity must be the last section in the lesson.");
        }
      }

      // Save course details if on Course Details tab
      if (selectedLessonNum === null) {
        const existing = await entities.CourseDetails.filter({
          year_level_key: yearLevel.key
        });

        if (existing.length > 0) {
          await entities.CourseDetails.update(existing[0].id, {
            subtitle: details.subtitle,
            quote: details.quote,
            quoteAuthor: details.quoteAuthor,
            summary: details.summary,
            objectives: details.objectives
          });
        } else {
          await entities.CourseDetails.create({
            year_level_key: yearLevel.key,
            subtitle: details.subtitle,
            quote: details.quote,
            quoteAuthor: details.quoteAuthor,
            summary: details.summary,
            objectives: details.objectives
          });
        }
      }

      // Save lesson content if a lesson is selected
      if (selectedLessonNum) {
        const existingContent = await entities.LessonContent.filter({
          year_level_key: yearLevel.key,
          lesson_number: selectedLessonNum
        });

        if (existingContent.length > 0) {
          await entities.LessonContent.update(existingContent[0].id, {
            sections: sections,
            lesson_objectives: lessonObjectives
          });
        } else {
          await entities.LessonContent.create({
            year_level_key: yearLevel.key,
            lesson_number: selectedLessonNum,
            sections: sections,
            lesson_objectives: lessonObjectives
          });
        }
      }

      // Update initial states to clear unsaved changes flag
      setInitialDetails(JSON.parse(JSON.stringify(details)));
      setInitialSections(JSON.parse(JSON.stringify(sections)));
      setInitialLessonObjectives(JSON.parse(JSON.stringify(lessonObjectives)));

      // Save lessons + details to Courseware entity (single source of truth)
      const existingCw = await entities.Courseware.filter({ key: yearLevel.key });
      const cwPayload = {
        lessons,
        subtitle: details.subtitle,
        summary: details.summary,
        quote: details.quote,
        quoteAuthor: details.quoteAuthor,
        objectives: details.objectives,
      };
      if (existingCw.length > 0) {
        await entities.Courseware.update(existingCw[0].id, cwPayload);
      } else {
        await entities.Courseware.create({
          key: yearLevel.key,
          grade: yearLevel.grade,
          segment: yearLevel.segment || "",
          status: "active",
          order: 0,
          ...cwPayload,
        });
      }
      setInitialLessons(JSON.parse(JSON.stringify(lessons)));

      queryClient.invalidateQueries({ queryKey: ["course-details", yearLevel.key] });
      queryClient.invalidateQueries({ queryKey: ["lesson-content"] });
      queryClient.invalidateQueries({ queryKey: ["coursewares"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || "Failed to save changes");
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Section management
  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      type: "text",
      title: "New Section",
      content: ""
    };
    setSections(prev => {
      const gradedIdx = prev.findIndex(s => s.type === "activity" && s.activity_type === "mcq");
      if (gradedIdx !== -1) {
        return [...prev.slice(0, gradedIdx), newSection, ...prev.slice(gradedIdx)];
      }
      return [...prev, newSection];
    });
  };

  const addTypedSection = (type) => {
    const defaults = {
      image: { type: "image", title: "", src: "", alt: "", caption: "", content: "" },
      video: { type: "video", title: "", src: "", caption: "", content: "" },
      callout: { type: "callout", title: "", content: "", style: "action" },
    };
    const newSection = { id: `section-${Date.now()}`, ...defaults[type] };
    setSections(prev => {
      const gradedIdx = prev.findIndex(s => s.type === "activity" && s.activity_type === "mcq");
      if (gradedIdx !== -1) return [...prev.slice(0, gradedIdx), newSection, ...prev.slice(gradedIdx)];
      return [...prev, newSection];
    });
  };

  const insertSectionAfter = (idx) => {
    const newSection = {
      id: `section-${Date.now()}`,
      type: "text",
      title: "New Section",
      content: ""
    };
    setSections(prev => {
      // Never insert after the graded MCQ — insert before it instead
      const gradedIdx = prev.findIndex(s => s.type === "activity" && s.activity_type === "mcq");
      const insertAt = gradedIdx !== -1 ? Math.min(idx + 1, gradedIdx) : idx + 1;
      return [...prev.slice(0, insertAt), newSection, ...prev.slice(insertAt)];
    });
  };

  const removeSection = (id) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const updateSection = (id, updates) => {
    setSections(prev => {
      const current = prev.find(s => s.id === id);
      const isBecomingMcq = updates.activity_type === "mcq" && current?.activity_type !== "mcq";
      const alreadyHasMcq = prev.some(s => s.id !== id && s.type === "activity" && s.activity_type === "mcq");

      if (isBecomingMcq && alreadyHasMcq) {
        alert("Only one graded MCQ activity is allowed per lesson.");
        return prev;
      }

      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);

      // If changing to MCQ, move it to the end
      if (isBecomingMcq) {
        const idx = updated.findIndex(s => s.id === id);
        const item = updated[idx];
        const rest = updated.filter(s => s.id !== id);
        return [...rest, item];
      }

      return updated;
    });
  };

  const isMcqSection = (section) => section.type === "activity" && section.activity_type === "mcq";

  const moveSection = (id, direction) => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;
    // MCQ can never move up from last position, and no section can move down past MCQ
    if (isMcqSection(sections[idx])) return; // MCQ is locked at end
    if (isMcqSection(sections[swapIdx])) return; // Can't swap with MCQ
    const newSections = [...sections];
    [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];
    setSections(newSections);
  };

  const addActivity = (type) => {
    const gradedCount = countGradedActivities();
    if (type === "mcq" && gradedCount >= 1) {
      alert("Cannot add another MCQ. Maximum one graded MCQ activity per lesson.");
      return;
    }
    // MCQ always goes to end; micro_validation goes before MCQ if one exists
    const newActivity = {
      id: `activity-${Date.now()}`,
      type: "activity",
      activity_type: type,
      title: `New ${type === "mcq" ? "MCQ" : "Micro Validation"} Activity`,
      question: "",
      options: type === "mcq" ? ["", "", "", ""] : ["", "", ""],
      explanations: type === "micro_validation" ? ["", "", ""] : undefined,
      correct_answer_index: 0
    };
    setSections(prev => {
      if (type === "mcq") return [...prev, newActivity];
      const gradedIdx = prev.findIndex(s => s.type === "activity" && s.activity_type === "mcq");
      if (gradedIdx !== -1) return [...prev.slice(0, gradedIdx), newActivity, ...prev.slice(gradedIdx)];
      return [...prev, newActivity];
    });
  };

  // Lesson management
  const addLesson = (type = "lesson") => {
    const newLessonNum = Math.max(...lessons.map(l => l.num), 0) + 1;
    const label = type === "milestone" ? "New Milestone" : "New Lesson";
    setLessons(prev => [
      ...prev,
      { num: newLessonNum, title: label, summary: `${label} content coming soon.`, type }
    ]);
  };

  const removeLesson = (idx) => {
    setLessons(prev => prev.filter((_, i) => i !== idx));
  };

  const moveLesson = (idx, direction) => {
    const newLessons = [...lessons];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newLessons.length) return;
    [newLessons[idx], newLessons[swapIdx]] = [newLessons[swapIdx], newLessons[idx]];
    setLessons(newLessons);
  };



  const addObjective = () => {
    if (newObjective.trim()) {
      setDetails(prev => ({
        ...prev,
        objectives: [...prev.objectives, newObjective]
      }));
      setNewObjective("");
    }
  };

  const removeObjective = (idx) => {
    setDetails(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== idx)
    }));
  };

  const addLessonObjective = () => {
    if (newLessonObjective.trim()) {
      setLessonObjectives(prev => [...prev, newLessonObjective]);
      setNewLessonObjective("");
    }
  };

  const removeLessonObjective = (idx) => {
    setLessonObjectives(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{yearLevel.grade}</h1>
          <p className="text-sm text-gray-500">{yearLevel.bookTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Unsaved changes</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleCloseClick} className="text-gray-600">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar */}
        <div className="w-80 border-r border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Lessons List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Lessons</h2>
                <div className="flex gap-1">
                  <Button onClick={() => addLesson("lesson")} size="sm" className="bg-blue-600 text-white gap-1">
                    <Plus className="w-3 h-3" />
                    Lesson
                  </Button>
                  <Button onClick={() => addLesson("milestone")} size="sm" className="bg-amber-600 text-white gap-1">
                    <Plus className="w-3 h-3" />
                    Milestone
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div
                  onClick={() => handleSelectLesson(null)}
                  className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                    selectedLessonNum === null
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">Course Details</p>
                </div>
                {lessons.map((lesson, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectLesson(lesson.num)}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedLessonNum === lesson.num
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {lesson.type === "milestone" ? (
                          <span className="text-amber-700">Milestone {lesson.milestoneNum || lessons.filter((l, li) => l.type === "milestone" && li <= idx).length}</span>
                        ) : (
                          <>Lesson {lessons.filter((l, li) => l.type !== "milestone" && li < idx).length + 1}</>
                        )}
                      </p>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); moveLesson(idx, "up"); }}
                          disabled={idx === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); moveLesson(idx, "down"); }}
                          disabled={idx === lessons.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setConfirmDelete({ kind: "lesson", idx, label: `Lesson ${lesson.num}: ${lesson.title || ""}` });
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{lesson.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {selectedLessonNum === null ? (
            <div className="p-8 max-w-4xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Course Details</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
                  <Input
                    value={details.subtitle}
                    onChange={e => setDetails(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Summary</label>
                  <Textarea
                    value={details.summary}
                    onChange={e => setDetails(prev => ({ ...prev, summary: e.target.value }))}
                    className="text-sm min-h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Inspirational Quote</label>
                  <Textarea
                    value={details.quote}
                    onChange={e => setDetails(prev => ({ ...prev, quote: e.target.value }))}
                    className="text-sm min-h-20"
                  />
                  <Input
                    placeholder="Author name"
                    value={details.quoteAuthor}
                    onChange={e => setDetails(prev => ({ ...prev, quoteAuthor: e.target.value }))}
                    className="text-sm mt-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Learning Objectives</label>
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {details.objectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-700 flex-1">{obj}</p>
                        <button onClick={() => removeObjective(i)} className="text-gray-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newObjective}
                      onChange={e => setNewObjective(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addObjective()}
                      placeholder="Add learning objective..."
                      className="text-sm"
                    />
                    <Button onClick={addObjective} size="sm" className="bg-emerald-600 text-white gap-1">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedLessonNum ? (
            <div className="p-8 max-w-4xl">
              <div className="mb-8">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">{(() => {
                      const lesson = lessons.find(l => l.num === selectedLessonNum);
                      if (lesson?.type === "milestone") {
                        const mIdx = lessons.filter(l => l.type === "milestone" && l.num <= selectedLessonNum).length;
                        return `Milestone ${lesson.milestoneNum || mIdx}`;
                      }
                      const lIdx = lessons.filter(l => l.type !== "milestone" && l.num <= selectedLessonNum).length;
                      return `Lesson ${lIdx}`;
                    })()} — Title</p>
                    {editingLessonField?.num === selectedLessonNum && editingLessonField?.field === "title" ? (
                      <Input
                        autoFocus
                        value={lessons.find(l => l.num === selectedLessonNum)?.title || ""}
                        onChange={e => updateLesson(selectedLessonNum, { title: e.target.value })}
                        onBlur={() => setEditingLessonField(null)}
                        onKeyDown={e => e.key === "Enter" && setEditingLessonField(null)}
                        className="text-xl font-bold"
                      />
                    ) : (
                      <h2
                        className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 flex items-center gap-2 group"
                        onClick={() => setEditingLessonField({ num: selectedLessonNum, field: "title" })}
                      >
                        {lessons.find(l => l.num === selectedLessonNum)?.title}
                        <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-50" />
                      </h2>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Summary</p>
                  {editingLessonField?.num === selectedLessonNum && editingLessonField?.field === "summary" ? (
                    <Textarea
                      autoFocus
                      value={lessons.find(l => l.num === selectedLessonNum)?.summary || ""}
                      onChange={e => updateLesson(selectedLessonNum, { summary: e.target.value })}
                      onBlur={() => setEditingLessonField(null)}
                      className="text-sm min-h-[72px]"
                    />
                  ) : (
                    <p
                      className="text-gray-600 cursor-pointer hover:text-blue-600 flex items-start gap-2 group"
                      onClick={() => setEditingLessonField({ num: selectedLessonNum, field: "summary" })}
                    >
                      <span>{lessons.find(l => l.num === selectedLessonNum)?.summary || <span className="italic text-gray-400">No summary — click to add</span>}</span>
                      <Edit2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-50" />
                    </p>
                  )}
                </div>
              </div>

              {/* Lesson Objectives */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Objectives</h3>
                <div className="space-y-2 mb-4">
                  {lessonObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 flex-1">{obj}</p>
                      <button onClick={() => removeLessonObjective(i)} className="text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newLessonObjective}
                    onChange={e => setNewLessonObjective(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addLessonObjective()}
                    placeholder="Add learning objective..."
                    className="text-sm"
                  />
                  <Button onClick={addLessonObjective} size="sm" className="bg-emerald-600 text-white gap-1">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Sections */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Sections</h3>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={addSection} size="sm" className="bg-blue-600 text-white gap-1">
                      <Plus className="w-3 h-3" />
                      Content
                    </Button>
                    <Button onClick={() => addTypedSection("callout")} size="sm" className="bg-amber-600 text-white gap-1">
                      <Plus className="w-3 h-3" />
                      Callout
                    </Button>
                    <Button onClick={() => addActivity("mcq")} size="sm" disabled={countGradedActivities() >= 1} className={`gap-1 text-white ${countGradedActivities() >= 1 ? "bg-gray-400" : "bg-purple-600"}`}>
                      <HelpCircle className="w-3 h-3" />
                      MCQ
                    </Button>
                    <Button onClick={() => addActivity("micro_validation")} size="sm" className="bg-cyan-600 text-white gap-1">
                      <HelpCircle className="w-3 h-3" />
                      Micro Validation
                    </Button>
                  </div>
                </div>

                {sections.length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center bg-gray-50">
                    <p className="text-sm text-gray-600 font-medium mb-1">No sections yet</p>
                    <p className="text-xs text-gray-500 mb-4">Add a section above to start building this lesson.</p>
                    <div className="flex justify-center gap-2 flex-wrap">
                      <Button onClick={addSection} size="sm" variant="outline" className="gap-1">
                        <Plus className="w-3 h-3" /> Content
                      </Button>
                      <Button onClick={() => addTypedSection("callout")} size="sm" variant="outline" className="gap-1">
                        <Plus className="w-3 h-3" /> Callout
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {sections.map((section, idx) => (
                    <Card key={section.id} className="border-gray-200">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={section.title}
                            onChange={e => updateSection(section.id, { title: e.target.value })}
                            placeholder="Section title"
                            className="text-sm flex-1"
                          />
                          {isMcqSection(section) ? (
                            <span className="text-xs text-purple-600 font-semibold border border-purple-200 bg-purple-50 rounded px-2 py-1 flex items-center gap-1">
                              🔒 MCQ (Graded)
                            </span>
                          ) : (
                            <select
                              value={section.type === "activity" ? section.activity_type : section.type}
                              onChange={e => {
                                const val = e.target.value;
                                if (["mcq", "micro_validation"].includes(val)) {
                                  updateSection(section.id, { type: "activity", activity_type: val });
                                } else {
                                  updateSection(section.id, { type: val, activity_type: undefined });
                                }
                              }}
                              className="border border-gray-200 rounded px-2 py-1 text-xs"
                            >
                              <option value="text">Content</option>
                              <option value="callout">Callout</option>
                              <option value="mcq">MCQ</option>
                              <option value="micro_validation">Micro Validation</option>
                            </select>
                          )}
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => moveSection(section.id, "up")}
                            disabled={idx === 0 || isMcqSection(section)}
                            className="h-8 w-8"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => moveSection(section.id, "down")}
                            disabled={idx === sections.length - 1 || isMcqSection(section) || isMcqSection(sections[idx + 1])}
                            className="h-8 w-8"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmDelete({ kind: "section", id: section.id, label: section.title || "this section" })}
                            className="h-8 w-8 text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        {(section.type === "text" || section.type === "image" || section.type === "video") && (
                          <div className="border border-gray-200 rounded">
                            <ReactQuill
                              theme="snow"
                              value={section.content || ""}
                              onChange={content => updateSection(section.id, { content })}
                              modules={modules}
                              className="bg-white"
                            />
                          </div>
                        )}

                        {section.type === "callout" && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Callout Style</label>
                              <select
                                value={section.style || "action"}
                                onChange={e => updateSection(section.id, { style: e.target.value })}
                                className="border border-gray-200 rounded px-2 py-1 text-xs"
                              >
                                <option value="action">Action (orange)</option>
                                <option value="info">Info (blue)</option>
                                <option value="warning">Warning (amber)</option>
                                <option value="tip">Tip (green)</option>
                              </select>
                            </div>
                            <div className="border border-gray-200 rounded">
                              <ReactQuill theme="snow" value={section.content || ""} onChange={content => updateSection(section.id, { content })} modules={modules} className="bg-white" />
                            </div>
                          </div>
                        )}

                        {section.type === "activity" && section.activity_type === "mcq" && (
                          <McqActivityBuilder activity={section} updateSection={updateSection} />
                        )}

                        {section.type === "activity" && section.activity_type === "micro_validation" && (
                          <MicroValidationActivityBuilder activity={section} updateSection={updateSection} />
                        )}
                        {!(section.type === "activity" && section.activity_type === "mcq") && (
                          <div className="flex justify-center pt-2 border-t border-dashed border-gray-200 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => insertSectionAfter(idx)}
                              className="text-gray-400 hover:text-blue-600 gap-1 text-xs"
                            >
                              <Plus className="w-3 h-3" />
                              Add section below
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <p>Select a lesson from the left sidebar to begin editing</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Save Panel */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Changes saved successfully</span>
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{saveError}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCloseClick} disabled={isSaving}>
            Close
          </Button>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={async () => {
              if (hasUnsavedChanges) await handleSaveAll();
              const lessonNum = selectedLessonNum ?? 0;
              window.open(`/Viewer?yearLevel=${yearLevel.key}&lesson=${lessonNum}&returnTo=CourseBuilder`, '_blank');
            }}
          >
            <Eye className="w-4 h-4" />
            {hasUnsavedChanges ? "Save & Preview" : "Preview"}
          </Button>
          <Button onClick={handleSaveAll} disabled={!hasUnsavedChanges || isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>
            Delete {confirmDelete?.kind === "lesson" ? "lesson" : "section"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirmDelete?.kind === "lesson"
              ? `This will remove "${confirmDelete?.label}" and all its content from the course. This cannot be undone.`
              : `This will remove "${confirmDelete?.label}" from this lesson. This cannot be undone.`}
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel onClick={() => setConfirmDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (confirmDelete?.kind === "lesson") {
                  removeLesson(confirmDelete.idx);
                } else if (confirmDelete?.kind === "section") {
                  removeSection(confirmDelete.id);
                }
                setConfirmDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Would you like to save them before {pendingAction?.type === "selectLesson" ? "switching lessons" : "closing"}?
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel onClick={handleDiscardChanges}>Discard</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndContinue}>Save & Continue</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}