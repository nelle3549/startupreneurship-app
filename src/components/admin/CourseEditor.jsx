import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronUp, ChevronDown, Plus, Trash2, Edit2, X, CheckCircle
} from "lucide-react";
import { LESSON_CONTENT_MAP } from "@/components/data/lessonContentData";

export default function CourseEditor({ yearLevel, onClose }) {
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
  const [selectedLessonContent, setSelectedLessonContent] = useState(null);
  const [contentSections, setContentSections] = useState({});

  const lessonContent = useMemo(() => {
    return LESSON_CONTENT_MAP[yearLevel.key] || null;
  }, [yearLevel.key]);

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

  const moveLesson = (idx, direction) => {
    const newLessons = [...lessons];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newLessons.length) return;
    [newLessons[idx], newLessons[swapIdx]] = [newLessons[swapIdx], newLessons[idx]];
    setLessons(newLessons);
  };

  const removeLesson = (idx) => {
    setLessons(prev => prev.filter((_, i) => i !== idx));
  };

  const addLesson = () => {
    const newLessonNum = lessons.length + 1;
    setLessons(prev => [
      ...prev,
      { num: newLessonNum, title: "New Lesson", summary: "Lesson content coming soon.", objectives: [] }
    ]);
    setExpandedLessons(prev => ({ ...prev, [lessons.length]: true }));
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
  };

  const addSection = () => {
    if (!selectedLessonContent) return;
    const key = `section-${Date.now()}`;
    setContentSections(prev => ({
      ...prev,
      [selectedLessonContent]: {
        ...(prev[selectedLessonContent] || {}),
        [key]: { id: key, title: "", type: "text", content: "" }
      }
    }));
  };

  const removeSection = (sectionKey) => {
    setContentSections(prev => ({
      ...prev,
      [selectedLessonContent]: Object.fromEntries(
        Object.entries(prev[selectedLessonContent] || {}).filter(([k]) => k !== sectionKey)
      )
    }));
  };

  const updateSection = (sectionKey, updates) => {
    setContentSections(prev => ({
      ...prev,
      [selectedLessonContent]: {
        ...(prev[selectedLessonContent] || {}),
        [sectionKey]: { ...prev[selectedLessonContent]?.[sectionKey], ...updates }
      }
    }));
  };

  const moveSection = (sectionKey, direction) => {
    const sections = Object.entries(contentSections[selectedLessonContent] || {});
    const idx = sections.findIndex(([k]) => k === sectionKey);
    if (idx === -1) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;
    const newSections = {};
    sections.forEach(([k, v], i) => {
      if (i === idx) newSections[sections[swapIdx][0]] = sections[swapIdx][1];
      else if (i === swapIdx) newSections[sections[idx][0]] = sections[idx][1];
      else newSections[k] = v;
    });
    setContentSections(prev => ({
      ...prev,
      [selectedLessonContent]: newSections
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="font-bold text-gray-900">{yearLevel.grade}</h2>
            <p className="text-xs text-gray-400">{yearLevel.bookTitle}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs value={editMode} onValueChange={setEditMode}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="details">Course Details</TabsTrigger>
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            {/* ── Details Tab ── */}
            <TabsContent value="details" className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Subtitle</label>
                <Input
                  value={details.subtitle}
                  onChange={e => setDetails(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Summary</label>
                <Textarea
                  value={details.summary}
                  onChange={e => setDetails(prev => ({ ...prev, summary: e.target.value }))}
                  className="text-sm min-h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Inspirational Quote</label>
                <Textarea
                  value={details.quote}
                  onChange={e => setDetails(prev => ({ ...prev, quote: e.target.value }))}
                  placeholder="e.g. 'The only way to do great work...'"
                  className="text-sm min-h-16"
                />
                <Input
                  placeholder="Author name"
                  value={details.quoteAuthor}
                  onChange={e => setDetails(prev => ({ ...prev, quoteAuthor: e.target.value }))}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeObjective(i)}
                        className="h-6 w-6 text-gray-400 hover:text-red-600"
                      >
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
                  <Button
                    onClick={addObjective}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ── Content Tab ── */}
            <TabsContent value="content" className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Lesson</label>
                <select
                  value={selectedLessonContent || ""}
                  onChange={e => {
                    const value = e.target.value || null;
                    setSelectedLessonContent(value);
                    if (value && lessonContent && lessonContent.sections) {
                      setContentSections(prev => ({
                        ...prev,
                        [value]: lessonContent.sections
                      }));
                    }
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Choose a lesson...</option>
                  {lessons.map((lesson, idx) => (
                    <option key={idx} value={`lesson-${idx}`}>
                      Lesson {lesson.num}: {lesson.title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedLessonContent && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 text-sm">Lesson Sections</h4>
                    <Button onClick={addSection} size="sm" className="bg-blue-600 text-white gap-1">
                      <Plus className="w-3 h-3" />
                      Add Section
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(contentSections[selectedLessonContent] || {}).map(([key, section]) => (
                      <Card key={key} className="border-gray-200">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                value={section.title}
                                onChange={e => updateSection(key, { title: e.target.value })}
                                placeholder="Section title"
                                className="text-xs flex-1"
                              />
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveSection(key, "up")}
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveSection(key, "down")}
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-400"
                                  onClick={() => removeSection(key)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <select
                              value={section.type || "text"}
                              onChange={e => updateSection(key, { type: e.target.value })}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                            >
                              <option value="text">Text</option>
                              <option value="story">Story</option>
                              <option value="video">Video</option>
                            </select>
                            <Textarea
                              value={section.content}
                              onChange={e => updateSection(key, { content: e.target.value })}
                              placeholder="Content..."
                              className="text-xs min-h-16"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {Object.keys(contentSections[selectedLessonContent] || {}).length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-400">No sections yet. Add one to get started.</p>
                    </div>
                  )}
                </div>
              )}

              {!selectedLessonContent && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">Select a lesson above to edit its content sections.</p>
                </div>
              )}
            </TabsContent>

            {/* ── Lessons Tab ── */}
            <TabsContent value="lessons" className="space-y-3">
              <Button onClick={addLesson} className="w-full mb-4 gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                <Plus className="w-4 h-4" />
                Add New Lesson
              </Button>
              {lessons.map((lesson, idx) => (
                <Card key={idx} className="border-gray-200">
                  <CardContent className="p-4">
                    <div
                      onClick={() => toggleLessonExpand(idx)}
                      className="flex items-start justify-between gap-3 cursor-pointer mb-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">Lesson {lesson.num}: {lesson.title}</p>
                        <p className="text-xs text-gray-500">{lesson.summary}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400"
                          onClick={e => {
                            e.stopPropagation();
                            moveLesson(idx, "up");
                          }}
                          disabled={idx === 0}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400"
                          onClick={e => {
                            e.stopPropagation();
                            moveLesson(idx, "down");
                          }}
                          disabled={idx === lessons.length - 1}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-600"
                          onClick={e => {
                            e.stopPropagation();
                            removeLesson(idx);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {expandedLessons[idx] && (
                      <div className="border-t pt-3 space-y-2 text-sm">
                        {editingLesson?.idx === idx ? (
                          <div className="space-y-2">
                            <Input
                              value={editingLesson.data.title}
                              onChange={e => setEditingLesson(prev => ({
                                ...prev,
                                data: { ...prev.data, title: e.target.value }
                              }))}
                              className="text-xs"
                              placeholder="Title"
                            />
                            <Textarea
                              value={editingLesson.data.summary}
                              onChange={e => setEditingLesson(prev => ({
                                ...prev,
                                data: { ...prev.data, summary: e.target.value }
                              }))}
                              className="text-xs min-h-12"
                              placeholder="Summary"
                            />
                            <div className="space-y-1">
                              {editingLesson.data.objectives?.map((obj, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <input
                                    value={obj}
                                    onChange={e => {
                                      const newObjs = [...editingLesson.data.objectives];
                                      newObjs[i] = e.target.value;
                                      setEditingLesson(prev => ({
                                        ...prev,
                                        data: { ...prev.data, objectives: newObjs }
                                      }));
                                    }}
                                    className="text-xs border border-gray-200 rounded px-2 py-1 flex-1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newObjs = editingLesson.data.objectives.filter((_, idx) => idx !== i);
                                      setEditingLesson(prev => ({
                                        ...prev,
                                        data: { ...prev.data, objectives: newObjs }
                                      }));
                                    }}
                                    className="h-6 w-6 text-gray-400"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => saveLessonEdit(idx, editingLesson.data)}
                                className="text-xs"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingLesson(null)}
                                className="text-xs text-gray-400"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-gray-600 mb-2"><strong>Summary:</strong> {lesson.summary}</p>
                            {lesson.objectives && lesson.objectives.length > 0 && (
                              <div>
                                <p className="text-gray-600 font-semibold mb-1">Objectives:</p>
                                <ul className="list-disc pl-5 text-gray-600">
                                  {lesson.objectives.map((obj, i) => (
                                    <li key={i}>{obj}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingLesson({ idx, data: { ...lesson } })}
                              className="text-xs mt-2 gap-1"
                            >
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-3 flex gap-2 justify-end rounded-b-3xl">
          <Button variant="outline" onClick={onClose} className="rounded-full">
            Close
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}