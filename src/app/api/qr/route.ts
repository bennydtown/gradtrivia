import QRCode from "qrcode";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const host = url.host;
  const protocol = url.protocol;
  const base =
    process.env.PUBLIC_BASE_URL?.replace(/\/$/, "") ??
    `${protocol}//${host}`;
  const joinUrl = `${base}/play`;

  const png = await QRCode.toBuffer(joinUrl, {
    type: "png",
    width: 480,
    margin: 2,
    color: { dark: "#1a2332ff", light: "#f4efe6ff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
