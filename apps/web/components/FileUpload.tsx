"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { type UploadInstruction, uploadFile } from "@/lib/upload";

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [objectKey, setObjectKey] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
      setProgress(0);
      setObjectKey(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    try {
      // Step 1: Request presigned upload URL from API
      const instruction = await api.post<UploadInstruction>("/uploads", {
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });

      setObjectKey(instruction.objectKey);

      // Step 2: Upload file directly to storage
      await uploadFile(instruction, file, (percent) => {
        setProgress(percent);
      });

      setSuccess(true);
      setProgress(100);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 border rounded-lg max-w-md">
      <h2 className="text-xl font-semibold">File Upload</h2>

      <div className="space-y-2">
        <label htmlFor="file-input" className="block text-sm font-medium">
          Select File
        </label>
        <input
          id="file-input"
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 disabled:opacity-50"
        />
        {file && (
          <p className="text-sm text-gray-600">
            {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">Upload successful!</p>
          {objectKey && <p className="text-xs text-green-700 mt-1">Stored at: {objectKey}</p>}
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">{progress}%</p>
        </div>
      )}

      <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
        {uploading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}
