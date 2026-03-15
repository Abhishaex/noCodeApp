import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }
    const body = await req.json();
    const { email, password, name } = body as {
      email?: string;
      password?: string;
      name?: string;
    };
    const emailTrim = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!emailTrim || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Email and password (min 6 characters) are required" },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({
      where: { email: emailTrim },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: emailTrim,
        passwordHash,
        name: typeof name === "string" ? name.trim() || null : null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
