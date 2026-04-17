import { useQuery } from "@tanstack/react-query";
import { entities } from "@/api/entities";
import { YEAR_LEVELS } from "@/components/data/courseData";

/**
 * Returns a merged list of coursewares.
 * YEAR_LEVELS (static) provides the base data including lessons.
 * DB Courseware records override static data (metadata + lessons when saved).
 */
export function useCoursewares({ includeArchived = false } = {}) {
  const { data: dbCoursewares = [], isLoading } = useQuery({
    queryKey: ["coursewares"],
    queryFn: () => entities.Courseware.list(),
    staleTime: 1000 * 60 * 5,
  });

  const dbMap = Object.fromEntries(dbCoursewares.map(c => [c.key, c]));

  // Build merged map: static YEAR_LEVELS is the base, DB record overrides
  const merged = {};
  Object.values(YEAR_LEVELS).forEach(yl => {
    merged[yl.key] = { ...yl };
  });

  dbCoursewares.forEach(c => {
    const dbOverride = { ...c };
    // If DB hasn't saved lessons yet (null/undefined), keep static fallback
    if (dbOverride.lessons == null) delete dbOverride.lessons;
    if (merged[c.key]) {
      merged[c.key] = { ...merged[c.key], ...dbOverride };
    } else {
      merged[c.key] = { ...c };
    }
  });

  const segmentOrder = ["grade-school", "junior-senior-hs", "college"];

  const coursewares = Object.values(merged)
    .filter(c => includeArchived || c.status !== "archived")
    .sort((a, b) => {
      const ai = segmentOrder.indexOf(a.segment);
      const bi = segmentOrder.indexOf(b.segment);
      const aIdx = ai === -1 ? 99 : ai;
      const bIdx = bi === -1 ? 99 : bi;
      if (aIdx !== bIdx) return aIdx - bIdx;
      return (a.order ?? 0) - (b.order ?? 0);
    });

  const getCourseware = (key) => {
    if (!key) return null;
    return merged[key] || null;
  };

  return { coursewares, dbCoursewares, dbMap, isLoading, getCourseware };
}