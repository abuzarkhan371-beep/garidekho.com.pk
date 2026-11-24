import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const SAFE_FILENAME = /^[a-zA-Z0-9-]+\.webp$/;
const SAFE_USER = /^[a-zA-Z0-9-]+$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string; filename: string }> },
) {
  const { userId, filename } = await params;
  if (!SAFE_USER.test(userId) || !SAFE_FILENAME.test(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await readFile(path.join(process.cwd(), ".uploads", userId, filename));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
