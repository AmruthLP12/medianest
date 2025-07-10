import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

const API_KEY = process.env.UPLOAD_API_KEY;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function bufferToStream(buffer: Buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // 🔐 Restrict in production
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

async function handler(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
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

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "uploads" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          bufferToStream(buffer).pipe(uploadStream);
        });

        return NextResponse.json(
          { success: true, data: result },
          { headers: corsHeaders }
        );
      }

      case "GET": {
        try {
          const result = await cloudinary.api.resources({
            type: "upload",
            prefix: "uploads/",
            max_results: 50,
          });

          return NextResponse.json(
            { files: result.resources },
            { headers: corsHeaders }
          );
        } catch (err: unknown) {
          const error = err instanceof Error ? err : new Error(String(err));

          if (
            typeof error === "object" &&
            error !== null &&
            "http_code" in error &&
            (error as { http_code?: number }).http_code === 420
          ) {
            return NextResponse.json(
              {
                error: "Rate Limit Exceeded",
                message:
                  "Cloudinary daily API limit exceeded. Please try again after 09:00 UTC.",
              },
              { status: 429, headers: corsHeaders }
            );
          }

          return NextResponse.json(
            {
              error: "Failed to fetch files",
              details: error.message,
            },
            { status: 500, headers: corsHeaders }
          );
        }
      }

      case "DELETE": {
        const body = await req.json();
        const { public_id } = body;

        if (!public_id) {
          return NextResponse.json(
            { error: "public_id is required" },
            { status: 400, headers: corsHeaders }
          );
        }

        const res = await cloudinary.uploader.destroy(public_id);
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
        error: "Unexpected server error",
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
