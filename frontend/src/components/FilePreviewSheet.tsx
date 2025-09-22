import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Download, FileJson, FileSpreadsheet, FileText, FileImage } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

type FileKind = "markdown" | "json" | "csv" | "text" | "pdf" | "image";

interface FilePreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  filename: string; // just the filename, not a path
  displayName?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const FilePreviewSheet: React.FC<FilePreviewSheetProps> = ({
  open,
  onOpenChange,
  conversationId,
  filename,
  displayName,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");

  const fileKind: FileKind = useMemo(() => {
    const lower = filename.toLowerCase();
    if (
      lower.endsWith(".md") ||
      lower.endsWith(".markdown") ||
      lower.endsWith(".mdx")
    )
      return "markdown";
    if (lower.endsWith(".json")) return "json";
    if (lower.endsWith(".csv")) return "csv";
    if (lower.endsWith(".pdf")) return "pdf";
    if (
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".gif") ||
      lower.endsWith(".webp") ||
      lower.endsWith(".svg")
    )
      return "image";
    return "text";
  }, [filename]);

  // Simple CSV parser that supports quoted fields and escaped quotes
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];
      if (inQuotes) {
        if (char === '"') {
          if (next === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          row.push(field);
          field = "";
        } else if (char === "\n") {
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        } else if (char === "\r") {
          // ignore CR
        } else {
          field += char;
        }
      }
    }
    row.push(field);
    rows.push(row);
    if (
      rows.length &&
      rows[rows.length - 1].length === 1 &&
      rows[rows.length - 1][0] === ""
    ) {
      rows.pop();
    }
    return rows;
  };

  const csvRows = useMemo(() => {
    if (fileKind !== "csv" || !content) return [] as string[][];
    try {
      return parseCSV(content);
    } catch {
      return [] as string[][];
    }
  }, [fileKind, content]);

  useEffect(() => {
    const fetchContent = async () => {
      if (!open) return;
      setLoading(true);
      setError(null);
      setContent("");
      try {
        const url = `${API_BASE}/files/conversations/${encodeURIComponent(
          conversationId
        )}/attachments/${encodeURIComponent(filename)}`;

        // For PDFs and images, we don't fetch the content for preview
        if (fileKind === "pdf" || fileKind === "image") {
          setContent(url); // Store the URL for iframe/img display
          setLoading(false);
          return;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const text = await res.text();
        if (fileKind === "json") {
          try {
            const obj = JSON.parse(text);
            setContent(JSON.stringify(obj, null, 2));
          } catch {
            setContent(text);
          }
        } else {
          setContent(text);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [open, conversationId, filename, fileKind]);

  const title = displayName || filename;

  const typeLabel =
    fileKind === "csv"
      ? "CSV"
      : fileKind === "json"
      ? "JSON"
      : fileKind === "markdown"
      ? "Markdown"
      : fileKind === "pdf"
      ? "PDF"
      : fileKind === "image"
      ? "Image"
      : "Texte";

  const handleDownload = async () => {
    try {
      const url = `${API_BASE}/files/conversations/${encodeURIComponent(
        conversationId
      )}/attachments/${encodeURIComponent(filename)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Nettoyer l'URL créée
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl w-[85vw] sm:w-[70vw] md:w-[60vw] lg:w-[50vw] p-0"
      >
        <div className="flex h-full flex-col">
          {/* Sticky header with title and file-type badge */}
          <div className="px-6 py-4 border-b bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {fileKind === "csv" ? (
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
              ) : fileKind === "json" ? (
                <FileJson className="h-5 w-5 text-primary shrink-0" />
              ) : fileKind === "image" ? (
                <FileImage className="h-5 w-5 text-primary shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-primary shrink-0" />
              )}
              <div className="truncate font-semibold text-[15px]">{title}</div>
            </div>
            <div className="flex items-center gap-2">
              {fileKind === "csv" && csvRows.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  {csvRows.length - 1} rows
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-7 px-2"
                title="Télécharger le fichier"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Badge variant="secondary" className="uppercase tracking-wide">
                {typeLabel}
              </Badge>
            </div>
          </div>
          <div className="px-6 pb-6 pt-4 flex-1 min-h-0 overflow-hidden">
            {loading && (
              <div className="text-sm text-muted-foreground">
                Chargement du fichier…
              </div>
            )}
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                Erreur: {error}
              </div>
            )}
            {!loading && !error && (
              <ScrollArea className="h-full rounded border bg-muted/10">
                {fileKind === "markdown" ? (
                  <div className="p-4">
                    <MarkdownRenderer content={content} />
                  </div>
                ) : fileKind === "csv" ? (
                  <div className="p-4">
                    {csvRows.length > 0 ? (
                      <table className="min-w-full border border-border text-sm">
                        <thead className="bg-muted/40">
                          <tr>
                            {csvRows[0].map((h, i) => (
                              <th
                                key={i}
                                className="px-3 py-2 border-b border-r text-left font-semibold text-foreground/90 whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvRows.slice(1).map((r, ri) => (
                            <tr
                              key={ri}
                              className={
                                ri % 2 === 0 ? "bg-background" : "bg-muted/20"
                              }
                            >
                              {r.map((c, ci) => (
                                <td
                                  key={ci}
                                  className="px-3 py-2 border-b border-r align-top whitespace-nowrap"
                                >
                                  {c}
                                </td>
                              ))}
                              {r.length < csvRows[0].length &&
                                Array.from({
                                  length: csvRows[0].length - r.length,
                                }).map((_, k) => (
                                  <td
                                    key={`pad-${k}`}
                                    className="px-3 py-2 border-b border-r"
                                  />
                                ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        CSV vide ou invalide.
                      </div>
                    )}
                  </div>
                ) : fileKind === "pdf" ? (
                  <div className="h-full w-full">
                    <iframe
                      src={content}
                      className="w-full h-full"
                      title={filename}
                    />
                  </div>
                ) : fileKind === "image" ? (
                  <div className="p-4 flex items-center justify-center h-full">
                    <img
                      src={content}
                      alt={filename}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words">
                    {content}
                  </pre>
                )}
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilePreviewSheet;
