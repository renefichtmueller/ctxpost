/**
 * Serve generated AI images.
 * Images are stored in <cwd>/public/generated-images/ (legacy)
 * or <cwd>/uploads/ (new). This route handles the legacy path.
 */
import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Prevent directory traversal
  const sanitized = path.basename(filename);
  if (sanitized !== filename || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const candidates = [
    path.join(process.cwd(), "public", "generated-images", sanitized),
    path.join(process.cwd(), "uploads", sanitized),
  ];

  let filepath: string | null = null;
  for (const candidate of candidates) {
    try {
      await stat(candidate);
      filepath = candidate;
      break;
    } catch {
      // try next
    }
  }

  if (!filepath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(filepath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
