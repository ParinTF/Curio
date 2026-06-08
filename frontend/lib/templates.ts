// Templates the backend knows how to render (see backend/main.go).
// The editor and dashboard reference this list so adding a template is a
// one-line change here once the backend supports it.

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
  /** Whether this template renders the personInfo.photo. */
  supportsPhoto?: boolean;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean single-line header, accent headings.",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Centered header, ruled sections.",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Lots of whitespace, hairline rules.",
  },
  {
    id: "sidebar",
    name: "Sidebar",
    description: "Colored sidebar with photo + skills.",
    supportsPhoto: true,
  },
];

export const PHOTO_TEMPLATES = TEMPLATES.filter((t) => t.supportsPhoto).map(
  (t) => t.name,
);

export const DEFAULT_TEMPLATE = TEMPLATES[0].id;

export function templateName(id: string): string {
  return TEMPLATES.find((t) => t.id === id)?.name ?? id;
}
