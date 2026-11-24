import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** Generated PWA/favicon icon; also referenced by manifest.ts. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F172A",
          borderRadius: 96,
          color: "#ffffff",
          fontSize: 300,
          fontWeight: 800,
          letterSpacing: -20,
        }}
      >
        <span style={{ color: "#F97316" }}>G</span>
      </div>
    ),
    size,
  );
}
