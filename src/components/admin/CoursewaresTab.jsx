import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { Edit, Archive, Copy, Trash2, Plus, MoreHorizontal, ArchiveRestore } from "lucide-react";
import { useCoursewares } from "@/hooks/useCoursewares";

function CreateCoursewareModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ key: "", grade: "", subtitle: "", segment: "grade-school", summary: "" });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const cw = await base44.entities.Courseware.create(data);
      await base44.entities.CourseDetails.create({
        year_level_key: data.key,
        subtitle: data.subtitle || "Enter a subtitle for this course",
        summary: data.summary || "A brief overview of what students will learn in this course.",
        quote: "The journey of a thousand miles begins with a single step.",
        quoteAuthor: "Lao Tzu",
        objectives: ["Understand the core concepts of this course", "Apply learned skills to real-world scenarios"],
      });
      return cw;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coursewares"] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.key || !form.grade) return;
    createMutation.mutate({
      ...form,
      status: "active",
      lessons: [{ num: 1, title: "Lesson 1", summary: "Lesson content coming soon." }],
      order: 99,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Courseware</DialogTitle>
          <DialogDescription>Add a new course to the platform.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Key (unique ID) *</label>
            <Input
              placeholder="e.g. grade-13 or college-5"
              value={form.key}
              onChange={e => setForm({ ...form, key: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Grade / Level Label *</label>
            <Input placeholder="e.g. Grade 13" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Subtitle</label>
            <Input placeholder="e.g. Advanced Entrepreneurship" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Segment</label>
            <Select value={form.segment} onValueChange={v => setForm({ ...form, segment: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grade-school">Grade School</SelectItem>
                <SelectItem value="junior-senior-hs">JHS/SHS</SelectItem>
                <SelectItem value="college">College</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1.5">Summary</label>
            <Input placeholder="Brief description..." value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CoursewaresTab() {
  const queryClient = useQueryClient();
  const { coursewares, dbMap, isLoading } = useCoursewares({ includeArchived: true });
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDuplicate, setConfirmDuplicate] = useState(null);
  const [dupName, setDupName] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");

  const archiveMutation = useMutation({
    mutationFn: async ({ cw, archive }) => {
      const existing = dbMap[cw.key];
      if (existing) {
        return base44.entities.Courseware.update(existing.id, { status: archive ? "archived" : "active" });
      }
      return base44.entities.Courseware.create({
        key: cw.key, grade: cw.grade, subtitle: cw.subtitle,
        segment: cw.segment, summary: cw.summary, status: "archived"
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coursewares"] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async ({ cw, newKey }) => {
      return base44.entities.Courseware.create({
        key: newKey,
        grade: dupName || `${cw.grade} (Copy)`,
        subtitle: cw.subtitle,
        bookTitle: cw.bookTitle,
        summary: cw.summary,
        quote: cw.quote,
        quoteAuthor: cw.quoteAuthor,
        objectives: cw.objectives || [],
        lessons: cw.lessons || [],
        segment: cw.segment,
        order: (cw.order ?? 0) + 1,
        status: "active",
        original_courseware_id: dbMap[cw.key]?.id || cw.key,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coursewares"] });
      setConfirmDuplicate(null);
      setDupName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Courseware.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coursewares"] }),
  });

  const segmentLabel = (seg) => {
    if (seg === "grade-school") return "Grade School";
    if (seg === "junior-senior-hs") return "JHS/SHS";
    if (seg === "college") return "College";
    return seg || "";
  };

  const filtered = coursewares.filter(c =>
    filterStatus === "all" ? true :
    filterStatus === "archived" ? c.status === "archived" :
    c.status !== "archived"
  );

  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {["active", "archived", "all"].map(s => (
            <Button key={s} size="sm" variant={filterStatus === s ? "default" : "outline"} onClick={() => setFilterStatus(s)} className="rounded-full text-xs capitalize">
              {s}
            </Button>
          ))}
        </div>
        <Button onClick={() => setShowCreate(true)} className="brand-gradient text-white rounded-full gap-2" size="sm">
          <Plus className="w-4 h-4" />
          Add New
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(cw => {
          const isInDB = !!dbMap[cw.key];
          return (
            <Card key={cw.key} className={`hover:shadow-md transition-all ${cw.status === "archived" ? "opacity-60" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{segmentLabel(cw.segment)}</p>
                    <h3 className="font-bold text-gray-900 text-sm mt-0.5">{cw.grade}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {cw.status === "archived" && <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Archived</Badge>}
                    {!isInDB && <Badge className="bg-blue-50 text-blue-500 border-0 text-xs">Built-in</Badge>}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/CourseBuilder?yearLevel=${cw.key}`} className="flex items-center gap-2 cursor-pointer">
                            <Edit className="w-3.5 h-3.5" />Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setConfirmDuplicate(cw); setDupName(`${cw.grade} (Copy)`); }} className="gap-2 cursor-pointer">
                          <Copy className="w-3.5 h-3.5" />Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => archiveMutation.mutate({ cw, archive: cw.status !== "archived" })}
                          className="gap-2 cursor-pointer"
                        >
                          {cw.status === "archived" ? <><ArchiveRestore className="w-3.5 h-3.5" />Unarchive</> : <><Archive className="w-3.5 h-3.5" />Archive</>}
                        </DropdownMenuItem>
                        {isInDB && (
                          <DropdownMenuItem
                            onClick={() => { if (confirm(`Delete "${cw.grade}"? This cannot be undone.`)) deleteMutation.mutate(dbMap[cw.key].id); }}
                            className="gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {cw.subtitle && <p className="text-xs text-gray-500 italic mb-2">"{cw.subtitle}"</p>}
                <p className="text-xs text-gray-400 mb-3">{(cw.lessons || []).length} lessons</p>
                <Link to={`/CourseBuilder?yearLevel=${cw.key}`}>
                  <Button size="sm" variant="outline" className="w-full text-xs gap-1">
                    <Edit className="w-3 h-3" />Edit Content
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showCreate && <CreateCoursewareModal onClose={() => setShowCreate(false)} />}

      <Dialog open={!!confirmDuplicate} onOpenChange={() => setConfirmDuplicate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Duplicate Courseware</DialogTitle>
            <DialogDescription>Create a copy of "{confirmDuplicate?.grade}"</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-medium text-gray-700 block mb-1.5">New Courseware Name</label>
            <Input value={dupName} onChange={e => setDupName(e.target.value)} placeholder="Enter name for the copy..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDuplicate(null)}>Cancel</Button>
            <Button onClick={() => duplicateMutation.mutate({ cw: confirmDuplicate, newKey: `${confirmDuplicate.key}-copy-${Date.now()}` })} disabled={!dupName || duplicateMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {duplicateMutation.isPending ? "Duplicating..." : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}