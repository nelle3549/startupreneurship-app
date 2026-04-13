import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, X, Check, Eye, EyeOff, Banknote, Trophy, Newspaper, Gamepad2, MessageSquare, Archive, GripVertical } from "lucide-react";
import HistoryArchiveTab from "./HistoryArchiveTab";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const ACTIVITY_TYPES = [
  { value: "wordle", label: "🟩 Wordle" },
  { value: "mcq", label: "📝 Multiple Choice Quiz" },
  { value: "jigsaw", label: "🧩 Jigsaw Puzzle" },
  { value: "match", label: "🔗 Match Objects" },
  { value: "odd_one_out", label: "🔍 Odd One Out" },
];

function Field({ label, value, onChange, placeholder, required, type = "text", options }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1">{label}{required && " *"}</label>
      {type === "select" ? (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
          <SelectContent>
            {(options || []).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <Input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function SortableItem({ item, editId, renderItemExtra, onEdit, onDelete, onToggleHidden, onArchive, showArchive, hideVisibility }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-all ${editId === item.id ? "opacity-40 pointer-events-none" : ""} ${item.hidden ? "bg-gray-50 border-dashed" : ""}`}
    >
      <CardContent className="p-4 flex items-start gap-3">
        {/* Drag handle */}
        <button {...attributes} {...listeners} className="mt-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className={`font-semibold text-sm truncate ${item.hidden ? "text-gray-400 line-through" : "text-gray-900"}`}>
              {item.emoji ? `${item.emoji} ` : ""}{item.title || item.text || item.word}
            </p>
            {item.hidden && (
              <Badge variant="outline" className="text-xs text-gray-400 border-gray-300 py-0">Hidden</Badge>
            )}
            {renderItemExtra && renderItemExtra(item)}
          </div>
          {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>}
          {item.hint && <p className="text-xs text-gray-500 mt-0.5 italic">Hint: {item.hint}</p>}
          {item.text && !item.title && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 italic">"{item.text}"</p>}
          {item.org && <p className="text-xs text-gray-400 mt-0.5">{item.org}</p>}
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block">{item.url}</a>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {showArchive && (
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-amber-400 hover:text-amber-600"
              onClick={() => onArchive(item)}
              title="Archive this item"
            >
              <Archive className="w-3.5 h-3.5" />
            </Button>
          )}
          {!hideVisibility && (
            <Button
              variant="ghost" size="icon"
              className={`h-7 w-7 ${item.hidden ? "text-gray-300 hover:text-emerald-500" : "text-emerald-400 hover:text-gray-400"}`}
              onClick={() => onToggleHidden(item)}
              title={item.hidden ? "Show on dashboard" : "Hide from dashboard"}
            >
              {item.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-700" onClick={() => onEdit(item)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => { if (confirm("Delete this item?")) onDelete(item.id); }}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentTable({ entity, fields, emptyMsg, renderItemExtra, enableArchive = false, archiveContentType, hideVisibility = false, autoArchivePast = false }) {
  const qc = useQueryClient();
  const qKey = [`content-${entity}`];

  const { data: items = [], isLoading } = useQuery({
    queryKey: qKey,
    queryFn: () => base44.entities[entity].list("order"),
  });

  const createMutation = useMutation({
    mutationFn: d => base44.entities[entity].create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); setAdding(false); setForm({}); },
  });
  const saveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities[entity].update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qKey }); setEditId(null); setForm({}); },
  });
  const patchMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities[entity].update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qKey }),
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities[entity].delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qKey }),
  });
  const archiveMutation = useMutation({
    mutationFn: async (item) => {
      await base44.entities.HistoryArchive.create({
        content_type: archiveContentType,
        content_id: item.id,
        title: item.title || item.word || item.text?.slice(0, 60) || "Untitled",
        featured_date: item.scheduled_date || new Date().toISOString().split("T")[0],
        meta: { ...item },
      });
      await base44.entities[entity].update(item.id, { hidden: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qKey });
      qc.invalidateQueries({ queryKey: ["history-archive"] });
    },
  });

  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({});
  const [page, setPage] = useState(1);
  const [localItems, setLocalItems] = useState(null);
  const PAGE_SIZE = 20;

  const displayItems = localItems || items;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = displayItems.findIndex(i => i.id === active.id);
    const newIndex = displayItems.findIndex(i => i.id === over.id);
    const reordered = arrayMove(displayItems, oldIndex, newIndex);
    setLocalItems(reordered);
    // Persist new order
    reordered.forEach((item, idx) => {
      patchMutation.mutate({ id: item.id, data: { order: idx } });
    });
  };

  const startEdit = (item) => { setEditId(item.id); setForm({ ...item }); setAdding(false); };
  const startAdd = () => { setAdding(true); setEditId(null); setForm({}); };
  const cancel = () => { setAdding(false); setEditId(null); setForm({}); };
  const save = () => {
    if (editId) saveMutation.mutate({ id: editId, data: form });
    else createMutation.mutate(form);
  };
  const toggleHidden = (item) => patchMutation.mutate({ id: item.id, data: { hidden: !item.hidden } });

  // Auto-archive past scheduled items
  useEffect(() => {
    if (!autoArchivePast || items.length === 0) return;
    const today = new Date().toISOString().split("T")[0];
    const pastItems = items.filter(i => i.scheduled_date && i.scheduled_date < today);
    pastItems.forEach(async (item) => {
      await base44.entities.HistoryArchive.create({
        content_type: archiveContentType,
        content_id: item.id,
        title: item.title || item.word || item.text?.slice(0, 60) || "Untitled",
        featured_date: item.scheduled_date,
        meta: { ...item },
      });
      await base44.entities[entity].delete(item.id);
    });
    if (pastItems.length > 0) {
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: qKey });
        qc.invalidateQueries({ queryKey: ["history-archive"] });
      }, 1000);
    }
  }, [items]);

  // Sync localItems when server data changes
  useEffect(() => { setLocalItems(null); }, [items]);

  const totalPages = Math.ceil(displayItems.length / PAGE_SIZE);
  const paginatedItems = displayItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (isLoading) return (
    <div className="flex justify-center py-10">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-400">
          {displayItems.filter(i => !i.hidden).length} visible · {displayItems.filter(i => i.hidden).length} hidden
          {enableArchive && <span className="ml-1">· drag to reorder</span>}
        </p>
        <Button size="sm" onClick={startAdd} className="brand-gradient text-white rounded-full gap-2">
          <Plus className="w-3.5 h-3.5" /> Add New
        </Button>
      </div>

      {(adding || editId) && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map(f => (
              <Field
                key={f.key}
                label={f.label}
                value={form[f.key]}
                onChange={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                placeholder={f.placeholder}
                required={f.required}
                type={f.type}
                options={f.options}
              />
            ))}
            <div className="sm:col-span-2 flex gap-2 justify-end pt-1">
              <Button size="sm" variant="outline" onClick={cancel} className="rounded-full gap-1.5">
                <X className="w-3 h-3" /> Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={createMutation.isPending || saveMutation.isPending} className="brand-gradient text-white rounded-full gap-1.5">
                <Check className="w-3 h-3" /> {editId ? "Save" : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {displayItems.length === 0 && !adding ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">{emptyMsg}</div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={paginatedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {paginatedItems.map(item => (
                <SortableItem
                  key={item.id}
                  item={item}
                  editId={editId}
                  renderItemExtra={renderItemExtra}
                  onEdit={startEdit}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onToggleHidden={toggleHidden}
                  onArchive={(item) => { if (confirm("Archive this item? It will be hidden and moved to the archive.")) archiveMutation.mutate(item); }}
                  showArchive={enableArchive}
                  hideVisibility={hideVisibility}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-400">{displayItems.length} total · page {page} of {totalPages}</p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="rounded-full" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Prev</Button>
            <Button size="sm" variant="outline" className="rounded-full" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next ›</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Field definitions ────────────────────────────────────────────────────────

const FUNDING_FIELDS = [
  { key: "title", label: "Title", required: true, placeholder: "e.g. DOST-SETUP Program" },
  { key: "org", label: "Organization", required: true, placeholder: "e.g. Dept. of Science & Technology" },
  { key: "amount", label: "Amount", placeholder: "e.g. Up to ₱500,000" },
  { key: "deadline", label: "Deadline", placeholder: "e.g. Rolling basis" },
  { key: "type", label: "Type", placeholder: "e.g. Government Grant" },
  { key: "description", label: "Description", placeholder: "Short description..." },
  { key: "url", label: "URL", required: true, placeholder: "https://..." },
  { key: "order", label: "Order (number)", placeholder: "0" },
];

const COMPETITION_FIELDS = [
  { key: "title", label: "Title", required: true, placeholder: "e.g. IdeaSpace Challenge" },
  { key: "organizer", label: "Organizer", required: true, placeholder: "e.g. IdeaSpace Foundation" },
  { key: "type", label: "Type", placeholder: "e.g. Pitch Competition" },
  { key: "emoji", label: "Emoji", placeholder: "🎤" },
  { key: "date", label: "Date", placeholder: "e.g. April 2026" },
  { key: "location", label: "Location", placeholder: "e.g. Manila, Philippines" },
  { key: "prize", label: "Prize", placeholder: "e.g. Up to ₱1,000,000" },
  { key: "description", label: "Description", placeholder: "Short description..." },
  { key: "url", label: "URL", required: true, placeholder: "https://..." },
  { key: "order", label: "Order (number)", placeholder: "0" },
];

const ARTICLE_FIELDS = [
  { key: "title", label: "Title", required: true, placeholder: "e.g. The Lean Startup" },
  { key: "tag", label: "Tag", placeholder: "e.g. Book, Course, Articles" },
  { key: "emoji", label: "Emoji", placeholder: "📗" },
  { key: "description", label: "Description", placeholder: "Short description..." },
  { key: "url", label: "URL", required: true, placeholder: "https://..." },
  { key: "order", label: "Order (number)", placeholder: "0" },
];

const GAME_FIELDS = [
  { key: "activity_type", label: "Activity Type", type: "select", options: ACTIVITY_TYPES, placeholder: "Select activity type..." },
  { key: "word", label: "Word (5 letters, uppercase)", required: true, placeholder: "PITCH" },
  { key: "hint", label: "Hint / Clue", required: true, placeholder: "What entrepreneurs do to investors" },
  { key: "scheduled_date", label: "Scheduled Date", type: "date", placeholder: "" },
  { key: "order", label: "Order (fallback rotation)", placeholder: "0" },
];

const QUOTE_FIELDS = [
  { key: "text", label: "Quote Text", required: true, placeholder: "An entrepreneur is someone who takes an idea and..." },
  { key: "author", label: "Author", placeholder: "e.g. Steve Jobs" },
  { key: "emoji", label: "Emoji", placeholder: "💡" },
  { key: "scheduled_date", label: "Scheduled Date", type: "date", placeholder: "" },
  { key: "order", label: "Order (fallback rotation)", placeholder: "0" },
];

// ── Game of the Day extra badges ─────────────────────────────────────────────
function GameItemExtra({ item }) {
  const today = new Date().toISOString().split("T")[0];
  const actType = ACTIVITY_TYPES.find(a => a.value === (item.activity_type || "wordle"));
  const { scheduled_date: sd } = item;
  return (
    <>
      {actType && (
        <Badge className="text-xs bg-indigo-100 text-indigo-700 border-0 py-0">{actType.label}</Badge>
      )}
      {sd && (
        sd === today
          ? <Badge className="text-xs bg-green-100 text-green-700 border-0 py-0">📅 Today</Badge>
          : sd < today
            ? <Badge className="text-xs bg-gray-200 text-gray-500 border-0 py-0">✓ Played {sd}</Badge>
            : <Badge className="text-xs bg-blue-100 text-blue-700 border-0 py-0">🗓 {sd}</Badge>
      )}
    </>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function AdminContentTab() {
  const [sub, setSub] = useState("funding");

  const SUB_TABS = [
    { value: "funding", label: "Funding", icon: <Banknote className="w-3.5 h-3.5" /> },
    { value: "competitions", label: "Competitions", icon: <Trophy className="w-3.5 h-3.5" /> },
    { value: "articles", label: "Articles", icon: <Newspaper className="w-3.5 h-3.5" /> },
    { value: "gameofday", label: "Games", icon: <Gamepad2 className="w-3.5 h-3.5" /> },
    { value: "quoteofday", label: "Quotes", icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { value: "history", label: "Archived", icon: <Archive className="w-3.5 h-3.5" /> },
  ];

  return (
    <div>
      <Tabs value={sub} onValueChange={setSub}>
        <div className="flex gap-2 flex-wrap mb-5">
          {SUB_TABS.map(t => (
            <Button key={t.value} size="sm" variant={sub === t.value ? "default" : "outline"} onClick={() => setSub(t.value)} className="rounded-full text-xs gap-1.5">
              {t.icon}
              <span className={sub === t.value ? "inline" : "hidden sm:inline"}>{t.label}</span>
            </Button>
          ))}
        </div>
        <TabsContent value="funding">
          <ContentTable entity="FundingOpportunity" fields={FUNDING_FIELDS} emptyMsg="No funding opportunities yet." />
        </TabsContent>
        <TabsContent value="competitions">
          <ContentTable entity="Competition" fields={COMPETITION_FIELDS} emptyMsg="No competitions yet." />
        </TabsContent>
        <TabsContent value="articles">
          <ContentTable entity="Article" fields={ARTICLE_FIELDS} emptyMsg="No articles yet." />
        </TabsContent>
        <TabsContent value="gameofday">
          <ContentTable
            entity="WordleWord"
            fields={GAME_FIELDS}
            emptyMsg="No game entries yet."
            renderItemExtra={(item) => <GameItemExtra item={item} />}
            enableArchive
            archiveContentType="game"
            hideVisibility
            autoArchivePast
          />
        </TabsContent>
        <TabsContent value="quoteofday">
          <ContentTable
            entity="Quote"
            fields={QUOTE_FIELDS}
            emptyMsg="No quotes yet."
            renderItemExtra={(item) => <QuoteItemExtra item={item} />}
            enableArchive
            archiveContentType="quote"
            hideVisibility
            autoArchivePast
          />
        </TabsContent>
        <TabsContent value="history">
          <HistoryArchiveTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuoteItemExtra({ item }) {
  const today = new Date().toISOString().split("T")[0];
  const { scheduled_date: sd } = item;
  return (
    <>
      {sd && (
        sd === today
          ? <Badge className="text-xs bg-green-100 text-green-700 border-0 py-0">📅 Today</Badge>
          : sd < today
            ? <Badge className="text-xs bg-gray-200 text-gray-500 border-0 py-0">✓ Shown {sd}</Badge>
            : <Badge className="text-xs bg-blue-100 text-blue-700 border-0 py-0">🗓 {sd}</Badge>
      )}
    </>
  );
}