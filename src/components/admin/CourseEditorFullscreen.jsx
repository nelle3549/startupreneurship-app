import React, { useState, useEffect, useCallback, useMemo, useRef, startTransition } from "react";
import { entities } from "@/api/entities";
import { uploadLessonImage } from "@/api/storage";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Open a file picker, upload the image to Supabase, and return its public URL.
function pickAndUploadImage() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        const { publicUrl } = await uploadLessonImage(file, { folder: "quill" });
        resolve(publicUrl);
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}

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
    handlers: {
      image: function () {
        const quill = this.quill;
        pickAndUploadImage()
          .then((url) => {
            if (!url) return;
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, "image", url, "user");
            quill.setSelection(range.index + 1, 0, "user");
          })
          .catch((err) => {
            console.error("Image upload failed:", err);
            alert(`Image upload failed: ${err.message || err}`);
          });
      },
    },
  },
};

export default function CourseEditorFullscreen({ yearLevel, onClose }) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { kind: "section"|"lesson", id/idx, label }
  const autosaveTimerRef = useRef(null);
  const erroredSignatureRef = useRef(null);
  const inFlightSaveRef = useRef(null); // Promise of the current save (for flush-on-navigate)

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
  const { data: dbLessonContent = null, isLoading: lessonContentLoading, isFetching: lessonContentFetching } = useQuery({
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

  // True while the lesson-content query hasn't resolved for the currently
  // selected lesson. Autosave must be blocked during this window — otherwise
  // a save triggered by `details`/`lessons` changes can write `sections: []`
  // for a lesson whose real content hasn't arrived yet, wiping the row.
  const lessonContentNotReady = !!selectedLessonNum && (lessonContentLoading || lessonContentFetching);

  const [sections, setSections] = useState([]);
  const [initialSections, setInitialSections] = useState([]);
  const [lessonObjectives, setLessonObjectives] = useState([]);
  const [initialLessonObjectives, setInitialLessonObjectives] = useState([]);
  const [newObjective, setNewObjective] = useState("");
  const [newLessonObjective, setNewLessonObjective] = useState("");

  // Sync lesson content from DB. Only touch section/objective state once the
  // query has actually resolved for this lesson — otherwise we can briefly
  // overwrite real content with [] while the fetch is still in flight.
  useEffect(() => {
    if (!selectedLessonNum) return;
    if (lessonContentNotReady) return;
    if (dbLessonContent?.sections) {
      setSections(dbLessonContent.sections);
      setInitialSections(JSON.parse(JSON.stringify(dbLessonContent.sections)));
    } else {
      setSections([]);
      setInitialSections([]);
    }
    if (dbLessonContent?.lesson_objectives) {
      setLessonObjectives(dbLessonContent.lesson_objectives);
      setInitialLessonObjectives(JSON.parse(JSON.stringify(dbLessonContent.lesson_objectives)));
    } else {
      setLessonObjectives([]);
      setInitialLessonObjectives([]);
    }
  }, [dbLessonContent, selectedLessonNum, lessonContentNotReady]);

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

  // Signature used to avoid retrying a save that failed with unchanged state
  const stateSignature = useMemo(
    () => JSON.stringify({ details, lessons, sections, lessonObjectives, selectedLessonNum }),
    [details, lessons, sections, lessonObjectives, selectedLessonNum]
  );

  // Core save — used by autosave and by flush-on-navigate. Returns a Promise.
  const runSave = useCallback(async ({ detailsSnap, lessonsSnap, sectionsSnap, objectivesSnap, lessonNumSnap, signature }) => {
    // Save-side state updates are low-priority so they don't interrupt typing.
    startTransition(() => {
      setIsSaving(true);
      setSaveError(null);
    });
    try {
      // Validate graded activities for the captured lesson snapshot
      if (lessonNumSnap) {
        const mcqSections = sectionsSnap.filter(s => s.type === "activity" && s.activity_type === "mcq");
        if (mcqSections.length > 1) {
          throw new Error("Only one MCQ activity is allowed per lesson.");
        }
        if (mcqSections.length === 1 && sectionsSnap[sectionsSnap.length - 1]?.activity_type !== "mcq") {
          throw new Error("The graded MCQ activity must be the last section in the lesson.");
        }
      }

      // Save course details when on Course Details tab
      if (lessonNumSnap === null) {
        const existing = await entities.CourseDetails.filter({ year_level_key: yearLevel.key });
        const payload = {
          subtitle: detailsSnap.subtitle,
          quote: detailsSnap.quote,
          quoteAuthor: detailsSnap.quoteAuthor,
          summary: detailsSnap.summary,
          objectives: detailsSnap.objectives,
        };
        if (existing.length > 0) {
          await entities.CourseDetails.update(existing[0].id, payload);
        } else {
          await entities.CourseDetails.create({ year_level_key: yearLevel.key, ...payload });
        }
      }

      // Save lesson content when a lesson is selected
      if (lessonNumSnap) {
        const existingContent = await entities.LessonContent.filter({
          year_level_key: yearLevel.key,
          lesson_number: lessonNumSnap,
        });
        const payload = { sections: sectionsSnap, lesson_objectives: objectivesSnap };
        if (existingContent.length > 0) {
          await entities.LessonContent.update(existingContent[0].id, payload);
        } else {
          await entities.LessonContent.create({
            year_level_key: yearLevel.key,
            lesson_number: lessonNumSnap,
            ...payload,
          });
        }
      }

      // Save lessons + details to Courseware entity (single source of truth)
      const existingCw = await entities.Courseware.filter({ key: yearLevel.key });
      const cwPayload = {
        lessons: lessonsSnap,
        subtitle: detailsSnap.subtitle,
        summary: detailsSnap.summary,
        quote: detailsSnap.quote,
        quoteAuthor: detailsSnap.quoteAuthor,
        objectives: detailsSnap.objectives,
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

      // Mark this snapshot as saved. Only overwrite initial-state refs that
      // match the saved snapshot so edits made during the save aren't clobbered.
      // Wrapped in startTransition so post-save re-renders don't interrupt typing.
      startTransition(() => {
        setInitialDetails(prev => (JSON.stringify(prev) === JSON.stringify(detailsSnap) ? prev : JSON.parse(JSON.stringify(detailsSnap))));
        setInitialLessons(prev => (JSON.stringify(prev) === JSON.stringify(lessonsSnap) ? prev : JSON.parse(JSON.stringify(lessonsSnap))));
        setInitialSections(prev => (JSON.stringify(prev) === JSON.stringify(sectionsSnap) ? prev : JSON.parse(JSON.stringify(sectionsSnap))));
        setInitialLessonObjectives(prev => (JSON.stringify(prev) === JSON.stringify(objectivesSnap) ? prev : JSON.parse(JSON.stringify(objectivesSnap))));
        setLastSavedAt(new Date());
      });

      queryClient.invalidateQueries({ queryKey: ["course-details", yearLevel.key] });
      queryClient.invalidateQueries({ queryKey: ["lesson-content"] });
      queryClient.invalidateQueries({ queryKey: ["coursewares"] });
      erroredSignatureRef.current = null;
    } catch (err) {
      erroredSignatureRef.current = signature;
      startTransition(() => setSaveError(err.message || "Failed to save changes"));
      console.error("Autosave error:", err);
    } finally {
      startTransition(() => setIsSaving(false));
    }
  }, [queryClient, yearLevel.key, yearLevel.grade, yearLevel.segment]);

  // Flush: run any pending autosave immediately and wait for it.
  const flushSave = useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    if (inFlightSaveRef.current) {
      await inFlightSaveRef.current;
    }
    // Refuse to flush while the current lesson's content hasn't arrived yet —
    // local sections state is [] as a placeholder and would wipe the DB row.
    if (lessonContentNotReady) return;
    if (hasUnsavedChanges && erroredSignatureRef.current !== stateSignature) {
      inFlightSaveRef.current = runSave({
        detailsSnap: details,
        lessonsSnap: lessons,
        sectionsSnap: sections,
        objectivesSnap: lessonObjectives,
        lessonNumSnap: selectedLessonNum,
        signature: stateSignature,
      });
      try { await inFlightSaveRef.current; } finally { inFlightSaveRef.current = null; }
    }
  }, [hasUnsavedChanges, stateSignature, details, lessons, sections, lessonObjectives, selectedLessonNum, runSave, lessonContentNotReady]);

  // Autosave effect — debounce 5s after last change (save on idle)
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    if (isSaving) return;
    // Block autosave while the currently selected lesson's content hasn't
    // loaded yet. Otherwise a save triggered by `details` or `lessons`
    // changes can write the pre-load `sections: []` into a lesson that
    // actually has content on the server — wiping it.
    if (lessonContentNotReady) return;
    if (erroredSignatureRef.current === stateSignature) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    const detailsSnap = details;
    const lessonsSnap = lessons;
    const sectionsSnap = sections;
    const objectivesSnap = lessonObjectives;
    const lessonNumSnap = selectedLessonNum;
    const signature = stateSignature;
    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null;
      inFlightSaveRef.current = runSave({ detailsSnap, lessonsSnap, sectionsSnap, objectivesSnap, lessonNumSnap, signature });
      inFlightSaveRef.current.finally(() => { inFlightSaveRef.current = null; });
    }, 5000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [hasUnsavedChanges, isSaving, stateSignature, details, lessons, sections, lessonObjectives, selectedLessonNum, runSave, lessonContentNotReady]);

  // Save immediately when focus moves out of the currently edited section
  // (e.g. user clicks a different section card, or clicks outside the editor).
  useEffect(() => {
    let currentSectionId = null;
    const handler = () => {
      const el = document.activeElement;
      const card = el?.closest?.("[data-section-id]");
      const id = card?.getAttribute("data-section-id") || null;
      if (id !== currentSectionId) {
        // Focus moved to a different section (or out of all sections).
        // If the user was editing a section and has now left it, flush pending save.
        if (currentSectionId !== null) {
          flushSave();
        }
        currentSectionId = id;
      }
    };
    // focusin bubbles, focus does not — use focusin on document.
    document.addEventListener("focusin", handler);
    return () => document.removeEventListener("focusin", handler);
  }, [flushSave]);

  // Warn on tab close / navigation away if a save is pending or in flight
  useEffect(() => {
    const handler = (e) => {
      if (hasUnsavedChanges || isSaving) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges, isSaving]);

  // Autosave status for UI
  const autosaveStatus = isSaving
    ? "saving"
    : saveError
      ? "error"
      : hasUnsavedChanges
        ? "pending"
        : lastSavedAt
          ? "saved"
          : "idle";

  // Lesson switch — flush pending save first so nothing is lost
  const handleSelectLesson = useCallback(async (lessonNum) => {
    await flushSave();
    setSelectedLessonNum(lessonNum);
    setSections([]);
    setLessonObjectives([]);
  }, [flushSave]);

  // Close — flush pending save first
  const handleCloseClick = useCallback(async () => {
    await flushSave();
    onClose();
  }, [flushSave, onClose]);

  // Preview — flush pending save so the preview sees the latest content
  const handlePreview = useCallback(async (lessonNum) => {
    await flushSave();
    window.open(`/Viewer?yearLevel=${yearLevel.key}&lesson=${lessonNum}&returnTo=CourseBuilder`, "_blank");
  }, [flushSave, yearLevel.key]);

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
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">Lessons</h2>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => addLesson("lesson")} className="gap-2">
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      Lesson
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addLesson("milestone")} className="gap-2">
                      <Plus className="w-3.5 h-3.5 text-amber-600" />
                      Milestone
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-1">
                <div
                  onClick={() => handleSelectLesson(null)}
                  className={`px-3 py-2 rounded-md cursor-pointer border transition-colors ${
                    selectedLessonNum === null
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-transparent hover:bg-gray-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">Course Details</p>
                </div>
                {lessons.map((lesson, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectLesson(lesson.num)}
                    className={`group px-3 py-2 rounded-md cursor-pointer border transition-colors ${
                      selectedLessonNum === lesson.num
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-500">
                          {lesson.type === "milestone" ? (
                            <span className="text-amber-700">Milestone {lesson.milestoneNum || lessons.filter((l, li) => l.type === "milestone" && li <= idx).length}</span>
                          ) : (
                            <>Lesson {lessons.filter((l, li) => l.type !== "milestone" && li < idx).length + 1}</>
                          )}
                        </p>
                        <p className="text-sm font-medium text-gray-900 truncate">{lesson.title || <span className="italic text-gray-400">Untitled</span>}</p>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); moveLesson(idx, "up"); }}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); moveLesson(idx, "down"); }}
                          disabled={idx === lessons.length - 1}
                          className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setConfirmDelete({ kind: "lesson", idx, label: `Lesson ${lesson.num}: ${lesson.title || ""}` });
                          }}
                          className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-5">Course Details</h2>

              <div className="space-y-5">
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
              <div className="mb-6">
                {editingLessonField?.num === selectedLessonNum && editingLessonField?.field === "title" ? (
                  <Input
                    autoFocus
                    value={lessons.find(l => l.num === selectedLessonNum)?.title || ""}
                    onChange={e => updateLesson(selectedLessonNum, { title: e.target.value })}
                    onBlur={() => setEditingLessonField(null)}
                    onKeyDown={e => e.key === "Enter" && setEditingLessonField(null)}
                    className="text-xl font-bold mb-2"
                  />
                ) : (
                  <h2
                    className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 flex items-center gap-2 group mb-2"
                    onClick={() => setEditingLessonField({ num: selectedLessonNum, field: "title" })}
                  >
                    {lessons.find(l => l.num === selectedLessonNum)?.title}
                    <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-50" />
                  </h2>
                )}
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
                    <span>{lessons.find(l => l.num === selectedLessonNum)?.summary || <span className="italic text-gray-400">Add a summary…</span>}</span>
                    <Edit2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-50" />
                  </p>
                )}
              </div>

              {/* Lesson Objectives */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Objectives</h3>
                <div className="space-y-2 mb-3">
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Sections</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        Add Section
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={addSection} className="gap-2">
                        <Plus className="w-3.5 h-3.5 text-blue-600" />
                        Content
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => addTypedSection("callout")} className="gap-2">
                        <Plus className="w-3.5 h-3.5 text-amber-600" />
                        Callout
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => addActivity("mcq")}
                        disabled={countGradedActivities() >= 1}
                        className="gap-2"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
                        MCQ {countGradedActivities() >= 1 && <span className="ml-auto text-xs text-gray-400">Only one</span>}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => addActivity("micro_validation")} className="gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-cyan-600" />
                        Micro Validation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {sections.length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                    <p className="text-sm text-gray-600 font-medium mb-1">No sections yet</p>
                    <p className="text-xs text-gray-500 mb-3">Use "Add Section" above to start building this lesson.</p>
                    <Button onClick={addSection} size="sm" variant="outline" className="gap-1">
                      <Plus className="w-3 h-3" /> Add Content
                    </Button>
                  </div>
                )}

                <div className="space-y-3">
                  {sections.map((section, idx) => (
                    <Card key={section.id} className="border-gray-200" data-section-id={section.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={section.title}
                            onChange={e => updateSection(section.id, { title: e.target.value })}
                            placeholder="Section title"
                            className="text-sm flex-1"
                          />
                          {isMcqSection(section) ? (
                            <span className="text-xs text-purple-700 font-medium bg-purple-50 border border-purple-200 rounded px-2 py-1 flex items-center gap-1">
                              🔒 MCQ
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
                              className="border border-gray-200 rounded px-2 py-1 text-xs bg-white text-gray-600"
                            >
                              <option value="text">Content</option>
                              <option value="callout">Callout</option>
                              <option value="mcq">MCQ</option>
                              <option value="micro_validation">Micro Validation</option>
                            </select>
                          )}
                          <div className="flex items-center border-l border-gray-200 pl-1 ml-1">
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => moveSection(section.id, "up")}
                              disabled={idx === 0 || isMcqSection(section)}
                              className="h-7 w-7 text-gray-500"
                              aria-label="Move up"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => moveSection(section.id, "down")}
                              disabled={idx === sections.length - 1 || isMcqSection(section) || isMcqSection(sections[idx + 1])}
                              className="h-7 w-7 text-gray-500"
                              aria-label="Move down"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmDelete({ kind: "section", id: section.id, label: section.title || "this section" })}
                              className="h-7 w-7 text-gray-500 hover:text-red-600"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
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

      {/* Bottom Bar — autosave status + Preview + Close */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-8 py-4 flex items-center">
        <div className="flex-1 min-w-0">
          <AutosaveIndicator status={autosaveStatus} error={saveError} lastSavedAt={lastSavedAt} verbose />
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => handlePreview(selectedLessonNum ?? 0)}
          >
            <Eye className="w-4 h-4" />
            Preview
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

    </div>
  );
}

function AutosaveIndicator({ status, error, lastSavedAt, verbose = false }) {
  const formatTime = (d) => {
    if (!d) return null;
    const hh = String(d.getHours() % 12 || 12);
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ampm = d.getHours() >= 12 ? "PM" : "AM";
    return `${hh}:${mm} ${ampm}`;
  };

  if (status === "saving") {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <span>Saving…</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-2 text-red-600 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>{verbose ? `Save failed: ${error}` : "Save failed"}</span>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 text-amber-600 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>Pending changes…</span>
      </div>
    );
  }
  if (status === "saved") {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>{verbose && lastSavedAt ? `Saved at ${formatTime(lastSavedAt)}` : "Saved"}</span>
      </div>
    );
  }
  return null;
}