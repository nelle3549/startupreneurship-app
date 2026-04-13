import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  ChevronUp, ChevronDown, Plus, Trash2, Edit2, X, CheckCircle, Image as ImageIcon, Video, HelpCircle
} from "lucide-react";


const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"]
  ]
};

export default function CourseEditorV2({ yearLevel, onClose }) {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState("details");
  const [details, setDetails] = useState({
    subtitle: yearLevel.subtitle,
    quote: yearLevel.quote,
    quoteAuthor: yearLevel.quoteAuthor,
    summary: yearLevel.summary,
    objectives: yearLevel.objectives || [],
  });
  const [lessons, setLessons] = useState(yearLevel.lessons || []);
  const [editingLesson, setEditingLesson] = useState(null);
  const [newObjective, setNewObjective] = useState("");
  const [expandedLessons, setExpandedLessons] = useState({});
  const [selectedLessonNum, setSelectedLessonNum] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [detailsChanged, setDetailsChanged] = useState(false);
  const [lessonsChanged, setLessonsChanged] = useState(false);

  // Fetch lesson content from database
  const { data: dbLessonContent = null } = useQuery({
    queryKey: ["lesson-content", yearLevel.key, selectedLessonNum],
    queryFn: () => {
      if (!selectedLessonNum) return null;
      return base44.entities.LessonContent.filter({
        year_level_key: yearLevel.key,
        lesson_number: selectedLessonNum
      }).then(results => results[0] || null);
    },
    enabled: !!selectedLessonNum
  });

  const [sections, setSections] = useState([]);
  const [lessonObjectives, setLessonObjectives] = useState([]);
  const [newLessonObjective, setNewLessonObjective] = useState("");

  useEffect(() => {
    if (dbLessonContent?.sections) {
      setSections(dbLessonContent.sections);
    } else if (selectedLessonNum) {
      setSections([]);
    }
    if (dbLessonContent?.lesson_objectives) {
      setLessonObjectives(dbLessonContent.lesson_objectives);
    } else if (selectedLessonNum) {
      setLessonObjectives([]);
    }
  }, [dbLessonContent, selectedLessonNum]);

  const countGradedActivities = () => {
    return sections.filter(s => s.type === "activity" && (s.activity_type === "mcq_graded" || s.activity_type === "identification_graded")).length;
  };

  const saveLessonContent = useMutation({
    mutationFn: async () => {
      if (!selectedLessonNum) return;
      const gradedCount = countGradedActivities();
      if (gradedCount > 1) {
        alert("Error: Only one graded activity (MCQ or Identification) is allowed per lesson.");
        setIsSaving(false);
        return;
      }
      setIsSaving(true);
      
      const existingContent = await base44.entities.LessonContent.filter({
        year_level_key: yearLevel.key,
        lesson_number: selectedLessonNum
      });

      if (existingContent.length > 0) {
        await base44.entities.LessonContent.update(existingContent[0].id, {
          sections: sections,
          lesson_objectives: lessonObjectives
        });
      } else {
        await base44.entities.LessonContent.create({
          year_level_key: yearLevel.key,
          lesson_number: selectedLessonNum,
          sections: sections,
          lesson_objectives: lessonObjectives
        });
      }
      
      setIsSaving(false);
      queryClient.invalidateQueries({ queryKey: ["lesson-content"] });
    }
  });

  const saveDetails = async () => {
    setIsSaving(true);
    try {
      // Update year level details in memory (would need backend persistence if required)
      setDetailsChanged(false);
    } catch (err) {
      console.error("Failed to save details:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const saveLessons = async () => {
    setIsSaving(true);
    try {
      // Update lessons in memory (would need backend persistence if required)
      setLessonsChanged(false);
    } catch (err) {
      console.error("Failed to save lessons:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setDetails(prev => ({
        ...prev,
        objectives: [...prev.objectives, newObjective]
      }));
      setNewObjective("");
      setDetailsChanged(true);
    }
  };

  const removeObjective = (idx) => {
    setDetails(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== idx)
    }));
    setDetailsChanged(true);
  };

  const moveLesson = (idx, direction) => {
    const newLessons = [...lessons];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newLessons.length) return;
    [newLessons[idx], newLessons[swapIdx]] = [newLessons[swapIdx], newLessons[idx]];
    setLessons(newLessons);
    setLessonsChanged(true);
  };

  const removeLesson = (idx) => {
    setLessons(prev => prev.filter((_, i) => i !== idx));
    setLessonsChanged(true);
  };

  const addLesson = () => {
    const newLessonNum = lessons.length + 1;
    setLessons(prev => [
      ...prev,
      { num: newLessonNum, title: "New Lesson", summary: "Lesson content coming soon.", objectives: [] }
    ]);
    setExpandedLessons(prev => ({ ...prev, [lessons.length]: true }));
    setLessonsChanged(true);
  };

  const toggleLessonExpand = (idx) => {
    setExpandedLessons(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const saveLessonEdit = (idx, updated) => {
    setLessons(prev => {
      const newLessons = [...prev];
      newLessons[idx] = updated;
      return newLessons;
    });
    setEditingLesson(null);
    setLessonsChanged(true);
  };

  const addSection = () => {
    setSections(prev => [...prev, {
      id: `section-${Date.now()}`,
      type: "text",
      title: "New Section",
      content: ""
    }]);
  };

  const removeSection = (id) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const updateSection = (id, updates) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const moveSection = (id, direction) => {
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;
    const newSections = [...sections];
    [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];
    setSections(newSections);
  };

  const addActivity = (type) => {
    const gradedCount = countGradedActivities();
    if ((type === "mcq_graded" || type === "identification_graded") && gradedCount >= 1) {
      alert(`Cannot add another graded activity. Maximum one graded activity per lesson.`);
      return;
    }
    setSections(prev => [...prev, {
      id: `activity-${Date.now()}`,
      type: "activity",
      activity_type: type,
      is_graded: type === "mcq_graded" || type === "identification_graded",
      title: `New ${type.toUpperCase()} Activity`,
      items: []
    }]);
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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="font-bold text-gray-900">{yearLevel.grade}</h2>
            <p className="text-xs text-gray-400">{yearLevel.bookTitle}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          <Tabs value={editMode} onValueChange={setEditMode}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="details">Course Details</TabsTrigger>
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 pb-20">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                <Input
                  value={details.subtitle}
                  onChange={e => { setDetails(prev => ({ ...prev, subtitle: e.target.value })); setDetailsChanged(true); }}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Summary</label>
                <Textarea
                  value={details.summary}
                  onChange={e => { setDetails(prev => ({ ...prev, summary: e.target.value })); setDetailsChanged(true); }}
                  className="text-sm min-h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Inspirational Quote</label>
                <Textarea
                  value={details.quote}
                  onChange={e => { setDetails(prev => ({ ...prev, quote: e.target.value })); setDetailsChanged(true); }}
                  className="text-sm min-h-16"
                />
                <Input
                  placeholder="Author name"
                  value={details.quoteAuthor}
                  onChange={e => { setDetails(prev => ({ ...prev, quoteAuthor: e.target.value })); setDetailsChanged(true); }}
                  className="text-sm mt-2"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Learning Objectives</label>
                <div className="space-y-2 mb-3">
                  {details.objectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 flex-1">{obj}</p>
                      <Button variant="ghost" size="icon" onClick={() => removeObjective(i)} className="h-6 w-6 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={newObjective}
                    onChange={e => setNewObjective(e.target.value)}
                    placeholder="Add a learning objective..."
                    className="text-sm min-h-12"
                  />
                  <Button onClick={addObjective} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={saveDetails} disabled={!detailsChanged || isSaving} className="bg-blue-600 text-white hover:bg-blue-700">
                  {isSaving ? "Saving..." : "Save Details"}
                </Button>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Lesson</label>
                <select
                  value={selectedLessonNum || ""}
                  onChange={e => setSelectedLessonNum(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Choose a lesson...</option>
                  {lessons.map(lesson => (
                    <option key={lesson.num} value={lesson.num}>
                      Lesson {lesson.num}: {lesson.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedLessonNum && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Lesson Objectives</label>
                    <div className="space-y-2 mb-3">
                      {lessonObjectives.map((obj, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700 flex-1">{obj}</p>
                          <Button variant="ghost" size="icon" onClick={() => removeLessonObjective(i)} className="h-6 w-6 text-gray-400 hover:text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newLessonObjective}
                        onChange={e => setNewLessonObjective(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && addLessonObjective()}
                        placeholder="Add learning objective..."
                        className="text-sm flex-1 border border-gray-200 rounded px-3 py-2"
                      />
                      <Button onClick={addLessonObjective} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 text-sm">Lesson Sections</h4>
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={addSection} size="sm" className="bg-blue-600 text-white gap-1">
                        <Plus className="w-3 h-3" />
                        Text
                      </Button>
                      <Button onClick={() => addActivity("mcq_graded")} size="sm" className={`gap-1 text-white ${countGradedActivities() >= 1 ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600"}`} disabled={countGradedActivities() >= 1}>
                        <HelpCircle className="w-3 h-3" />
                        MCQ (Graded)
                      </Button>
                      <Button onClick={() => addActivity("identification_graded")} size="sm" className={`gap-1 text-white ${countGradedActivities() >= 1 ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600"}`} disabled={countGradedActivities() >= 1}>
                        <HelpCircle className="w-3 h-3" />
                        Identification (Graded)
                      </Button>
                      <Button onClick={() => addActivity("micro_validation")} size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white gap-1">
                        <HelpCircle className="w-3 h-3" />
                        Micro Validation
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
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
                            {section.type === "text" ? (
                              <select
                                value={section.type}
                                onChange={e => updateSection(section.id, { type: e.target.value })}
                                className="border border-gray-200 rounded px-2 py-1 text-xs"
                              >
                                <option value="text">Text</option>
                                <option value="activity">Activity</option>
                              </select>
                            ) : (
                              <select
                                value={section.activity_type || "mcq_graded"}
                                onChange={e => updateSection(section.id, { activity_type: e.target.value })}
                                className="border border-gray-200 rounded px-2 py-1 text-xs"
                              >
                                <option value="mcq_graded">MCQ (Graded)</option>
                                <option value="identification_graded">Identification (Graded)</option>
                                <option value="micro_validation">Micro Validation</option>
                              </select>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => moveSection(section.id, "up")} className="h-6 w-6">
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => moveSection(section.id, "down")} className="h-6 w-6">
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => removeSection(section.id)} className="h-6 w-6 text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>

                          {section.type === "text" && (
                            <div className="border border-gray-200 rounded">
                              <ReactQuill
                                theme="snow"
                                value={section.content}
                                onChange={content => updateSection(section.id, { content })}
                                modules={modules}
                                className="bg-white"
                              />
                            </div>
                          )}

                          {section.type === "activity" && (
                            <div className="p-3 bg-gray-50 rounded space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-gray-600">
                                    {section.activity_type === "micro_validation" ? "Micro Validation (Non-Graded)" : "Graded Activity"}
                                  </p>
                                  <p className="text-xs text-gray-500">Type: {section.activity_type}</p>
                                </div>
                              </div>
                              
                              {section.activity_type === "micro_validation" && (
                                <div className="space-y-2 mt-3">
                                  {section.items?.map((item, idx) => (
                                    <div key={idx} className="p-2 bg-white rounded border border-gray-200">
                                      <p className="text-xs font-semibold text-gray-700 mb-1">{item.q}</p>
                                      <p className="text-xs text-gray-600">Correct: {String.fromCharCode(65 + (item.correct_answer || 0))}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setSelectedLessonNum(null)}>Cancel</Button>
                    <Button onClick={() => saveLessonContent.mutate()} disabled={isSaving} className="bg-emerald-600 text-white">
                      {isSaving ? "Saving..." : "Save Content"}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Lessons Tab */}
            <TabsContent value="lessons" className="space-y-3 pb-20">
              <Button onClick={addLesson} className="w-full mb-4 gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <Plus className="w-4 h-4" />
                Add New Lesson
              </Button>
              {lessons.map((lesson, idx) => (
                <Card key={idx} className="border-gray-200">
                  <CardContent className="p-4">
                    <div onClick={() => toggleLessonExpand(idx)} className="flex items-start justify-between gap-3 cursor-pointer mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">Lesson {lesson.num}: {lesson.title}</p>
                        <p className="text-xs text-gray-500">{lesson.summary}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); moveLesson(idx, "up"); }} disabled={idx === 0} className="h-7 w-7 text-gray-400">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); moveLesson(idx, "down"); }} disabled={idx === lessons.length - 1} className="h-7 w-7 text-gray-400">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); removeLesson(idx); }} className="h-7 w-7 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {expandedLessons[idx] && (
                      <div className="border-t pt-3 space-y-2 text-sm">
                        {editingLesson?.idx === idx ? (
                          <div className="space-y-2">
                            <Input value={editingLesson.data.title} onChange={e => setEditingLesson(prev => ({ ...prev, data: { ...prev.data, title: e.target.value } }))} className="text-xs" placeholder="Title" />
                            <Textarea value={editingLesson.data.summary} onChange={e => setEditingLesson(prev => ({ ...prev, data: { ...prev.data, summary: e.target.value } }))} className="text-xs min-h-12" placeholder="Summary" />
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" variant="outline" onClick={() => saveLessonEdit(idx, editingLesson.data)} className="text-xs">Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingLesson(null)} className="text-xs text-gray-400">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-gray-600 mb-2"><strong>Summary:</strong> {lesson.summary}</p>
                            <Button size="sm" variant="outline" onClick={() => setEditingLesson({ idx, data: { ...lesson } })} className="text-xs gap-1 mt-2">
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={saveLessons} disabled={!lessonsChanged || isSaving} className="bg-blue-600 text-white hover:bg-blue-700">
                  {isSaving ? "Saving..." : "Save Lessons"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-3 flex gap-2 justify-end rounded-b-3xl">
          <Button variant="outline" onClick={onClose} className="rounded-full">Close</Button>
        </div>
      </div>
    </div>
  );
}