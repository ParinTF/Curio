"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import {
  defaultStyle,
  emptyContent,
  type FontFamily,
  type ResumeContent,
} from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";
import { ResumePaper } from "@/components/resume-paper";
import {
  EducationEditor,
  ExperienceEditor,
  ProjectEditor,
  SkillsEditor,
  TextInput,
} from "@/components/editor-sections";

const ACCENT_PRESETS = [
  "#2563eb", // blue
  "#0d9488", // teal
  "#dc2626", // red
  "#7c3aed", // violet
  "#ea580c", // orange
  "#18181b", // near-black
];

const FONTS: { id: FontFamily; label: string }[] = [
  { id: "sans", label: "Sans" },
  { id: "serif", label: "Serif" },
  { id: "mono", label: "Mono" },
];

export function EditorClient({ id }: { id: string }) {
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [content, setContent] = useState<ResumeContent>(emptyContent());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  // Sharing state — persisted via dedicated endpoints, separate from Save.
  const [isPublic, setIsPublic] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  // Load the resume, merging over a blank envelope so older resumes that
  // predate the `style` field (or any section) never crash the editor.
  useEffect(() => {
    let active = true;
    api
      .getResume(id)
      .then((resume) => {
        if (!active) return;
        const merged: ResumeContent = {
          ...emptyContent(),
          ...resume.content,
          style: { ...defaultStyle(), ...resume.content?.style },
        };
        // Older education items predate the `gpa` field — default it so the
        // controlled inputs don't flip between controlled/uncontrolled.
        merged.education = (merged.education ?? []).map((e) => ({
          ...e,
          gpa: e.gpa ?? "",
        }));
        setTitle(resume.title);
        setTemplate(resume.template);
        setContent(merged);
        setIsPublic(resume.is_public);
        setSlug(resume.slug);
        setSavedSnapshot(snapshot(resume.title, resume.template, merged));
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "Resume not found."
            : "Couldn't load this resume.",
        );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const current = snapshot(title, template, content);
  const dirty = savedSnapshot !== null && current !== savedSnapshot;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.updateResume(id, { title, template, content });
      setSavedSnapshot(current);
    } catch (err) {
      setError(
        err instanceof ApiError ? `Couldn't save (${err.status}).` : "Couldn't save.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    setError(null);
    try {
      const res = await api.shareResume(id);
      setSlug(res.slug);
      setIsPublic(res.is_public);
    } catch (err) {
      setError(
        err instanceof ApiError ? `Couldn't share (${err.status}).` : "Couldn't share.",
      );
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async () => {
    setSharing(true);
    setError(null);
    try {
      await api.unshareResume(id);
      setIsPublic(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? `Couldn't unshare (${err.status}).` : "Couldn't unshare.",
      );
    } finally {
      setSharing(false);
    }
  };

  // Helpers to patch nested state immutably.
  const patchContent = (patch: Partial<ResumeContent>) =>
    setContent((c) => ({ ...c, ...patch }));
  const setPerson = (field: "name" | "contact" | "photo", v: string) =>
    setContent((c) => ({ ...c, personInfo: { ...c.personInfo, [field]: v } }));
  const setStyle = (patch: Partial<ResumeContent["style"]>) =>
    setContent((c) => ({ ...c, style: { ...c.style, ...patch } }));

  const handlePhotoUpload = async (file: File) => {
    setError(null);
    try {
      setPerson("photo", await downscaleImage(file));
    } catch {
      setError("Couldn't load that image.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (error && savedSnapshot === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-700">{error}</p>
        <Link href="/dashboard" className="text-sm font-medium text-zinc-900 underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900">
            ←
          </Link>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled resume"
            className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-sm font-medium outline-none hover:border-zinc-200 focus:border-zinc-900"
          />
          <span className="hidden text-xs text-zinc-400 sm:inline">
            {dirty ? "Unsaved changes" : savedSnapshot ? "All changes saved" : ""}
          </span>
          <button
            onClick={() => window.print()}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Download PDF
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <p className="no-print mx-auto mt-4 w-full max-w-6xl px-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Two-pane layout */}
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Left: form */}
        <div className="no-print flex flex-col gap-5">
          {/* Personal info */}
          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">Personal info</h2>
            <div className="flex flex-col gap-3">
              <TextInput
                label="Full name"
                value={content.personInfo.name}
                onChange={(v) => setPerson("name", v)}
                placeholder="Jane Doe"
              />
              <TextInput
                label="Contact"
                value={content.personInfo.contact}
                onChange={(v) => setPerson("contact", v)}
                placeholder="jane@email.com · +66 · Bangkok"
              />

              <div>
                <p className="mb-1.5 text-xs font-medium text-zinc-600">
                  Photo{" "}
                  <span className="text-zinc-400">
                    (used by the Sidebar template)
                  </span>
                </p>
                <div className="flex items-center gap-3">
                  {content.personInfo.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={content.personInfo.photo}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-zinc-100" />
                  )}
                  <label className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                    {content.personInfo.photo ? "Replace" : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handlePhotoUpload(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {content.personInfo.photo && (
                    <button
                      onClick={() => setPerson("photo", "")}
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Design */}
          <section className="rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">Design</h2>
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-1.5 text-xs font-medium text-zinc-600">Template</p>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={`flex-1 rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                        template === t.id
                          ? "border-zinc-900 bg-zinc-50"
                          : "border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      <span className="block font-medium text-zinc-900">{t.name}</span>
                      <span className="block text-zinc-500">{t.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-zinc-600">Accent color</p>
                <div className="flex items-center gap-2">
                  {ACCENT_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setStyle({ accent_color: c })}
                      aria-label={`Accent ${c}`}
                      className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        content.style.accent_color === c
                          ? "border-zinc-900"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={content.style.accent_color}
                    onChange={(e) => setStyle({ accent_color: e.target.value })}
                    className="h-7 w-9 cursor-pointer rounded border border-zinc-300 bg-white"
                    aria-label="Custom accent color"
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-zinc-600">Font</p>
                <div className="flex gap-2">
                  {FONTS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setStyle({ font_family: f.id })}
                      className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                        content.style.font_family === f.id
                          ? "border-zinc-900 bg-zinc-50 font-medium"
                          : "border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <ExperienceEditor
            value={content.experience}
            onChange={(v) => patchContent({ experience: v })}
          />
          <ProjectEditor
            value={content.project}
            onChange={(v) => patchContent({ project: v })}
          />
          <EducationEditor
            value={content.education}
            onChange={(v) => patchContent({ education: v })}
          />
          <SkillsEditor
            value={content.skill}
            onChange={(v) => patchContent({ skill: v })}
          />

          <SharePanel
            isPublic={isPublic}
            slug={slug}
            sharing={sharing}
            onShare={handleShare}
            onUnshare={handleUnshare}
          />
        </div>

        {/* Right: live preview (also the print target) */}
        <div className="resume-scroll lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-auto">
          <ResumePaper template={template} content={content} />
        </div>
      </div>
    </div>
  );
}

function snapshot(title: string, template: string, content: ResumeContent): string {
  return JSON.stringify({ title, template, content });
}

/**
 * Read an image file, downscale it to <= `max`px on the long edge, and return a
 * JPEG data URL. Keeps the photo small enough to live inside the resume JSON.
 */
function downscaleImage(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas context"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function SharePanel({
  isPublic,
  slug,
  sharing,
  onShare,
  onUnshare,
}: {
  isPublic: boolean;
  slug: string | null;
  sharing: boolean;
  onShare: () => void;
  onUnshare: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const url =
    slug && typeof window !== "undefined"
      ? `${window.location.origin}/r/${slug}`
      : null;

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="mb-1 text-sm font-semibold text-zinc-900">Share</h2>
      <p className="mb-4 text-xs text-zinc-500">
        {isPublic
          ? "Anyone with the link can view this resume."
          : "Publish to get a public, shareable link."}
      </p>

      {isPublic && url ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-700"
            />
            <button
              onClick={copy}
              className="shrink-0 rounded-md border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            onClick={onUnshare}
            disabled={sharing}
            className="self-start text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
          >
            {sharing ? "Working…" : "Make private"}
          </button>
        </div>
      ) : (
        <button
          onClick={onShare}
          disabled={sharing}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
        >
          {sharing ? "Publishing…" : "Create public link"}
        </button>
      )}
    </section>
  );
}
