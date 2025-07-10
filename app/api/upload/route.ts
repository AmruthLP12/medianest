import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";

const uploadDir = path.join(process.cwd(), "public/uploads");
const API_KEY = process.env.UPLOAD_API_KEY;

async function handler(req: NextRequest) {
  // ✅ Validate API key
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

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${file.name}`;

      await writeFile(`${uploadDir}/${fileName}`, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${fileName}`,
        filename: fileName,
      });
    }

    case "GET": {
      try {
        const files = fs.readdirSync(uploadDir);
        return NextResponse.json({ files });
      } catch (err) {
        return NextResponse.json({ files: [], error: err }, { status: 500 });
      }
    }

    case "DELETE": {
      try {
        const body = await req.json();
        const { filename } = body;

        if (!filename) {
          return NextResponse.json({ error: "Filename is required" }, { status: 400 });
        }

        const filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(filePath)) {
          return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        fs.unlinkSync(filePath);

        return NextResponse.json({ message: "File deleted successfully" });
      } catch (err) {
        return NextResponse.json(
          { error: "Failed to delete file", details: err },
          { status: 500 }
        );
      }
    }

    default:
      return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
  }
}

export { handler as GET, handler as POST, handler as DELETE };
