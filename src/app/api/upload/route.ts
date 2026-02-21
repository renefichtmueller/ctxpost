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

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: t("uploadError") },
      { status: 500 }
    );
  }
}
