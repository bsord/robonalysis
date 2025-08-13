import { NextResponse } from "next/server";

// This route is referenced during build; provide a minimal handler to satisfy Next.
export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}));
		return NextResponse.json({ ok: true, received: body });
	} catch (e) {
		return NextResponse.json({ ok: false, error: (e as Error)?.message ?? "unknown" }, { status: 500 });
	}
}

export const dynamic = "force-dynamic";
