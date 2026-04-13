import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronUp, ChevronDown, CheckCircle, AlertCircle } from "lucide-react";

export default function MicroValidationActivityBuilder({ activity, updateSection }) {
  const [question, setQuestion] = useState(activity.question || "");
  const [options, setOptions] = useState(activity.options || ["", "", ""]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(activity.correct_answer_index !== undefined ? activity.correct_answer_index : 0);
  const [correctAnswerExplanation, setCorrectAnswerExplanation] = useState(activity.correct_answer_explanation || "");

  useEffect(() => {
    updateSection(activity.id, {
      question,
      options,
      correct_answer_index: correctAnswerIndex,
      correct_answer_explanation: correctAnswerExplanation,
    });
  }, [question, options, correctAnswerIndex, correctAnswerExplanation, activity.id, updateSection]);

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };



  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      if (correctAnswerIndex === index) {
        setCorrectAnswerIndex(0);
      } else if (correctAnswerIndex > index) {
        setCorrectAnswerIndex(correctAnswerIndex - 1);
      }
    }
  };

  const moveOption = (index, direction) => {
    const newOptions = [...options];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newOptions.length) {
      [newOptions[index], newOptions[newIndex]] = [newOptions[newIndex], newOptions[index]];
      setOptions(newOptions);
      if (correctAnswerIndex === index) {
        setCorrectAnswerIndex(newIndex);
      } else if (correctAnswerIndex === newIndex) {
        setCorrectAnswerIndex(index);
      }
    }
  };

  const isValid = useMemo(() => {
    const hasQuestion = question.trim() !== "";
    const allOptionsFilled = options.every(opt => opt.trim() !== "");
    const hasExplanation = correctAnswerExplanation.trim() !== "";
    return hasQuestion && allOptionsFilled && hasExplanation && options.length === 3;
  }, [question, options, correctAnswerExplanation]);

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Question *</Label>
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter Micro Validation question"
          className="text-sm"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold">Answer Options (Select one correct) *</Label>
        <RadioGroup
          value={String(correctAnswerIndex)}
          onValueChange={(value) => setCorrectAnswerIndex(parseInt(value))}
          className="space-y-2"
        >
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50">
              <RadioGroupItem value={String(index)} id={`option-${activity.id}-${index}`} />
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                className="text-sm flex-1"
              />
              {correctAnswerIndex === index && (
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" title="Correct Answer" />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => moveOption(index, "up")}
                disabled={index === 0}
                className="h-8 w-8"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => moveOption(index, "down")}
                disabled={index === options.length - 1}
                className="h-8 w-8"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              {options.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeOption(index)}
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
        <Label className="text-sm font-semibold text-emerald-900">Explanation for Correct Answer *</Label>
        <p className="text-xs text-emerald-700 mb-2">This explanation will be shown when the correct answer is selected or when a wrong answer is chosen.</p>
        <Textarea
          value={correctAnswerExplanation}
          onChange={(e) => setCorrectAnswerExplanation(e.target.value)}
          placeholder="Explain why this answer is correct"
          className="text-xs min-h-[60px]"
        />
      </div>

      {!isValid && (
        <div className="flex items-center gap-2 text-red-600 text-sm p-2 bg-red-50 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Question, all three options, and correct answer explanation required</span>
        </div>
      )}
    </div>
  );
}