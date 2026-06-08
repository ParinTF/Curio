import { supabase } from "./supabase";
import type {
  CreateResumeRequest,
  Resume,
  ResumeSummary,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Wrapper around fetch that attaches the current Supabase JWT as a Bearer
 * token. The Go backend verifies this token and derives user_id from it, so
 * every protected request must carry it.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new ApiError(401, "Not authenticated");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || res.statusText);
  }

  // 204 / empty bodies
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  listResumes: () => request<ResumeSummary[]>("/resumes"),

  getResume: (id: string) => request<Resume>(`/resume/${id}`),

  createResume: (body: CreateResumeRequest) =>
    request<{ id: string }>("/resume", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateResume: (id: string, body: CreateResumeRequest) =>
    request<{ message: string }>(`/resume/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteResume: (id: string) =>
    request<{ message: string }>(`/resume/${id}`, {
      method: "DELETE",
    }),

  shareResume: (id: string) =>
    request<{ slug: string; is_public: boolean }>(`/resume/${id}/share`, {
      method: "POST",
    }),

  unshareResume: (id: string) =>
    request<{ is_public: boolean }>(`/resume/${id}/share`, {
      method: "DELETE",
    }),
};
