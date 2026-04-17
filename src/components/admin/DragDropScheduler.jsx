import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Calendar } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

function SortableItem({ id, item, renderContent }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`border ${isDragging ? "border-blue-400 shadow-md" : "border-gray-200"}`}>
        <CardContent className="p-4 flex items-start gap-3">
          <button {...attributes} {...listeners} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1">
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="flex-1">{renderContent(item)}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DragDropScheduler({ entity, items, renderContent, onScheduleApplied }) {
  const qc = useQueryClient();
  const [local, setLocal] = useState(items);
  const [isApplying, setIsApplying] = useState(false);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => entities[entity].update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [`content-${entity}`] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { distance: 8 }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = local.findIndex(x => x.id === active.id);
    const newIdx = local.findIndex(x => x.id === over.id);
    setLocal(prev => arrayMove(prev, oldIdx, newIdx));
  };

  const applySchedule = async () => {
    setIsApplying(true);
    const today = new Date();
    try {
      for (let i = 0; i < local.length; i++) {
        const item = local[i];
        const schedDate = new Date(today);
        schedDate.setDate(schedDate.getDate() + i);
        const dateStr = schedDate.toISOString().split("T")[0];
        await updateMutation.mutateAsync({
          id: item.id,
          data: { scheduled_date: dateStr, order: i }
        });
      }
      onScheduleApplied?.();
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
        <strong>Drag to reorder</strong> — then click "Apply Schedule" to automatically assign dates starting today.
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={local.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {local.map(item => (
              <SortableItem key={item.id} id={item.id} item={item} renderContent={renderContent} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={applySchedule}
          disabled={updateMutation.isPending || isApplying}
          className="brand-gradient text-white rounded-full gap-2"
        >
          <Calendar className="w-3.5 h-3.5" />
          Apply Schedule (Starting Today)
        </Button>
      </div>
    </div>
  );
}