import { RequireAuth } from "@/components/require-auth";
import { EditorClient } from "@/components/editor-client";

// Next.js 16: `params` is a Promise and must be awaited.
export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <RequireAuth>
      <EditorClient id={id} />
    </RequireAuth>
  );
}
