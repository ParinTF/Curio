import type {
  EducationInfo,
  FontFamily,
  ProjectInfo,
  ResumeContent,
  SkillInfo,
  WorkInfo,
} from "@/lib/types";
import { DEFAULT_ACCENT, DEFAULT_FONT_COLOR } from "@/lib/types";

const FONT_STACK: Record<FontFamily, string> = {
  sans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "var(--font-geist-mono), ui-monospace, monospace",
};

interface TemplateProps {
  content: ResumeContent;
  accent: string;
}

/**
 * Renders a resume from its content using the chosen template. Used both for
 * the live editor preview and as the print/PDF target — keep it free of any
 * editor-only chrome so the printed output matches the preview exactly.
 */
export function ResumePreview({
  template,
  content,
}: {
  template: string;
  content: ResumeContent;
}) {
  const accent = content.style?.accent_color || DEFAULT_ACCENT;
  const fontColor = content.style?.font_color || DEFAULT_FONT_COLOR;
  const fontFamily = FONT_STACK[content.style?.font_family ?? "sans"];

  return (
    <div
      className="resume-page bg-white"
      style={{ fontFamily, color: fontColor }}
    >
      {template === "classic" ? (
        <Classic content={content} accent={accent} />
      ) : template === "minimal" ? (
        <Minimal content={content} accent={accent} />
      ) : template === "sidebar" ? (
        <Sidebar content={content} accent={accent} />
      ) : (
        <Modern content={content} accent={accent} />
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Shared helpers                                                          */
/* ----------------------------------------------------------------------- */

function hasItems<T>(arr: T[] | undefined): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

function ItemRow({
  heading,
  subheading,
  date,
  detail,
  accent,
}: {
  heading: string;
  subheading?: string;
  date?: string;
  detail?: string;
  accent: string;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-semibold">
          {heading || <span className="opacity-40">Untitled</span>}
          {subheading ? (
            <span className="font-normal opacity-70"> · {subheading}</span>
          ) : null}
        </p>
        {date ? (
          <p className="shrink-0 text-xs" style={{ color: accent }}>
            {date}
          </p>
        ) : null}
      </div>
      {detail ? (
        <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed opacity-75">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function ModernSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <h2
        className="mb-2 border-b pb-1 text-xs font-semibold uppercase tracking-wider"
        style={{ color: accent, borderColor: accent }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ClassicSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-bold uppercase tracking-widest">
          {title}
        </h2>
        <span className="h-px flex-1" style={{ backgroundColor: accent }} />
      </div>
      {children}
    </section>
  );
}

function Skills({ skills }: { skills: SkillInfo[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s, i) => (
        <span
          key={i}
          className="rounded bg-zinc-100 px-2 py-0.5 text-xs"
        >
          {s.skill_name || "—"}
        </span>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Modern — left-aligned, accent section headings                          */
/* ----------------------------------------------------------------------- */

function Modern({ content, accent }: TemplateProps) {
  const { personInfo, experience, education, project, skill } = content;

  return (
    <div className="px-10 py-9">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: accent }}>
          {personInfo.name || <span className="opacity-30">Your Name</span>}
        </h1>
        {personInfo.contact ? (
          <p className="mt-1 text-sm opacity-60">{personInfo.contact}</p>
        ) : null}
      </header>

      {hasItems(experience) && (
        <ModernSection title="Experience" accent={accent}>
          {experience.map((e: WorkInfo, i) => (
            <ItemRow
              key={i}
              heading={e.position}
              subheading={e.company}
              date={e.date}
              detail={e.detail}
              accent={accent}
            />
          ))}
        </ModernSection>
      )}

      {hasItems(project) && (
        <ModernSection title="Projects" accent={accent}>
          {project.map((p: ProjectInfo, i) => (
            <ItemRow
              key={i}
              heading={p.project_name}
              date={p.date}
              detail={p.detail}
              accent={accent}
            />
          ))}
        </ModernSection>
      )}

      {hasItems(education) && (
        <ModernSection title="Education" accent={accent}>
          {education.map((ed: EducationInfo, i) => (
            <ItemRow
              key={i}
              heading={ed.school_name}
              subheading={ed.gpa ? `GPA ${ed.gpa}` : undefined}
              date={ed.date}
              accent={accent}
            />
          ))}
        </ModernSection>
      )}

      {hasItems(skill) && (
        <ModernSection title="Skills" accent={accent}>
          <Skills skills={skill} />
        </ModernSection>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Classic — centered header, ruled section titles                         */
/* ----------------------------------------------------------------------- */

function Classic({ content, accent }: TemplateProps) {
  const { personInfo, experience, education, project, skill } = content;

  return (
    <div className="px-12 py-10">
      <header className="mb-7 text-center">
        <h1 className="text-3xl font-bold tracking-wide">
          {personInfo.name || <span className="opacity-30">Your Name</span>}
        </h1>
        {personInfo.contact ? (
          <p className="mt-1.5 text-sm opacity-60">{personInfo.contact}</p>
        ) : null}
        <div
          className="mx-auto mt-4 h-0.5 w-16"
          style={{ backgroundColor: accent }}
        />
      </header>

      {hasItems(experience) && (
        <ClassicSection title="Experience" accent={accent}>
          {experience.map((e: WorkInfo, i) => (
            <ItemRow
              key={i}
              heading={e.position}
              subheading={e.company}
              date={e.date}
              detail={e.detail}
              accent={accent}
            />
          ))}
        </ClassicSection>
      )}

      {hasItems(project) && (
        <ClassicSection title="Projects" accent={accent}>
          {project.map((p: ProjectInfo, i) => (
            <ItemRow
              key={i}
              heading={p.project_name}
              date={p.date}
              detail={p.detail}
              accent={accent}
            />
          ))}
        </ClassicSection>
      )}

      {hasItems(education) && (
        <ClassicSection title="Education" accent={accent}>
          {education.map((ed: EducationInfo, i) => (
            <ItemRow
              key={i}
              heading={ed.school_name}
              subheading={ed.gpa ? `GPA ${ed.gpa}` : undefined}
              date={ed.date}
              accent={accent}
            />
          ))}
        </ClassicSection>
      )}

      {hasItems(skill) && (
        <ClassicSection title="Skills" accent={accent}>
          <Skills skills={skill} />
        </ClassicSection>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Minimal — whitespace-heavy, hairline rules, accent only on the name      */
/* ----------------------------------------------------------------------- */

function MinimalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 last:mb-0">
      <h2 className="mb-3 border-b border-zinc-200 pb-1 text-[11px] font-medium uppercase tracking-[0.2em] opacity-50">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Minimal({ content, accent }: TemplateProps) {
  const { personInfo, experience, education, project, skill } = content;

  return (
    <div className="px-12 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: accent }}>
          {personInfo.name || <span className="opacity-30">Your Name</span>}
        </h1>
        {personInfo.contact ? (
          <p className="mt-1 text-sm opacity-60">{personInfo.contact}</p>
        ) : null}
      </header>

      {hasItems(experience) && (
        <MinimalSection title="Experience">
          {experience.map((e: WorkInfo, i) => (
            <ItemRow
              key={i}
              heading={e.position}
              subheading={e.company}
              date={e.date}
              detail={e.detail}
              accent={accent}
            />
          ))}
        </MinimalSection>
      )}

      {hasItems(project) && (
        <MinimalSection title="Projects">
          {project.map((p: ProjectInfo, i) => (
            <ItemRow
              key={i}
              heading={p.project_name}
              date={p.date}
              detail={p.detail}
              accent={accent}
            />
          ))}
        </MinimalSection>
      )}

      {hasItems(education) && (
        <MinimalSection title="Education">
          {education.map((ed: EducationInfo, i) => (
            <ItemRow
              key={i}
              heading={ed.school_name}
              subheading={ed.gpa ? `GPA ${ed.gpa}` : undefined}
              date={ed.date}
              accent={accent}
            />
          ))}
        </MinimalSection>
      )}

      {hasItems(skill) && (
        <MinimalSection title="Skills">
          <Skills skills={skill} />
        </MinimalSection>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Sidebar — colored left column with photo + skills; content on the right  */
/* ----------------------------------------------------------------------- */

function Sidebar({ content, accent }: TemplateProps) {
  const { personInfo, experience, education, project, skill } = content;

  return (
    <div className="flex min-h-[1000px] items-stretch">
      {/* Left sidebar */}
      <aside
        className="w-[34%] px-6 py-8 text-white"
        style={{ backgroundColor: accent }}
      >
        {personInfo.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={personInfo.photo}
            alt={personInfo.name || "Profile photo"}
            className="mx-auto mb-5 h-28 w-28 rounded-full object-cover ring-2 ring-white/40"
          />
        ) : null}

        <h1 className="text-2xl font-bold leading-tight">
          {personInfo.name || <span className="text-white/50">Your Name</span>}
        </h1>
        {personInfo.contact ? (
          <p className="mt-2 text-sm leading-relaxed text-white/80">
            {personInfo.contact}
          </p>
        ) : null}

        {hasItems(skill) && (
          <div className="mt-7">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/70">
              Skills
            </h2>
            <ul className="flex flex-col gap-1 text-sm text-white/90">
              {skill.map((s, i) => (
                <li key={i}>{s.skill_name || "—"}</li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* Right content */}
      <div className="flex-1 px-8 py-8">
        {hasItems(experience) && (
          <ModernSection title="Experience" accent={accent}>
            {experience.map((e: WorkInfo, i) => (
              <ItemRow
                key={i}
                heading={e.position}
                subheading={e.company}
                date={e.date}
                detail={e.detail}
                accent={accent}
              />
            ))}
          </ModernSection>
        )}

        {hasItems(project) && (
          <ModernSection title="Projects" accent={accent}>
            {project.map((p: ProjectInfo, i) => (
              <ItemRow
                key={i}
                heading={p.project_name}
                date={p.date}
                detail={p.detail}
                accent={accent}
              />
            ))}
          </ModernSection>
        )}

        {hasItems(education) && (
          <ModernSection title="Education" accent={accent}>
            {education.map((ed: EducationInfo, i) => (
              <ItemRow
                key={i}
                heading={ed.school_name}
                subheading={ed.gpa ? `GPA ${ed.gpa}` : undefined}
                date={ed.date}
                accent={accent}
              />
            ))}
          </ModernSection>
        )}
      </div>
    </div>
  );
}
