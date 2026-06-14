"use client";

import { useRef, useState } from "react";
import type {
  EducationInfo,
  ProjectInfo,
  SkillInfo,
  WorkInfo,
} from "@/lib/types";

/* ----------------------------------------------------------------------- */
/* Form primitives                                                         */
/* ----------------------------------------------------------------------- */

const inputCls =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-zinc-600">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
      {label}
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={`${inputCls} resize-y font-normal text-zinc-900`}
      />
    </label>
  );
}

/**
 * GPA input — allows only numbers with up to 2 decimal places, capped at 4.00.
 * Invalid characters are silently rejected; an error hint appears if the value
 * exceeds 4.00.
 */
function GpaInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const handleChange = (raw: string) => {
    // Allow empty (clearing the field)
    if (raw === "") {
      onChange("");
      return;
    }

    // Only allow digits and a single decimal point, up to 2 decimal places
    // Valid patterns: "4", "3.", "3.8", "3.80"
    if (!/^\d{0,2}\.?\d{0,2}$/.test(raw)) return;

    // Block values above 4.00
    const num = parseFloat(raw);
    if (!isNaN(num) && num > 4) return;

    onChange(raw);
  };

  const num = parseFloat(value);
  const isOver = !isNaN(num) && num > 4;

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
      GPA <span className="font-normal text-zinc-400">(max 4.00)</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder="3.80"
        onChange={(e) => handleChange(e.target.value)}
        className={`${inputCls} ${isOver ? "border-red-400 focus:border-red-500 focus:ring-red-500" : ""}`}
      />
      {isOver && (
        <span className="text-[11px] text-red-500">GPA ต้องไม่เกิน 4.00</span>
      )}
    </label>
  );
}

/* ----------------------------------------------------------------------- */
/* Month/year range picker                                                 */
/* ----------------------------------------------------------------------- */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "2022-03" -> "Mar 2022"
function ymToLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const idx = Number(m) - 1;
  return MONTHS[idx] ? `${MONTHS[idx]} ${y}` : "";
}

// "Mar 2022" -> "2022-03" (returns "" if it isn't our canonical format)
function labelToYm(label: string): string {
  const m = label.trim().match(/^([A-Za-z]{3})\s+(\d{4})$/);
  if (!m) return "";
  const idx = MONTHS.indexOf(m[1]);
  if (idx < 0) return "";
  return `${m[2]}-${String(idx + 1).padStart(2, "0")}`;
}

function parseRange(value: string): {
  start: string;
  end: string;
  present: boolean;
} {
  const parts = value.split("–").map((s) => s.trim());
  if (parts.length >= 2) {
    if (parts[1].toLowerCase() === "present") {
      return { start: labelToYm(parts[0]), end: "", present: true };
    }
    return { start: labelToYm(parts[0]), end: labelToYm(parts[1]), present: false };
  }
  return { start: labelToYm(parts[0] ?? ""), end: "", present: false };
}

function formatRange(start: string, end: string, present: boolean): string {
  if (!start) return "";
  const s = ymToLabel(start);
  if (present) return `${s} – Present`;
  if (end) return `${s} – ${ymToLabel(end)}`;
  return s;
}

