import React from "react";
import ReactMarkdown from "react-markdown";
import MCQActivity from "./MCQActivity";
import MicroValidationActivity from "./MicroValidationActivity";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function LessonRenderer({ section, onActivityComplete, lessonObjectives }) {
  // Render lesson objectives at the start (only once)
  if (!section && lessonObjectives && lessonObjectives.length > 0) {
    return (
      <div className="mx-auto px-8 py-8 max-w-3xl">
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-2xl font-bold text-[#0B5394] mb-4">Learning Objectives</h2>
          <ul className="space-y-2">
            {lessonObjectives.map((obj, idx) => (
              <li key={idx} className="flex gap-3 text-gray-700">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (!section) return null;

  // Render text sections (Quill HTML output)
  if (section.type === "text") {
    return (
      <div className="mx-auto px-8 py-8 max-w-3xl">
        {section.title && <h2 className="text-2xl font-bold text-[#0B5394] mb-3">{section.title}</h2>}
        <div className="text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: section.content }} />
      </div>
    );
  }

  // Render activity sections
  if (section.type === "activity") {
    if (section.activity_type === "mcq_graded" || section.activity_type === "mcq") {
      const questions = section.items?.length > 0
        ? section.items
        : section.question
          ? [{ question: section.question, options: section.options || [], correct_answer_index: section.correct_answer_index || 0 }]
          : [];
      return (
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="p-3 mb-4 bg-purple-50 rounded border border-purple-200">
            <p className="text-xs font-semibold text-purple-700">Graded Assessment</p>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{section.title}</h2>
          <MCQActivity
            questions={questions}
            onComplete={score => onActivityComplete(section.id, score)}
          />
        </div>
      );
    }

    if (section.activity_type === "identification_graded") {
      return (
        <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
          <div className="p-3 mb-4 bg-orange-50 rounded border border-orange-200">
            <p className="text-xs font-semibold text-orange-700">Graded Assessment</p>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{section.title}</h2>
          {section.items?.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900">{item.question}</p>
              <input
                type="text"
                placeholder="Your answer..."
                className="mt-2 w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          ))}
          <Button onClick={() => onActivityComplete(section.id)} className="w-full bg-orange-600 hover:bg-orange-700">
            Submit Answers
          </Button>
        </div>
      );
    }

    if (section.activity_type === "micro_validation") {
      const item = section.items?.[0] || {
        question: section.question,
        options: section.options,
        explanations: section.explanations,
        correct_answer_index: section.correct_answer_index
      };
      return (
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="p-3 mb-4 bg-cyan-50 rounded border border-cyan-200">
            <p className="text-xs font-semibold text-cyan-700">Check Your Understanding</p>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{section.title}</h2>
          {item.question ? (
            <MicroValidationActivity
              item={item}
              onComplete={() => onActivityComplete(section.id)}
            />
          ) : (
            <p className="text-gray-500">No validation items available.</p>
          )}
        </div>
      );
    }
  }

  return null;
}