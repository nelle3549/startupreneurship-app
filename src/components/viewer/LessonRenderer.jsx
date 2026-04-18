import React from "react";
import MCQActivity from "./MCQActivity";
import MicroValidationActivity from "./MicroValidationActivity";
import { Button } from "@/components/ui/button";
import { CheckCircle, Rocket, Info, AlertTriangle, Lightbulb } from "lucide-react";

/** Shared prose class for all HTML content from Quill editor */
const proseClass = "prose prose-slate max-w-none prose-headings:text-[#0B5394] prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-blockquote:border-l-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-a:text-blue-600 prose-a:underline prose-img:rounded-xl prose-img:border prose-img:border-gray-200 prose-img:mx-auto prose-table:text-sm prose-th:bg-gray-100 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2 prose-td:border prose-th:border prose-ol:list-decimal prose-ul:list-disc";

/**
 * Post-process HTML content to ensure iframes (YouTube, Google Drive, etc.) render properly.
 * - Wraps bare iframes in a responsive container
 * - Adds proper allow attributes for GDrive playback
 */
function processContent(html) {
  if (!html) return html;
  // Ensure all iframes have allow attribute for proper playback
  return html
    .replace(/<iframe([^>]*?)(?<!\ballow=)[^>]*>/gi, (match, attrs) => {
      if (match.includes('allow=')) return match;
      return match.replace('<iframe', '<iframe allow="autoplay; encrypted-media"');
    })
    // Wrap bare iframes (not already in a container) in a responsive div
    .replace(/(<iframe[^>]*class="ql-video"[^>]*><\/iframe>)/gi,
      '<div class="video-embed-wrapper" style="position:relative;width:100%;aspect-ratio:16/9;margin:1rem 0;border-radius:0.75rem;overflow:hidden;border:1px solid #e5e7eb;">$1</div>'
    );
}

export default function LessonRenderer({ section, onActivityComplete, lessonObjectives }) {
  // Render lesson objectives at the start (only once)
  if (!section && lessonObjectives && lessonObjectives.length > 0) {
    return (
      <div className="mx-auto px-6 sm:px-8 py-6 sm:py-8 max-w-3xl">
        <div className="p-5 sm:p-6 bg-blue-50 rounded-xl border border-blue-200">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B5394] mb-4">Learning Objectives</h2>
          <ul className="space-y-2">
            {lessonObjectives.map((obj, idx) => (
              <li key={idx} className="flex gap-3 text-gray-700 text-sm sm:text-base">
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
      <div className="mx-auto px-6 sm:px-8 py-6 sm:py-8 max-w-3xl">
        {section.title && (
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B5394] mb-4">{section.title}</h2>
        )}
        <div className={proseClass} dangerouslySetInnerHTML={{ __html: processContent(section.content) }} />
      </div>
    );
  }

  // Render image sections
  if (section.type === "image") {
    return (
      <div className="mx-auto px-6 sm:px-8 py-6 sm:py-8 max-w-3xl">
        {section.title && (
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B5394] mb-4">{section.title}</h2>
        )}
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 mb-4">
          <img
            src={section.src}
            alt={section.alt || section.title || ""}
            className="w-full max-h-[500px] object-contain"
          />
        </div>
        {section.caption && (
          <p className="text-sm text-gray-500 text-center mb-4 italic">{section.caption}</p>
        )}
        {section.content && (
          <div className={proseClass} dangerouslySetInnerHTML={{ __html: processContent(section.content) }} />
        )}
      </div>
    );
  }

  // Render video sections
  if (section.type === "video") {
    return (
      <div className="mx-auto px-6 sm:px-8 py-6 sm:py-8 max-w-3xl">
        {section.title && (
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B5394] mb-4">{section.title}</h2>
        )}
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-black aspect-video mb-4">
          <iframe
            src={section.src}
            title={section.title || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        {section.caption && (
          <p className="text-sm text-gray-500 text-center mb-4 italic">{section.caption}</p>
        )}
        {section.content && (
          <div className={proseClass} dangerouslySetInnerHTML={{ __html: processContent(section.content) }} />
        )}
      </div>
    );
  }

  // Render callout sections
  if (section.type === "callout") {
    const styles = {
      action: { bg: "bg-gradient-to-r from-orange-50 to-amber-50", border: "border-orange-300", icon: <Rocket className="w-5 h-5 text-orange-500" />, titleColor: "text-orange-800" },
      info: { bg: "bg-blue-50", border: "border-blue-300", icon: <Info className="w-5 h-5 text-blue-500" />, titleColor: "text-blue-800" },
      warning: { bg: "bg-amber-50", border: "border-amber-300", icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, titleColor: "text-amber-800" },
      tip: { bg: "bg-emerald-50", border: "border-emerald-300", icon: <Lightbulb className="w-5 h-5 text-emerald-500" />, titleColor: "text-emerald-800" },
    };
    const style = styles[section.style] || styles.action;

    return (
      <div className="mx-auto px-6 sm:px-8 py-6 sm:py-8 max-w-3xl">
        <div className={`${style.bg} border ${style.border} rounded-xl p-5 sm:p-6`}>
          <div className="flex items-center gap-2 mb-3">
            {style.icon}
            <h2 className={`text-lg font-bold ${style.titleColor}`}>{section.title || "Note"}</h2>
          </div>
          <div className={`${proseClass} prose-p:text-gray-600`} dangerouslySetInnerHTML={{ __html: processContent(section.content) }} />
        </div>
      </div>
    );
  }

  // Render activity sections
  if (section.type === "activity") {
    if (section.activity_type === "mcq_graded" || section.activity_type === "mcq") {
      const toViewerQuestion = (src) => ({
        q: src.q ?? src.question ?? "",
        options: src.options || [],
        answer: src.answer ?? src.correct_answer_index ?? 0,
      });
      const questions = section.items?.length > 0
        ? section.items.map(toViewerQuestion)
        : section.question
          ? [toViewerQuestion(section)]
          : [];
      return (
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="p-3 mb-4 bg-purple-50 rounded-lg border border-purple-200">
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
          <div className="p-3 mb-4 bg-orange-50 rounded-lg border border-orange-200">
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
      const raw = section.items?.[0] || section;
      const correctIdx = raw.correct_answer ?? raw.correct_answer_index ?? 0;
      const sharedExplanation = raw.correct_answer_explanation || "";
      const perOptionExplanations = raw.explanations || [];
      const normalizedOptions = (raw.options || []).map((opt, idx) => {
        if (opt && typeof opt === "object") {
          return { text: opt.text ?? "", explanation: opt.explanation ?? "" };
        }
        return {
          text: opt ?? "",
          explanation:
            perOptionExplanations[idx] ??
            (idx === correctIdx
              ? sharedExplanation
              : sharedExplanation
                ? `The correct answer is "${raw.options?.[correctIdx] ?? ""}". ${sharedExplanation}`
                : ""),
        };
      });
      const item = {
        q: raw.q ?? raw.question ?? "",
        options: normalizedOptions,
        correct_answer: correctIdx,
      };
      return (
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="p-3 mb-4 bg-cyan-50 rounded-lg border border-cyan-200">
            <p className="text-xs font-semibold text-cyan-700">Check Your Understanding</p>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{section.title}</h2>
          {item.q ? (
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
