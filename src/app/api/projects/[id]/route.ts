import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const { id } = await params;
  try {
    const chatSession = await prisma.chatSession.findFirst({
      where: { id, userId: session.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            generatedCode: true,
          },
        },
      },
    });
    if (!chatSession) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const messages = chatSession.messages.map((m) => ({
      role: m.role,
      content: m.content,
      html: m.generatedCode ?? undefined,
    }));
    const lastWithCode = [...chatSession.messages].reverse().find((m) => m.generatedCode);
    return NextResponse.json({
      id: chatSession.id,
      title: chatSession.title,
      createdAt: chatSession.createdAt,
      messages,
      previewHtml: lastWithCode?.generatedCode ?? null,
    });
  } catch (err) {
    console.error("Project load error:", err);
    return NextResponse.json(
      { error: "Failed to load project" },
      { status: 500 }
    );
  }
}