export function MonthRange({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { start, end, present } = parseRange(value);
  const monthCls =
    "rounded-md border border-zinc-300 px-2 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 disabled:bg-zinc-100 disabled:text-zinc-400";

  return (
    <div className="flex flex-col gap-1 text-xs font-medium text-zinc-600">
      {label}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="month"
          value={start}
          onChange={(e) =>
            onChange(formatRange(e.target.value, present ? "" : end, present))
          }
          className={monthCls}
        />
        <span className="text-zinc-400">–</span>
        <input
          type="month"
          value={present ? "" : end}
          disabled={present}
          onChange={(e) => onChange(formatRange(start, e.target.value, false))}
          className={monthCls}
        />
        <label className="flex items-center gap-1.5 whitespace-nowrap font-normal text-zinc-600">
          <input
            type="checkbox"
            checked={present}
            onChange={(e) => onChange(formatRange(start, "", e.target.checked))}
          />
          Present
        </label>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        <button
          onClick={onAdd}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          + {addLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

function ItemCard({
  index,
  onRemove,
  children,
}: {
  index: number;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 rounded-md border border-zinc-200 bg-zinc-50/50 p-3 last:mb-0">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">#{index + 1}</span>
        <button
          onClick={onRemove}
          className="text-xs font-medium text-red-600 hover:text-red-700"
        >
          Remove
        </button>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-xs text-zinc-400">{text}</p>;
}

/* ----------------------------------------------------------------------- */
/* Generic list helpers                                                    */
/* ----------------------------------------------------------------------- */

function updateAt<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

function removeAt<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

/* ----------------------------------------------------------------------- */
/* Section editors                                                         */
/* ----------------------------------------------------------------------- */

export function ProfileEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900">Profile</h2>
      <TextArea
        label="About you"
        value={value}
        onChange={onChange}
        placeholder="A short intro about yourself, your background, and what you're looking for…"
      />
    </section>
  );
}

export function ExperienceEditor({
  value,
  onChange,
}: {
  value: WorkInfo[];
  onChange: (next: WorkInfo[]) => void;
}) {
  return (
    <SectionCard
      title="Experience"
      addLabel="Add role"
      onAdd={() =>
        onChange([
          ...value,
          { position: "", company: "", date: "", detail: "" },
        ])
      }
    >
      {value.length === 0 && <EmptyHint text="No experience added yet." />}
      {value.map((item, i) => (
        <ItemCard key={i} index={i} onRemove={() => onChange(removeAt(value, i))}>
          <div className="flex gap-3">
            <TextInput
              label="Position"
              value={item.position}
              onChange={(v) => onChange(updateAt(value, i, { position: v }))}
              placeholder="Software Engineer"
            />
            <TextInput
              label="Company"
              value={item.company}
              onChange={(v) => onChange(updateAt(value, i, { company: v }))}
              placeholder="Acme Inc."
            />
          </div>
          <MonthRange
            label="Date"
            value={item.date}
            onChange={(v) => onChange(updateAt(value, i, { date: v }))}
          />
          <TextArea
            label="Details"
            value={item.detail}
            onChange={(v) => onChange(updateAt(value, i, { detail: v }))}
            placeholder="What you did and what you achieved…"
          />
        </ItemCard>
      ))}
    </SectionCard>
  );
}

export function ProjectEditor({
  value,
  onChange,
}: {
  value: ProjectInfo[];
  onChange: (next: ProjectInfo[]) => void;
}) {
  return (
    <SectionCard
      title="Projects"
      addLabel="Add project"
      onAdd={() =>
        onChange([...value, { project_name: "", date: "", detail: "" }])
      }
    >
      {value.length === 0 && <EmptyHint text="No projects added yet." />}
      {value.map((item, i) => (
        <ItemCard key={i} index={i} onRemove={() => onChange(removeAt(value, i))}>
          <TextInput
            label="Project name"
            value={item.project_name}
            onChange={(v) => onChange(updateAt(value, i, { project_name: v }))}
            placeholder="Curio"
          />
          <MonthRange
            label="Date"
            value={item.date}
            onChange={(v) => onChange(updateAt(value, i, { date: v }))}
          />
          <TextArea
            label="Details"
            value={item.detail}
            onChange={(v) => onChange(updateAt(value, i, { detail: v }))}
            placeholder="What it is and the tech you used…"
          />
        </ItemCard>
      ))}
    </SectionCard>
  );
}

interface UniversityResult {
  name: string;
  country: string;
}

function SchoolAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [results, setResults] = useState<UniversityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/universities?name=${encodeURIComponent(q)}`
        );
        const data: UniversityResult[] = await res.json();
        const top = data.slice(0, 8);
        setResults(top);
        setOpen(top.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleChange = (v: string) => { onChange(v); search(v); };

  const handleSelect = (name: string) => {
    onChange(name);
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative flex flex-col gap-1 text-xs font-medium text-zinc-600">
      School
      <div className="relative">
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="University of …"
          className={inputCls}
        />
        {loading && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
          </span>
        )}
      </div>
      {open && (
        <ul className="absolute top-full z-20 mt-1 max-h-52 w-full overflow-auto rounded-md border border-zinc-200 bg-white shadow-lg">
          {results.map((u, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(u.name)}
              className="flex cursor-pointer flex-col px-3 py-2 hover:bg-zinc-50"
            >
              <span className="text-sm text-zinc-900">{u.name}</span>
              <span className="text-[11px] text-zinc-400">{u.country}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EducationEditor({
  value,
  onChange,
}: {
  value: EducationInfo[];
  onChange: (next: EducationInfo[]) => void;
}) {
  return (
    <SectionCard
      title="Education"
      addLabel="Add school"
      onAdd={() => onChange([...value, { school_name: "", field_of_study: "", date: "", gpa: "" }])}
    >
      {value.length === 0 && <EmptyHint text="No education added yet." />}
      {value.map((item, i) => (
        <ItemCard key={i} index={i} onRemove={() => onChange(removeAt(value, i))}>
          <SchoolAutocomplete
            value={item.school_name}
            onChange={(v) => onChange(updateAt(value, i, { school_name: v }))}
          />
          <TextInput
            label="Field of Study"
            value={item.field_of_study}
            onChange={(v) => onChange(updateAt(value, i, { field_of_study: v }))}
            placeholder="Computer Science"
          />
          <MonthRange
            label="Date"
            value={item.date}
            onChange={(v) => onChange(updateAt(value, i, { date: v }))}
          />
          <GpaInput
            value={item.gpa}
            onChange={(v) => onChange(updateAt(value, i, { gpa: v }))}
          />
        </ItemCard>
      ))}
    </SectionCard>
  );
}

export function SkillsEditor({
  value,
  onChange,
}: {
  value: SkillInfo[];
  onChange: (next: SkillInfo[]) => void;
}) {
  return (
    <SectionCard
      title="Skills"
      addLabel="Add skill group"
      onAdd={() => onChange([...value, { category: "", skill_name: "" }])}
    >
      {value.length === 0 && <EmptyHint text="No skills added yet." />}
      {value.map((item, i) => (
        <ItemCard key={i} index={i} onRemove={() => onChange(removeAt(value, i))}>
          <TextInput
            label="Category (optional)"
            placeholder="e.g. Languages, Frameworks, Tools"
            value={item.category ?? ""}
            onChange={(v) => onChange(updateAt(value, i, { category: v }))}
          />
          <TextInput
            label="Skills"
            placeholder="e.g. JavaScript, Go, Python"
            value={item.skill_name}
            onChange={(v) => onChange(updateAt(value, i, { skill_name: v }))}
          />
        </ItemCard>
      ))}
    </SectionCard>
  );
}
