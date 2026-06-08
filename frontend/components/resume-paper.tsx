"use client";

import { useEffect, useRef, useState } from "react";
import { ResumePreview } from "@/components/resume-templates";
import type { ResumeContent } from "@/lib/types";

const PAGE_WIDTH = 794; // A4 width @ 96dpi (210mm)

/**
 * Renders the resume at a fixed A4 width and scales it to fit the available
 * column on screen. Because the layout is computed at the real print width,
 * the preview matches the exported PDF exactly. In print, CSS removes the
 * scaling (see globals.css) so the page maps 1:1 onto A4.
 */
export function ResumePaper({
  template,
  content,
}: {
  template: string;
  content: ResumeContent;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pageHeight, setPageHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const page = pageRef.current;
    if (!container || !page) return;

    // ResizeObserver fires asynchronously, so no synchronous setState here.
    const ro = new ResizeObserver(() => {
      setScale(Math.min(1, container.clientWidth / PAGE_WIDTH));
      setPageHeight(page.offsetHeight);
    });
    ro.observe(container); // column width
    ro.observe(page); // page height as content changes
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="resume-frame mx-auto"
        style={
          {
            "--preview-scale": scale,
            "--page-height": `${pageHeight}px`,
          } as React.CSSProperties
        }
      >
        <div className="resume-scaler">
          <div
            ref={pageRef}
            className="resume-print-area overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
          >
            <ResumePreview template={template} content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}
