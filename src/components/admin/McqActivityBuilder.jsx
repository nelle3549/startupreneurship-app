import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, CheckCircle, AlertCircle } from "lucide-react";

const MAX_POOL = 10;
const DISPLAY_COUNT = 5;

export default function McqActivityBuilder({ activity, updateSection }) {
  // Pool of questions stored in activity.items
  const items = activity.items || [];

  const updateItems = (newItems) => updateSection(activity.id, { items: newItems });

  const addQuestion = () => {
    if (items.length >= MAX_POOL) return;
    updateItems([...items, { question: "", options: ["", "", "", ""], correct_answer_index: 0 }]);
  };

  const removeQuestion = (idx) => {
    updateItems(items.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    updateItems(newItems);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const newItems = [...items];
    const opts = [...newItems[qIdx].options];
    opts[optIdx] = value;
    newItems[qIdx] = { ...newItems[qIdx], options: opts };
    updateItems(newItems);
  };

  const filledCount = items.filter(q => q.question.trim() && q.options.every(o => o.trim())).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700">Question Pool</p>
          <p className="text-xs text-gray-500">
            {filledCount}/{items.length} complete — Students answer {DISPLAY_COUNT} random questions from this pool
          </p>
        </div>
        <Button
          size="sm"
          onClick={addQuestion}
          disabled={items.length >= MAX_POOL}
          className="gap-1 bg-purple-600 text-white"
        >
          <Plus className="w-3 h-3" />
          Add Question ({items.length}/{MAX_POOL})
        </Button>
      </div>

      {items.length === 0 && (
        <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center bg-purple-50">
          <p className="text-sm text-purple-700 font-medium mb-1">No questions yet</p>
          <p className="text-xs text-purple-500 mb-3">Add up to {MAX_POOL} questions. Students will be randomly assigned {DISPLAY_COUNT}.</p>
          <Button size="sm" onClick={addQuestion} className="gap-1 bg-purple-600 text-white">
            <Plus className="w-3 h-3" /> Add First Question
          </Button>
        </div>
      )}

      {items.map((item, qIdx) => {
        const isComplete = item.question.trim() && item.options.every(o => o.trim());
        return (
          <div key={qIdx} className={`p-4 border rounded-lg space-y-3 ${isComplete ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Question {qIdx + 1}</span>
              <div className="flex items-center gap-2">
                {isComplete && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(qIdx)} className="h-7 w-7 text-red-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <Input
              value={item.question}
              onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
              placeholder="Enter question"
              className="text-sm"
            />

            <RadioGroup
              value={String(item.correct_answer_index ?? 0)}
              onValueChange={(v) => updateQuestion(qIdx, "correct_answer_index", parseInt(v))}
              className="space-y-1.5"
            >
              {item.options.map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <RadioGroupItem value={String(optIdx)} id={`q${qIdx}-opt${optIdx}-${activity.id}`} />
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                    className="text-sm flex-1 h-8"
                  />
                  {item.correct_answer_index === optIdx && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      })}

      {items.length > 0 && filledCount < DISPLAY_COUNT && (
        <div className="flex items-center gap-2 text-amber-600 text-xs p-2 bg-amber-50 rounded">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Add at least {DISPLAY_COUNT} complete questions for students to take the quiz ({filledCount} complete so far)</span>
        </div>
      )}
    </div>
  );
}
