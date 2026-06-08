"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { emptyContent, type ResumeSummary } from "@/lib/types";
import { DEFAULT_TEMPLATE, templateName } from "@/lib/templates";
import { ResumeThumbnail } from "@/components/resume-thumbnail";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export function DashboardClient() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.listResumes();
        if (active) setResumes(data);
      } catch (err) {
        if (!active) return;
        setResumes([]);
        setError(
          err instanceof ApiError
            ? `Couldn't load resumes (${err.status}).`
            : "Couldn't load resumes. Is the backend running?",
        );
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const { id } = await api.createResume({
        title: "Untitled resume",
        template: DEFAULT_TEMPLATE,
        content: emptyContent(),
      });
      router.push(`/editor/${id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `Couldn't create resume (${err.status}).`
          : "Couldn't create resume.",
      );
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setDeletingId(id);
    setError(null);
    try {
      await api.deleteResume(id);
      setResumes((prev) => prev?.filter((r) => r.id !== id) ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? `Couldn't delete resume (${err.status}).`
          : "Couldn't delete resume.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your resumes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create, edit, and manage your resumes.
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
        >
          {creating ? "Creating…" : "New resume"}
        </button>
      </div>

      {error && (
        <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {resumes === null ? (
        <ListSkeleton />
      ) : resumes.length === 0 ? (
        <EmptyState onCreate={handleCreate} creating={creating} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((r) => (
            <li
              key={r.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white transition-shadow hover:shadow-sm"
            >
              <button
                onClick={() => router.push(`/editor/${r.id}`)}
                className="block w-full text-left"
                aria-label={`Open ${r.title}`}
              >
                <ResumeThumbnail id={r.id} />
              </button>
              <div className="flex flex-1 flex-col p-4">
                <button
                  onClick={() => router.push(`/editor/${r.id}`)}
                  className="flex-1 text-left"
                >
                  <h2 className="font-medium text-zinc-900">{r.title}</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    {templateName(r.template)} · Updated {formatDate(r.updated_at)}
                    {r.is_public ? " · Public" : ""}
                  </p>
                </button>
                <div className="mt-3 flex items-center gap-3 border-t border-zinc-100 pt-3 text-sm">
                  <button
                    onClick={() => router.push(`/editor/${r.id}`)}
                    className="font-medium text-zinc-700 hover:text-zinc-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r.id, r.title)}
                    disabled={deletingId === r.id}
                    className="font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                  >
                    {deletingId === r.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function ListSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <li
          key={i}
          className="h-64 animate-pulse rounded-lg border border-zinc-200 bg-white"
        />
      ))}
    </ul>
  );
}

function EmptyState({
  onCreate,
  creating,
}: {
  onCreate: () => void;
  creating: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white py-20 text-center">
      <h2 className="text-lg font-medium text-zinc-900">No resumes yet</h2>
      <p className="mt-1 max-w-xs text-sm text-zinc-500">
        Create your first resume to get started.
      </p>
      <button
        onClick={onCreate}
        disabled={creating}
        className="mt-6 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
      >
        {creating ? "Creating…" : "New resume"}
      </button>
    </div>
  );
}
