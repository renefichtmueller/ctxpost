import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "video/quicktime",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
];

// Magic bytes for file type validation (prevents MIME spoofing)
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "video/mp4": [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]], // ftyp at offset 4
  "video/quicktime": [[0x00, 0x00, 0x00]],
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return true; // No signature check for docx/pptx (ZIP-based)
  for (const sig of signatures) {
    let match = true;
    for (let i = 0; i < sig.length; i++) {
      if (buffer[i] !== sig[i]) { match = false; break; }
    }
    if (match) return true;
  }
  // Special check for MP4: ftyp at offset 4
  if (mimeType === "video/mp4" && buffer.length >= 8) {
    const ftyp = [0x66, 0x74, 0x79, 0x70];
    if (ftyp.every((b, i) => buffer[4 + i] === b)) return true;
  }
  return false;
}

// Videos and documents up to 100MB, images up to 10MB
const MAX_FILE_SIZE_IMAGE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_LARGE = 100 * 1024 * 1024; // 100MB

function getMaxFileSize(type: string): number {
  if (type.startsWith("video/") || type.startsWith("application/vnd.")) {
    return MAX_FILE_SIZE_LARGE;
  }
  return MAX_FILE_SIZE_IMAGE;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const t = await getTranslations("media");

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: t("noFileUploaded") },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: t("fileTypeNotAllowed", { type: file.type }),
        },
        { status: 400 }
      );
    }

    if (file.size > getMaxFileSize(file.type)) {
      return NextResponse.json(
        { error: t("fileTooLarge") },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate file content matches claimed MIME type (prevents MIME spoofing)
    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: t("fileTypeNotAllowed", { type: file.type }) },
        { status: 400 }
      );
    }

    await writeFile(filepath, buffer);

    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: t("uploadError") },
      { status: 500 }
    );
  }
}
