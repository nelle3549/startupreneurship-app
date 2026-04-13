import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/**
 * BrandTabsList — shared tab style across Admin, Portal, ClassroomView
 * - Full-width, left-aligned
 * - Active tab: brand orange-red → yellow gradient with white text
 * - Mobile: inactive tabs show icon only; active tab shows icon + label
 */
export function BrandTabsList({ tabs, className }) {
  return (
    <TabsList className={cn("bg-white border mb-6 w-full justify-start flex-wrap h-auto gap-1", className)}>
      {tabs.map(({ value, icon, label, badge }) => (
        <TabsTrigger
          key={value}
          value={value}
          className="group gap-1.5 transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#E53935] data-[state=active]:to-[#F9A825] data-[state=active]:text-white data-[state=active]:shadow-none"
        >
          <span className="flex-shrink-0">{icon}</span>
          {/* Desktop: always show label. Mobile: show label only when active */}
          <span className="hidden sm:inline group-data-[state=active]:inline">{label}</span>
          {badge != null && badge > 0 && (
            <span className="ml-0.5 bg-white/30 text-white text-xs rounded-full px-1.5 py-0.5 leading-none group-data-[state=inactive]:bg-amber-500 group-data-[state=inactive]:text-white">
              {badge}
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}