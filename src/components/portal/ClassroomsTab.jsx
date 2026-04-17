import React, { useState } from "react";
import { entities } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Users, BookOpen, Copy, QrCode, Check, Eye, AlertTriangle, Pencil, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCoursewares } from "@/hooks/useCoursewares";
import QRCode from "qrcode";
import EditClassroomModal from "@/components/classroom/EditClassroomModal";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function downloadQR(code, classroomName) {
  const url = await QRCode.toDataURL(code, { width: 400, margin: 2 });
  const a = document.createElement("a");
  a.href = url;
  a.download = `${classroomName.replace(/\s+/g, "_")}_QR.png`;
  a.click();
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-gray-700 transition-colors"
      title="Copy code"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

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

const getCurrentSchoolYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 8 ? year : year - 1;
  return `SY ${startYear}-${startYear + 1}`;
};

function CreateClassroomModal({ facilitatorId, facilitatorEmail, facilitatorSchool, onClose, yearLevelOptions }) {
  const [name, setName] = useState("");
  const [school, setSchool] = useState(facilitatorSchool || "");
  const [yearLevel, setYearLevel] = useState("");
  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => entities.Classroom.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !yearLevel) return;
    createMutation.mutate({
      name,
      school,
      year_level_key: yearLevel,
      school_year: schoolYear,
      description,
      facilitator_id: facilitatorId,
      facilitator_email: facilitatorEmail,
      enrollment_code: generateCode(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Create Classroom</h3>
        <p className="text-sm text-gray-500 mb-5">Set up a new classroom for your students.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Classroom Name *</label>
            <Input
              placeholder="e.g. Rizal — Grade 7"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">School *</label>
            <Input
              placeholder="School or organization name"
              value={school}
              onChange={e => setSchool(e.target.value)}
              required
            />
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
            <Input
              placeholder="e.g. Morning Class"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 brand-gradient text-white" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Classroom"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClassroomsTab({ facilitatorId, facilitatorEmail, facilitatorSchool, onViewStudents }) {
  const queryClient = useQueryClient();
  const { coursewares } = useCoursewares();
  const YEAR_LEVEL_OPTIONS = coursewares.map(yl => ({ value: yl.key, label: `${yl.grade} — ${yl.subtitle}` }));
  const [showCreate, setShowCreate] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);


  const { data: classrooms = [], isLoading } = useQuery({
    queryKey: ["classrooms", facilitatorId],
    queryFn: () => entities.Classroom.filter({ facilitator_id: facilitatorId }),
    enabled: !!facilitatorId,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments-all"],
    queryFn: () => entities.Enrollment.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entities.Classroom.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classrooms"] }),
  });

  const getEnrollmentCounts = (classroomId) => {
    const cls = enrollments.filter(e => e.classroom_id === classroomId);
    return {
      approved: cls.filter(e => e.status === "approved").length,
      pending: cls.filter(e => e.status === "pending").length,
    };
  };

  const yearLevelLabel = (key) => coursewares.find(c => c.key === key)?.grade || key;

  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900">My Classrooms</h2>
          <p className="text-xs text-gray-500 mt-0.5">{classrooms.length} classroom{classrooms.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="brand-gradient text-white rounded-full gap-2" size="sm">
          <Plus className="w-4 h-4" />
          New Classroom
        </Button>
      </div>

      {classrooms.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500 mb-1">No classrooms yet</p>
          <p className="text-xs text-gray-400 mb-4">Create your first classroom to start enrolling students.</p>
          <Button onClick={() => setShowCreate(true)} className="brand-gradient text-white rounded-full gap-2" size="sm">
            <Plus className="w-4 h-4" />
            Create Classroom
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map(cls => {
            const counts = getEnrollmentCounts(cls.id);
            return (
              <Card key={cls.id} className="hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 text-left">
                      <h3 className="font-bold text-gray-900 text-sm leading-snug truncate">{cls.name}</h3>
                      {cls.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{cls.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {(!cls.school_year || !cls.year_level_key) && (
                        <span title="Missing required fields (e.g. school year)" className="text-amber-500">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      )}
                      {counts.pending > 0 && (
                        <span title={`${counts.pending} pending enrollment(s)`} className="text-blue-500">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      )}
                      <button
                        onClick={() => setEditingClassroom(cls)}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                        title="Edit classroom"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete "${cls.name}"?`)) deleteMutation.mutate(cls.id); }}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete classroom"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <Badge className="bg-blue-100 text-blue-700 border-0 text-xs mb-3">
                    {yearLevelLabel(cls.year_level_key)}
                  </Badge>

                  {/* Enrollment Code */}
                  {cls.enrollment_code && (
                    <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-gray-400 leading-none mb-0.5">Enrollment Code</p>
                        <span className="font-mono font-bold text-sm tracking-widest text-gray-800">
                          {cls.enrollment_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CopyButton text={cls.enrollment_code} />
                        <button
                          onClick={() => downloadQR(cls.enrollment_code, cls.name)}
                          className="text-gray-400 hover:text-gray-700 transition-colors"
                          title="Download QR code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{counts.approved} enrolled</span>
                    </div>
                    {counts.pending > 0 && (
                      <div className="flex items-center gap-1 text-blue-600 font-medium">
                        <span>{counts.pending} pending</span>
                      </div>
                    )}
                  </div>

                  <Link to={`/ClassroomView?id=${cls.id}`}>
                    <Button
                      size="sm"
                      className="w-full text-xs gap-1.5 brand-gradient text-white border-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Classroom
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateClassroomModal
          facilitatorId={facilitatorId}
          facilitatorEmail={facilitatorEmail}
          facilitatorSchool={facilitatorSchool}
          onClose={() => setShowCreate(false)}
          yearLevelOptions={YEAR_LEVEL_OPTIONS}
        />
      )}

      {editingClassroom && (
        <EditClassroomModal
          classroom={editingClassroom}
          onClose={() => setEditingClassroom(null)}
        />
      )}
    </div>
  );
}