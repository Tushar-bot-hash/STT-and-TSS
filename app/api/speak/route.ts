import { NextRequest, NextResponse } from "next/server";

/**
 * Text-to-Speech API Route
 * 
 * This route handles text-to-speech conversion using Web Speech API or your chosen TTS service.
 */

export const revalidate = 0;

/**
 * POST /api/speak
 * 
 * Request body: { text: string }
 * Query params: voice (optional) - Voice name to use
 * Response: JSON response since we can't stream audio without a TTS service
 */
export async function POST(request: NextRequest) {
  try {
    // Get the voice from query params
    const voice = request.nextUrl.searchParams.get("voice") ?? "default";

    // Get the text from request body
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    console.log("TTS Request:", { voice, text: text.substring(0, 50) + "..." });

    // Since we removed Deepgram, we can't generate server-side audio
    // The TTS will need to be handled client-side using Web Speech API
    // or you can implement a new TTS service here
    
    return NextResponse.json({
      success: true,
      message: "TTS request received. Use client-side Web Speech API for audio generation.",
      text: text,
      voice: voice
    });

  } catch (error) {
    console.error("TTS Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}