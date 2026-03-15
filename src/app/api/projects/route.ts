import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
  try {
    const projects = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, createdAt: true },
    });
    return NextResponse.json(projects);
  } catch (err) {
    console.error("Projects list error:", err);
    return NextResponse.json(
      { error: "Failed to load projects" },
      { status: 500 }
    );
  }
}
