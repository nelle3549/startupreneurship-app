const STORAGE_KEY = "startupreneur_progress";

export function getProgress(yearLevelKey) {
  const data = localStorage.getItem(STORAGE_KEY);
  const allProgress = data ? JSON.parse(data) : {};
  return allProgress[yearLevelKey] || null;
}

export function getAllProgress() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
}

export function saveProgress(yearLevelKey, progressData) {
  const allProgress = getAllProgress();
  allProgress[yearLevelKey] = {
    ...allProgress[yearLevelKey],
    ...progressData,
    year_level_key: yearLevelKey,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
}

export function deleteAllProgress() {
  localStorage.removeItem(STORAGE_KEY);
}