// TypeScript mirror of the Go backend structs (backend/main.go).
// Keep these in sync manually — see CLAUDE.md "Frontend ↔ Backend contract".
// API responses use snake_case keys; the content envelope mixes camelCase
// (`personInfo`) with the rest, so match the Go json tags exactly.

export interface PersonInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  /** Data URL or image URL. Rendered by photo-supporting templates. */
  photo: string;
}

/**
 * Build a display string from the non-empty contact fields, separated by " · ".
 * Used by resume templates to render a compact one-line contact row.
 */
export function formatContact(p: PersonInfo): string {
  return [p.email, p.phone, p.location, p.github]
    .filter(Boolean)
    .join(" · ");
}

export interface EducationInfo {
  school_name: string;
  field_of_study: string;
  date: string;
  gpa: string;
}

export interface WorkInfo {
  position: string;
  company: string;
  date: string;
  detail: string;
}

export interface ProjectInfo {
  project_name: string;
  date: string;
  detail: string;
}

export interface SkillInfo {
  category?: string;
  skill_name: string;
}

export type FontFamily = "sans" | "serif" | "mono";

export interface StyleInfo {
  accent_color: string;
  font_color: string;
  font_family: FontFamily;
}

/** The JSONB blob stored in the `resumes.content` column. */
export interface ResumeContent {
  personInfo: PersonInfo;
  profile: string;
  education: EducationInfo[];
  experience: WorkInfo[];
  project: ProjectInfo[];
  skill: SkillInfo[];
  style: StyleInfo;
}

/** Row returned by GET /resumes (list view — no content). */
export interface ResumeSummary {
  id: string;
  title: string;
  template: string;
  is_public: boolean;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

/** Full resume returned by GET /resume/{id}. */
export interface Resume {
  id: string;
  title: string;
  template: string;
  content: ResumeContent;
  is_public: boolean;
  slug: string | null;
}

/** Body for POST /resume and PUT /resume/{id}. */
export interface CreateResumeRequest {
  title: string;
  template: string;
  content: ResumeContent;
}

export const DEFAULT_ACCENT = "#2563eb";
export const DEFAULT_FONT_COLOR = "#18181b";
export const DEFAULT_FONT: FontFamily = "sans";

export function defaultStyle(): StyleInfo {
  return { accent_color: DEFAULT_ACCENT, font_color: DEFAULT_FONT_COLOR, font_family: DEFAULT_FONT };
}

/** A blank content envelope, useful when creating a new resume. */
export function emptyContent(): ResumeContent {
  return {
    personInfo: { name: "", email: "", phone: "", location: "", github: "", photo: "" },
    profile: "",
    education: [],
    experience: [],
    project: [],
    skill: [],
    style: defaultStyle(),
  };
}
