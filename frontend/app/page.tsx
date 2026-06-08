import Link from "next/link";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-5">
        <Logo markClassName="h-10 w-10" className="mb-1 [&_span]:text-2xl" />
        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500">
          Resume builder
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
          Build a resume worth sharing.
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600">
          Fill in your experience, pick a template, tweak the styling, and
          share it with a public link — all in one place.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 font-medium text-white transition-colors hover:bg-zinc-700"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 font-medium text-zinc-700 transition-colors hover:bg-white"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
