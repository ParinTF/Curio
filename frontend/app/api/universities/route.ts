import { type NextRequest, NextResponse } from "next/server";

interface HipolabsUniversity {
  name: string;
  country: string;
  alpha_two_code: string;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") ?? "";
  if (name.length < 2) return NextResponse.json([]);

  try {
    const res = await fetch(
      `http://universities.hipolabs.com/search?name=${encodeURIComponent(name)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return NextResponse.json([]);
    const data: HipolabsUniversity[] = await res.json();
    return NextResponse.json(
      data.slice(0, 8).map((u) => ({ name: u.name, country: u.country })),
    );
  } catch {
    return NextResponse.json([]);
  }
}
