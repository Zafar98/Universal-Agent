// API route for transcribing user audio to text
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");

    if (!contentType?.includes("audio/")) {
      return NextResponse.json({ error: "Invalid audio format" }, { status: 400 });
    }

    const audioBuffer = await request.arrayBuffer();

    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: contentType }), "audio.mp3");
    formData.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error("OpenAI Whisper error:", response.status, await response.text());
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      text: data.text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Transcription API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
