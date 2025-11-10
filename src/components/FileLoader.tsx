import React, { useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import type { ParsedFile } from "@/lib/types";
import { detectFileKind, parseFile } from "@/lib/fileParser"; // Updated import

// 파일 업로더
export function FileLoader({ onLoaded }: { onLoaded: (files: ParsedFile[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const parsed: ParsedFile[] = [];
    for (const f of files) {
      const { kind } = detectFileKind(f.name);
      const data = await parseFile(f); // Using the new parseFile function
      parsed.push({ name: f.name, kind, data });
    }
    onLoaded(parsed);
  }, [onLoaded]); // Added onLoaded to dependency array

  const onDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    await handleFiles(files);
  }, [handleFiles]); // handleFiles is now a stable reference

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center"
        >
          <UploadCloud className="w-10 h-10" />
          <div className="text-base font-medium">
            CSV 또는 Excel 파일을 드래그&드롭 하세요
          </div>
          <div className="text-sm text-muted-foreground">
            또는 아래 버튼을 눌러 선택
          </div>
          <Button className="mt-2" onClick={() => inputRef.current?.click()}>
            파일 선택
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv, .xlsx, .xls" // Updated accept attribute
            multiple
            hidden
            onChange={onChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
