"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, CheckCircle } from "lucide-react";

interface HomeworkUploadButtonProps {
  studentId: string;
  assignmentId: string;
  alreadySubmitted: boolean;
}

export function HomeworkUploadButton({ studentId, assignmentId, alreadySubmitted }: HomeworkUploadButtonProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(alreadySubmitted);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("studentId", studentId);
    formData.append("assignmentId", assignmentId);
    formData.append("file", file);
    await fetch("/api/parent/homework-submissions", { method: "POST", body: formData });
    setUploading(false);
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        Submitted
      </span>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
      <Button size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
        Submit
      </Button>
    </>
  );
}
