import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicResume } from "@/lib/public-api";
import { ResumePaper } from "@/components/resume-paper";

// Next.js 16: params is a Promise.
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resume = await getPublicResume(slug);
  if (!resume) return { title: "Resume not found — Curio" };
  const name = resume.content?.personInfo?.name;
  return {
    title: name ? `${name} — Resume` : resume.title,
    description: `${name ?? "Resume"} · built with Curio`,
  };
}

export default async function PublicResumePage({ params }: Props) {
  const { slug } = await params;
  const resume = await getPublicResume(slug);

  if (!resume) {
    notFound();
  }

  return (
    <main className="flex flex-1 justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-[800px]">
        <ResumePaper template={resume.template} content={resume.content} />
      </div>
    </main>
  );
}
