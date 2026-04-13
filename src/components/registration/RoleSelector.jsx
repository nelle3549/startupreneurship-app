import React from "react";
import { Users, GraduationCap } from "lucide-react";

export default function RoleSelector({ onSelect, onSkip }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">One more step!</h2>
          <p className="text-gray-500 text-sm mt-2">How are you using this app? You can set this up later.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelect("facilitator")}
            className="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
              <Users className="w-7 h-7 text-red-600" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-sm">Facilitator</p>
              <p className="text-xs text-gray-500 mt-1">Teacher / Instructor</p>
            </div>
          </button>

          <button
            onClick={() => onSelect("student")}
            className="flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
              <GraduationCap className="w-7 h-7 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900 text-sm">Student</p>
              <p className="text-xs text-gray-500 mt-1">Learner / Evaluator</p>
            </div>
          </button>
        </div>
        {onSkip && (
          <div className="text-center mt-5">
            <button onClick={onSkip} className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors">
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}