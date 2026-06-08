import type { ResumeContent } from "./types";

// Standalone fetch for the public resume endpoint. Kept separate from api.ts
// so it doesn't pull in the Supabase client — this runs unauthenticated and is
// used by the SSR public page (app/r/[slug]).

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface PublicResume {
  title: string;
  template: string;
  content: ResumeContent;
}

export async function getPublicResume(
  slug: string,
): Promise<PublicResume | null> {
  const res = await fetch(`${API_URL}/public/resume/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load resume (${res.status})`);
  return (await res.json()) as PublicResume;
}
