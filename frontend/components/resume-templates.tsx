import type {
  EducationInfo,
  FontFamily,
  ProjectInfo,
  ResumeContent,
  SkillInfo,
  WorkInfo,
} from "@/lib/types";
import { DEFAULT_ACCENT, DEFAULT_FONT_COLOR, formatContact } from "@/lib/types";

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
  const { personInfo, profile, experience, education, project, skill } = content;

  return (
    <div className="px-10 py-9">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: accent }}>
          {personInfo.name || <span className="opacity-30">Your Name</span>}
        </h1>
        {formatContact(personInfo) ? (
          <p className="mt-1 text-sm opacity-60">{formatContact(personInfo)}</p>
        ) : null}
      </header>

      {profile && (
        <ModernSection title="Profile" accent={accent}>
          <p className="text-sm leading-relaxed opacity-75 whitespace-pre-line">{profile}</p>
        </ModernSection>
      )}

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
  const { personInfo, profile, experience, education, project, skill } = content;

  return (
    <div className="px-12 py-10">
      <header className="mb-7 text-center">
        <h1 className="text-3xl font-bold tracking-wide">
          {personInfo.name || <span className="opacity-30">Your Name</span>}
        </h1>
        {formatContact(personInfo) ? (
          <p className="mt-1.5 text-sm opacity-60">{formatContact(personInfo)}</p>
        ) : null}
        <div
          className="mx-auto mt-4 h-0.5 w-16"
          style={{ backgroundColor: accent }}
        />
      </header>

      {profile && (
        <ClassicSection title="Profile" accent={accent}>
          <p className="text-sm leading-relaxed opacity-75 whitespace-pre-line">{profile}</p>
        </ClassicSection>
      )}

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
  const { personInfo, profile, experience, education, project, skill } = content;

  return (
    <div className="px-12 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: accent }}>
          {personInfo.name || <span className="opacity-30">Your Name</span>}
        </h1>
        {formatContact(personInfo) ? (
          <p className="mt-1 text-sm opacity-60">{formatContact(personInfo)}</p>
        ) : null}
      </header>

      {profile && (
        <MinimalSection title="Profile">
          <p className="text-sm leading-relaxed opacity-75 whitespace-pre-line">{profile}</p>
        </MinimalSection>
      )}

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

function IconEmail() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-3.5 w-3.5 shrink-0">
      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-3.5 w-3.5 shrink-0">
      <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
    </svg>
  );
}

function IconLocation() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-3.5 w-3.5 shrink-0">
      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.452-.23.772-.414.64-.365 1.522-.93 2.406-1.703C15.386 15.477 17 13.514 17 11a7 7 0 10-14 0c0 2.514 1.614 4.477 3.207 5.666.884.773 1.766 1.338 2.406 1.703.32.184.586.318.772.414a5.741 5.741 0 00.281.14l.018.008.006.003zM10 13a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  );
}

function IconGitHub() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 h-3.5 w-3.5 shrink-0">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function SidebarContactRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-2 text-sm text-white/80">
      {icon}
      <span className="break-all leading-tight">{text}</span>
    </div>
  );
}

function Sidebar({ content, accent }: TemplateProps) {
  const { personInfo, profile, experience, education, project, skill } = content;

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
        <div className="mt-3 flex flex-col gap-1.5">
          <SidebarContactRow icon={<IconEmail />} text={personInfo.email} />
          <SidebarContactRow icon={<IconPhone />} text={personInfo.phone} />
          <SidebarContactRow icon={<IconLocation />} text={personInfo.location} />
          <SidebarContactRow icon={<IconGitHub />} text={personInfo.github} />
        </div>

        {profile && (
          <div className="mt-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/70">
              Profile
            </h2>
            <p className="text-sm leading-relaxed text-white/90 whitespace-pre-line">{profile}</p>
          </div>
        )}

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
