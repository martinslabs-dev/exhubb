import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { randomBytes } from "crypto";

const MAX_IMAGE_BYTES = 5  * 1024 * 1024; //  5 MB for images
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB for videos

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const ALLOWED_TYPES = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]);

const VIDEO_EXTS: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);
  const isImage = ALLOWED_IMAGE_TYPES.has(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "File type not allowed. Use JPEG, PNG, WebP, GIF, AVIF, MP4, WebM or MOV." },
      { status: 415 },
    );
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large (max ${maxBytes / 1024 / 1024} MB)` },
      { status: 413 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Magic-byte validation to prevent content-type spoofing
  const magic = buffer.slice(0, 4).toString("hex");
  const isFtyp = buffer.slice(4, 8).toString("hex") === "66747970"; // MP4 / MOV / AVIF
  const isWebM = magic === "1a45dfa3";                               // WebM EBML header
  const isJpeg = magic.startsWith("ffd8ff");
  const isPng  = magic === "89504e47";
  const isGif  = magic.startsWith("47494638");
  const isWebp = buffer.slice(0, 12).toString("hex").includes("57454250");

  const validImage = isJpeg || isPng || isGif || isWebp || (isFtyp && isImage); // AVIF uses ftyp too
  const validVideo = (isFtyp || isWebM) && isVideo;

  if (!validImage && !validVideo) {
    return NextResponse.json(
      { error: "File content does not match a supported format" },
      { status: 415 },
    );
  }

  // Build a safe filename
  const rawExt = extname(file.name).toLowerCase().replace(/[^a-z0-9.]/g, "");
  let safeExt: string;
  if (isVideo) {
    safeExt = VIDEO_EXTS[file.type] ?? ".mp4";
  } else {
    safeExt = ALLOWED_IMAGE_TYPES.has(`image/${rawExt.replace(".", "")}`) ? rawExt : ".jpg";
  }
  const filename = `${randomBytes(16).toString("hex")}${safeExt}`;

  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
