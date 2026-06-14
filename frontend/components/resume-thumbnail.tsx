"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { defaultStyle, emptyContent, type ResumeContent } from "@/lib/types";
import { ResumePreview } from "@/components/resume-templates";

// Natural render width of the resume page (A4 @ ~96dpi). We render the real
// ResumePreview at this width, then scale it down to fit the card.
const PAGE_WIDTH = 794;

export function ResumeThumbnail({ id }: { id: string }) {
  const [data, setData] = useState<{
    template: string;
    content: ResumeContent;
  } | null>(null);
  const [failed, setFailed] = useState(false);

  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  // Fetch this resume's content for the preview.
  useEffect(() => {
    let active = true;
    api
      .getResume(id)
      .then((r) => {
        if (!active) return;
        const content: ResumeContent = {
          ...emptyContent(),
          ...r.content,
          style: { ...defaultStyle(), ...r.content?.style },
        };
        content.education = (content.education ?? []).map((e) => ({
          ...e,
          field_of_study: e.field_of_study ?? "",
          gpa: e.gpa ?? "",
        }));
        setData({ template: r.template, content });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Scale the page to the card width. ResizeObserver fires asynchronously, so
  // no synchronous setState in the effect body.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setScale(entries[0].contentRect.width / PAGE_WIDTH);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className="relative h-40 w-full overflow-hidden border-b border-zinc-100 bg-zinc-50"
    >
      {data && scale > 0 && (
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: PAGE_WIDTH, transform: `scale(${scale})` }}
        >
          <ResumePreview template={data.template} content={data.content} />
        </div>
      )}
      {failed && (
        <div className="flex h-full items-center justify-center text-xs text-zinc-400">
          Preview unavailable
        </div>
      )}
    </div>
  );
}
