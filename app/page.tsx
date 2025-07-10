// app/page.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";



export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center justify-center p-8 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-7xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-4 animate-pulse">
            Medianest
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-2 font-light">
            Transform your image collections into stunning median compositions
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Upload multiple images and discover the hidden beauty in their
            statistical center
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <UploadForm />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon="📸"
            title="Smart Processing"
            description="Advanced algorithms analyze your images to create perfect median compositions"
          />
          <FeatureCard
            icon="⚡"
            title="Lightning Fast"
            description="Process multiple images in seconds with our optimized pipeline"
          />
          <FeatureCard
            icon="🎨"
            title="Creative Results"
            description="Discover unique artistic effects through mathematical image processing"
          />
        </div>

        {/* Gallery Link */}
        <div className="mt-8">
          <Link href="/gallery">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 group cursor-pointer">
              <span className="text-white font-medium">View Gallery</span>
              <svg
                className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function UploadForm() {

  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent page reload

    if (selectedFiles.length === 0) return;

    setUploading(true);

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("file", file)); // match backend key

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_UPLOAD_API_KEY!,
        },
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      console.log("Upload response:", result);

      // ✅ Reset files
      setSelectedFiles([]);

      // ✅ Optional: Show toast
      // alert("Upload successful!"); // replace with custom toast if using shadcn/ui or react-toastify

      // ✅ Optional: Redirect to gallery
      router.push("/gallery"); // If using `useRouter()` from `next/navigation`
    } catch (err) {
      console.error("Upload error", err);
      alert("Failed to upload images.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${
          isDragging
            ? "border-purple-400 bg-purple-500/10 scale-105"
            : "border-white/30 hover:border-white/50 hover:bg-white/5"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-white/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-white mb-2">
            Drop your images here
          </h3>
          <p className="text-gray-300 mb-6">Or click to browse your files</p>

          <label className="relative cursor-pointer">
            <input
              type="file"
              name="files"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
              Choose Files
            </div>
          </label>

          {selectedFiles.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button
                type="submit"
                disabled={uploading}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full font-medium hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {uploading
                  ? "Processing..."
                  : `Process ${selectedFiles.length} Image${
                      selectedFiles.length !== 1 ? "s" : ""
                    }`}
              </button>
            </div>
          )}

          {selectedFiles.length > 0 && (
            <div className="mt-4 text-sm text-gray-400">
              Selected: {selectedFiles.map((f) => f.name).join(", ")}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}
