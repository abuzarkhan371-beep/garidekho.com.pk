import "server-only";
import { mkdir, readdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { UPLOAD_MAX_BYTES } from "@/lib/constants";

export type StoredImage = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  sizeBytes: number;
};

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function validateImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Unsupported image type: ${file.type}. Use JPG, PNG, WEBP or AVIF.`);
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    throw new Error(`Image exceeds the ${Math.round(UPLOAD_MAX_BYTES / 1024 / 1024)}MB limit.`);
  }
}

/** Compress and resize to a web-friendly 1600px WebP while preserving quality. */
export async function processImage(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: processed.data, width: processed.info.width, height: processed.info.height };
}

async function storeLocal(userId: string, buffer: Buffer, publicId: string): Promise<string> {
  const directory = path.join(process.cwd(), ".uploads", userId);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, `${publicId}.webp`), buffer);
  return `/api/uploads/${userId}/${publicId}.webp`;
}

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

export async function storeImage(file: File, userId: string): Promise<StoredImage> {
  validateImageFile(file);
  const { buffer, width, height } = await processImage(file);
  const publicId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const driver = process.env.STORAGE_DRIVER ?? "local";

  if (driver === "local") {
    const url = await storeLocal(userId, buffer, publicId);
    return { url, publicId, width, height, sizeBytes: buffer.byteLength };
  }

  if (driver === "cloudinary") {
    configureCloudinary();
    const result = await cloudinary.uploader.upload(`data:image/webp;base64,${buffer.toString("base64")}`, {
      public_id: `garidekho/${userId}/${publicId}`,
      resource_type: "image",
      overwrite: false,
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width || width,
      height: result.height || height,
      sizeBytes: result.bytes ?? buffer.byteLength,
    };
  }

  throw new Error(`Unsupported STORAGE_DRIVER: ${driver}`);
}

export async function deleteStoredImage(publicId: string, userId?: string) {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") {
    const root = path.join(process.cwd(), ".uploads");
    if (userId) {
      await unlink(path.join(root, userId, `${publicId}.webp`)).catch(() => undefined);
      return;
    }
    // Older rows may not carry a user id, so look through every upload folder.
    const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
    await Promise.all(
      entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => unlink(path.join(root, entry.name, `${publicId}.webp`)).catch(() => undefined)),
    );
    await unlink(path.join(root, `${publicId}.webp`)).catch(() => undefined);
    await unlink(path.join(root, publicId)).catch(() => undefined);
    return;
  }
  if (driver === "cloudinary") {
    configureCloudinary();
    await cloudinary.uploader.destroy(publicId);
  }
}
