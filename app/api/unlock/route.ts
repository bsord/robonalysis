import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const passcode = (body?.passcode ?? "").toString();
    const expected = (process.env.APP_PASSCODE ?? "").toString();

    if (!expected) {
      return NextResponse.json({ error: "Server passcode not configured" }, { status: 500 });
    }

    if (passcode !== expected) {
      return NextResponse.json({ ok: false, error: "Invalid passcode" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("vv_auth", "1", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
