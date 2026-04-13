import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useCoursewares } from "@/hooks/useCoursewares";

const SCHOOL_YEAR_OPTIONS = (() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const currentStart = month >= 8 ? year : year - 1;
  const options = [];
  for (let i = currentStart - 2; i <= currentStart + 3; i++) {
    options.push(`SY ${i}-${i + 1}`);
  }
  return options;
})();

export default function EditClassroomModal({ classroom, onClose, onSuccess }) {
  const { coursewares } = useCoursewares();
  const yearLevelOptions = coursewares.map(yl => ({ value: yl.key, label: `${yl.grade} — ${yl.subtitle}` }));

  const [name, setName] = useState(classroom.name);
  const [school, setSchool] = useState(classroom.school || "");
  const [yearLevel, setYearLevel] = useState(classroom.year_level_key || "");
  const [schoolYear, setSchoolYear] = useState(classroom.school_year || "");
  const [description, setDescription] = useState(classroom.description || "");
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Classroom.update(classroom.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["classroom", classroom.id] });
      onClose();
      onSuccess?.();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !yearLevel) return;
    updateMutation.mutate({ name, school, year_level_key: yearLevel, school_year: schoolYear, description });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Edit Classroom</h3>
        <p className="text-sm text-gray-500 mb-5">Update classroom details.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Classroom Name *</label>
            <Input placeholder="e.g. Rizal — Grade 7" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">School *</label>
            <Input placeholder="School or organization name" value={school} onChange={e => setSchool(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Year Level / Course *</label>
            <Select value={yearLevel} onValueChange={setYearLevel} required>
              <SelectTrigger>
                <SelectValue placeholder="Select year level..." />
              </SelectTrigger>
              <SelectContent>
                {yearLevelOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">School Year *</label>
            <Select value={schoolYear} onValueChange={setSchoolYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select school year..." />
              </SelectTrigger>
              <SelectContent>
                {SCHOOL_YEAR_OPTIONS.map(sy => (
                  <SelectItem key={sy} value={sy}>{sy}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Description (optional)</label>
            <Input placeholder="e.g. Morning Class" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 brand-gradient text-white" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}