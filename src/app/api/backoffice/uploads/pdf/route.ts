import { NextResponse } from "next/server";

import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

function isInstructorOrAdmin(role: string | undefined) {
  return role === "instructor" || role === "admin";
}

function isProbablyPdf(bytes: Buffer): boolean {
  if (bytes.length < 4) return false;
  // PDF files start with: %PDF
  return bytes.toString("utf8", 0, 4) === "%PDF";
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !isInstructorOrAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
  }

  const originalName = typeof file.name === "string" ? file.name : "upload.pdf";
  const ext = path.extname(originalName).toLowerCase();

  if (file.type !== "application/pdf" && ext !== ".pdf") {
    return NextResponse.json({ ok: false, error: "Only PDF files are allowed" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = Buffer.from(arrayBuffer);

  if (!isProbablyPdf(bytes)) {
    return NextResponse.json({ ok: false, error: "Invalid PDF file" }, { status: 400 });
  }

  const safeBase = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 60);

  const id = crypto.randomBytes(12).toString("hex");
  const filename = `${Date.now()}-${id}-${safeBase || "file"}.pdf`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), bytes);

  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}
