import { supabase } from "./supabaseClient";

const BUCKET = "lesson-images";

function sanitizeFileName(name) {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "image";
  return `${base}${ext}`;
}

export async function uploadLessonImage(file, { folder = "sections" } = {}) {
  if (!file) throw new Error("No file provided");
  if (!file.type?.startsWith("image/")) throw new Error("File must be an image");

  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_BYTES) throw new Error("Image must be 10 MB or smaller");

  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}
