import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";

export const runtime = "nodejs";

const API_KEY = process.env.UPLOAD_API_KEY;

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // 🔐 restrict in production
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

async function handler(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== API_KEY) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    switch (req.method) {
      case "POST": {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
          return NextResponse.json(
            { error: "No file uploaded." },
            { status: 400, headers: corsHeaders }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadRes = await imagekit.upload({
          file: buffer,
          fileName: file.name,
          folder: "/uploads",
        });

        return NextResponse.json(
          { success: true, data: uploadRes },
          { headers: corsHeaders }
        );
      }

      case "GET": {
        const files = await imagekit.listFiles({
          path: "/uploads",
          limit: 50,
        });

        return NextResponse.json({ files }, { headers: corsHeaders });
      }

      case "DELETE": {
        const body = await req.json();
        const { fileId } = body;

        if (!fileId) {
          return NextResponse.json(
            { error: "fileId is required" },
            { status: 400, headers: corsHeaders }
          );
        }

        const res = await imagekit.deleteFile(fileId);
        return NextResponse.json(
          { success: true, message: "Deleted successfully", result: res },
          { headers: corsHeaders }
        );
      }

      default:
        return NextResponse.json(
          { error: "Method Not Allowed" },
          { status: 405, headers: corsHeaders }
        );
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return NextResponse.json(
      {
        error: "Server error",
        details: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export {
  handler as GET,
  handler as POST,
  handler as DELETE,
  handler as OPTIONS,
};
