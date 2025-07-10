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

async function handler(req: NextRequest) {
  // ✅ Validate API Key
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const method = req.method;

  switch (method) {
    case "POST": {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
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

        return NextResponse.json({
          success: true,
          data: result,
        });
      } catch (err) {
        return NextResponse.json({ error: "Upload failed", details: err }, { status: 500 });
      }
    }

    case "GET": {
      try {
        const result = await cloudinary.api.resources({
          type: "upload",
          prefix: "uploads/",
          max_results: 50,
        });

        return NextResponse.json({ files: result.resources });
      } catch (err) {
        return NextResponse.json({ error: "Failed to fetch files", details: err }, { status: 500 });
      }
    }

    case "DELETE": {
      try {
        const body = await req.json();
        const { public_id } = body;

        if (!public_id) {
          return NextResponse.json({ error: "public_id is required" }, { status: 400 });
        }

        await cloudinary.uploader.destroy(public_id);

        return NextResponse.json({ success: true, message: "Deleted successfully" });
      } catch (err) {
        return NextResponse.json({ error: "Failed to delete file", details: err }, { status: 500 });
      }
    }

    default:
      return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }
}

export { handler as GET, handler as POST, handler as DELETE };
