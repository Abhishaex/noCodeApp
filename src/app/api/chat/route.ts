import { NextRequest, NextResponse } from "next/server";
import { generateFrontend } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

const hasDb = () => Boolean(process.env.DATABASE_URL && prisma);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, sessionId, previousHtml } = body as {
      message: string;
      sessionId?: string;
      previousHtml?: string | null;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    let sessionIdToUse: string | null = null;

    const db = prisma;
    if (hasDb() && db) {
      try {
        let chatSession = sessionId
          ? await db.chatSession.findFirst({
              where: { id: sessionId },
            })
          : null;

        if (!chatSession) {
          chatSession = await db.chatSession.create({
            data: {
              title: message.slice(0, 50) || "New chat",
            },
          });
        }
        sessionIdToUse = chatSession.id;

        await db.message.create({
          data: {
            sessionId: chatSession.id,
            role: "user",
            content: message,
          },
        });
      } catch (dbErr) {
        console.warn("DB save skipped:", dbErr);
      }
    }

    const { reply, html } = await generateFrontend(message, previousHtml);

    if (hasDb() && db && sessionIdToUse) {
      try {
        await db.message.create({
          data: {
            sessionId: sessionIdToUse!,
            role: "assistant",
            content: reply,
            generatedCode: html || undefined,
          },
        });
      } catch (dbErr) {
        console.warn("DB save skipped:", dbErr);
      }
    }

    return NextResponse.json({
      sessionId: sessionIdToUse,
      reply,
      html: html || null,
    });
  } catch (err) {
    console.error("Chat API error:", err);
    const message = err instanceof Error ? err.message : "Failed to generate";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
