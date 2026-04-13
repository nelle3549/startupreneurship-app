import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Users, BookOpen, AlertCircle, Plus, Edit, Trash2, ArrowRight, Eye, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useCoursewares } from "@/hooks/useCoursewares";

export default function ClassroomsTab() {
  const queryClient = useQueryClient();
  const { coursewares, getCourseware } = useCoursewares();
  const [search, setSearch] = useState("");
  const [filterYearLevel, setFilterYearLevel] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState(null); // "create", "edit", "transfer"
  const [dialogClassroom, setDialogClassroom] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", year_level_key: "", facilitator_id: "" });
  const [facilitatorSearch, setFacilitatorSearch] = useState("");

  const { data: classrooms = [] } = useQuery({
    queryKey: ["admin-classrooms"],
    queryFn: () => base44.entities.Classroom.list(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users-facilitators"],
    queryFn: () => base44.entities.UserAccount.list(),
  });

  const createClassroomMutation = useMutation({
    mutationFn: (data) => base44.entities.Classroom.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      closeDialog();
    },
  });

  const updateClassroomMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Classroom.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      closeDialog();
    },
  });

  const deleteClassroomMutation = useMutation({
    mutationFn: (id) => base44.entities.Classroom.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const facilitatorMap = {};
  users.forEach(u => {
    facilitatorMap[u.user_id] = u;
  });

  const getCurrentSchoolYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-based
    const startYear = month >= 8 ? year : year - 1;
    return `SY ${startYear}-${startYear + 1}`;
  };

  const getSchoolYearOptions = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const currentStart = month >= 8 ? year : year - 1;
    const options = [];
    for (let i = currentStart - 5; i <= currentStart + 5; i++) {
      options.push(`SY ${i}-${i + 1}`);
    }
    return options;
  };

  const filteredClassrooms = classrooms.filter(c => {
    const facilitator = facilitatorMap[c.facilitator_id];
    const facilitatorName = facilitator ? (facilitator.full_name || facilitator.email) : "Unknown";
    const matchSearch = !search || 
      `${c.name} ${facilitatorName} ${c.enrollment_code}`.toLowerCase().includes(search.toLowerCase());
    const matchYearLevel = filterYearLevel === "all" || c.year_level_key === filterYearLevel;
    return matchSearch && matchYearLevel;
  });

  const totalPages = Math.ceil(filteredClassrooms.length / PAGE_SIZE);
  const paginatedClassrooms = filteredClassrooms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const yearLevelOptions = coursewares.map(yl => ({ key: yl.key, label: yl.grade }));

  const facilitators = users.filter(u => u.role === "facilitator" && u.facilitator_status === "approved");

  const openCreateDialog = () => {
    setDialogMode("create");
    setDialogClassroom(null);
    setFormData({ name: "", description: "", year_level_key: "", school_year: getCurrentSchoolYear(), facilitator_id: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (classroom) => {
    setDialogMode("edit");
    setDialogClassroom(classroom);
    setFormData({
      name: classroom.name,
      description: classroom.description || "",
      year_level_key: classroom.year_level_key,
      school_year: classroom.school_year || getCurrentSchoolYear(),
      facilitator_id: classroom.facilitator_id,
    });
    setDialogOpen(true);
  };

  const openTransferDialog = (classroom) => {
    setDialogMode("transfer");
    setDialogClassroom(classroom);
    setFormData({ facilitator_id: classroom.facilitator_id });
    setFacilitatorSearch("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogMode(null);
    setDialogClassroom(null);
    setFormData({ name: "", description: "", year_level_key: "", facilitator_id: "" });
    setFacilitatorSearch("");
  };

  const handleSave = () => {
    if (dialogMode === "create") {
      if (!formData.name || !formData.year_level_key || !formData.facilitator_id) {
        alert("Please fill in all required fields");
        return;
      }
      createClassroomMutation.mutate({
        name: formData.name,
        description: formData.description,
        year_level_key: formData.year_level_key,
        school_year: formData.school_year,
        facilitator_id: formData.facilitator_id,
        facilitator_email: facilitators.find(f => f.user_id === formData.facilitator_id)?.email || "",
        enrollment_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });
    } else if (dialogMode === "edit") {
      if (!formData.name || !formData.year_level_key) {
        alert("Please fill in all required fields");
        return;
      }
      updateClassroomMutation.mutate({
        id: dialogClassroom.id,
        data: {
          name: formData.name,
          description: formData.description,
          year_level_key: formData.year_level_key,
          school_year: formData.school_year,
          facilitator_id: formData.facilitator_id,
          facilitator_email: facilitators.find(f => f.user_id === formData.facilitator_id)?.email,
        },
      });
    } else if (dialogMode === "transfer") {
      updateClassroomMutation.mutate({
        id: dialogClassroom.id,
        data: {
          facilitator_id: formData.facilitator_id,
          facilitator_email: facilitators.find(f => f.user_id === formData.facilitator_id)?.email,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="text-sm">All Classrooms</CardTitle>
            <Button 
              size="sm" 
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full"
              onClick={openCreateDialog}
            >
              <Plus className="w-4 h-4" />
              Create Classroom
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, facilitator, or code..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 text-sm"
              />
            </div>
            <Select value={filterYearLevel} onValueChange={v => { setFilterYearLevel(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Year Levels</SelectItem>
                {yearLevelOptions.map(yl => (
                  <SelectItem key={yl.key} value={yl.key}>{yl.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Classrooms List */}
      {filteredClassrooms.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No classrooms found.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {paginatedClassrooms.map(c => {
            const facilitator = facilitatorMap[c.facilitator_id];
            const yearLevel = getCourseware(c.year_level_key);
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{c.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {facilitator ? ([facilitator.first_name, facilitator.last_name].filter(Boolean).join(" ") || facilitator.email) : "Unknown Facilitator"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {!c.school_year && (
                        <span title="Missing school year" className="text-amber-500">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                      )}
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                        {yearLevel ? yearLevel.grade : c.year_level_key}
                      </Badge>
                      {c.school_year && (
                        <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                          {c.school_year}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {c.description && <p className="text-xs text-gray-600 mb-2">{c.description}</p>}
                  <div className="flex items-center justify-between gap-2">
                     <div className="flex items-center gap-2">
                       <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                         Code: {c.enrollment_code}
                       </span>
                       <span className="text-xs text-gray-400">
                         Created: {new Date(c.created_date).toLocaleDateString()}
                       </span>
                     </div>
                     <div className="flex items-center gap-1">
                       <Link to={`/ClassroomView?id=${c.id}`}>
                         <Button
                           size="icon"
                           variant="ghost"
                           className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                           title="View Classroom"
                         >
                           <Eye className="w-3.5 h-3.5" />
                         </Button>
                       </Link>
                       <Button
                         size="icon"
                         variant="ghost"
                         className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                         onClick={() => openEditDialog(c)}
                       >
                         <Edit className="w-3.5 h-3.5" />
                       </Button>
                       <Button
                         size="icon"
                         variant="ghost"
                         className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                         onClick={() => openTransferDialog(c)}
                         title="Transfer to another facilitator"
                       >
                         <ArrowRight className="w-3.5 h-3.5" />
                       </Button>
                       <Button
                         size="icon"
                         variant="ghost"
                         className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                         onClick={() => {
                           if (confirm(`Delete classroom "${c.name}"?`)) {
                             deleteClassroomMutation.mutate(c.id);
                           }
                         }}
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </Button>
                     </div>
                   </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-400">{filteredClassrooms.length} total · page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="rounded-full" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Prev</Button>
            <Button size="sm" variant="outline" className="rounded-full" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next ›</Button>
          </div>
        </div>
      )}

      {/* CRUD Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" && "Create New Classroom"}
              {dialogMode === "edit" && "Edit Classroom"}
              {dialogMode === "transfer" && "Transfer Classroom"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create" && "Create a new classroom and assign it to a facilitator"}
              {dialogMode === "edit" && "Update classroom settings"}
              {dialogMode === "transfer" && `Transfer "${dialogClassroom?.name}" to another facilitator`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Create & Edit: Name */}
            {(dialogMode === "create" || dialogMode === "edit") && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Classroom Name *</label>
                <Input
                  placeholder="e.g., Rizal - Grade 7"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            )}

            {/* Create & Edit: Description */}
            {(dialogMode === "create" || dialogMode === "edit") && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
                <Input
                  placeholder="Optional classroom description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            )}

            {/* Create & Edit: Year Level */}
            {(dialogMode === "create" || dialogMode === "edit") && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Year Level *</label>
                <Select value={formData.year_level_key} onValueChange={(val) => setFormData({ ...formData, year_level_key: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year level" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearLevelOptions.map(yl => (
                      <SelectItem key={yl.key} value={yl.key}>{yl.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Create & Edit: School Year */}
            {(dialogMode === "create" || dialogMode === "edit") && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">School Year</label>
                <Select value={formData.school_year} onValueChange={(val) => setFormData({ ...formData, school_year: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school year" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSchoolYearOptions().map(sy => (
                      <SelectItem key={sy} value={sy}>{sy}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* All modes: Facilitator */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                {dialogMode === "transfer" ? "Transfer To *" : "Assign Facilitator *"}
              </label>
              {formData.facilitator_id ? (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                  <div>
                    {(() => {
                      const sel = facilitators.find(f => f.user_id === formData.facilitator_id);
                      return sel ? (
                        <>
                          <p className="text-sm font-medium text-gray-900">{[sel.first_name, sel.last_name].filter(Boolean).join(" ") || "—"}</p>
                          <p className="text-xs text-gray-500">{sel.email}</p>
                        </>
                      ) : <p className="text-sm text-gray-500">Selected</p>;
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFormData({ ...formData, facilitator_id: "" }); setFacilitatorSearch(""); }}
                    className="text-xs text-blue-600 hover:underline ml-2"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Search by name or email..."
                    value={facilitatorSearch}
                    onChange={e => setFacilitatorSearch(e.target.value)}
                    autoComplete="off"
                  />
                  {facilitatorSearch && (
                    <div className="mt-1 border border-gray-200 rounded-md overflow-hidden shadow-sm max-h-48 overflow-y-auto">
                      {facilitators
                        .filter(f => {
                          const fullName = [f.first_name, f.last_name].filter(Boolean).join(" ").toLowerCase();
                          const q = facilitatorSearch.toLowerCase();
                          return fullName.includes(q) || (f.email || "").toLowerCase().includes(q);
                        })
                        .map(f => (
                          <button
                            key={f.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                            onClick={() => {
                              setFormData({ ...formData, facilitator_id: f.user_id });
                              setFacilitatorSearch("");
                            }}
                          >
                            <p className="text-sm font-medium text-gray-900">{[f.first_name, f.last_name].filter(Boolean).join(" ") || "—"}</p>
                            <p className="text-xs text-gray-500">{f.email}</p>
                          </button>
                        ))}
                      {facilitators.filter(f => {
                        const fullName = [f.first_name, f.last_name].filter(Boolean).join(" ").toLowerCase();
                        const q = facilitatorSearch.toLowerCase();
                        return fullName.includes(q) || (f.email || "").toLowerCase().includes(q);
                      }).length === 0 && (
                        <p className="px-3 py-2 text-sm text-gray-400">No facilitators found.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={closeDialog} className="flex-1">Cancel</Button>
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={
                (dialogMode === "create" || dialogMode === "edit") ? 
                  !formData.name || !formData.year_level_key || !formData.facilitator_id :
                  !formData.facilitator_id
              }
            >
              {dialogMode === "transfer" ? "Transfer" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}