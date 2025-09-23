import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, Table, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import PdfPreview from "@/components/PdfPreview";
import * as XLSX from 'xlsx';

type FileKind = "markdown" | "json" | "csv" | "text" | "excel" | "pdf";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  filename: string; // just the filename, not a path
  displayName?: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const FilePreviewDialog: React.FC<FilePreviewDialogProps> = ({
  open,
  onOpenChange,
  conversationId,
  filename,
  displayName,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [pdfUrl, setPdfUrl] = useState<string>("");

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
    if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "excel";
    if (lower.endsWith(".pdf")) return "pdf";
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
            // Escaped quote
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
        } else if (char !== "\r") {
          field += char;
        }
      }
    }
    // Finalize the last field/row
    if (field || row.length > 0) {
      row.push(field);
    }
    if (row.length > 0) {
      rows.push(row);
    }
    return rows;
  };

  const csvRows = useMemo(() => {
    if (fileKind !== "csv" || !content) return [] as string[][];
    try {
      const rows = parseCSV(content);
      return rows;
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
      setExcelData([]);
      setPdfUrl("");

      try {
        const url = `${API_BASE}/files/conversations/${encodeURIComponent(
          conversationId
        )}/attachments/${encodeURIComponent(filename)}`;

        if (fileKind === "pdf") {
          // For PDFs, just set the URL for iframe display
          setPdfUrl(url);
        } else if (fileKind === "excel") {
          // For Excel files, fetch as array buffer and parse
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          const arrayBuffer = await res.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });

          // Get the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON array
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            dateNF: 'yyyy-mm-dd'
          });

          setExcelData(jsonData as any[][]);
        } else {
          // For text-based files
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
              // If JSON parse fails, show raw text
              setContent(text);
            }
          } else {
            setContent(text);
          }
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

      // Clean up the created URL
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const getFileIcon = () => {
    if (fileKind === "excel") return <Table className="h-4 w-4" />;
    if (fileKind === "pdf") return <FileText className="h-4 w-4" />;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[85vh] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getFileIcon()}
              <DialogTitle className="truncate">{title}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="h-7 px-2"
                title="Download file"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-7 px-2"
                title="Close"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="mt-2 flex-1 min-h-0 flex flex-col overflow-hidden">
          {loading && (
            <div className="text-sm text-muted-foreground">
              Loading file…
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">
              Error: {error}
            </div>
          )}
          {!loading && !error && (
            <>
              {fileKind === "pdf" ? (
                <PdfPreview url={pdfUrl} className="h-full" />
              ) : (
                <ScrollArea className="h-full rounded border bg-muted/10">
                  {fileKind === "markdown" ? (
                    <div className="p-4">
                      <MarkdownRenderer content={content} />
                    </div>
                  ) : fileKind === "excel" ? (
                    <div className="p-4 overflow-x-auto">
                      {excelData.length > 0 ? (
                        <table className="min-w-full border border-border text-sm">
                          <thead className="bg-muted/40 sticky top-0">
                            <tr>
                              {excelData[0].map((header, i) => (
                                <th
                                  key={i}
                                  className="px-3 py-2 border-b border-r text-left font-semibold text-foreground/90"
                                >
                                  {header || `Column ${i + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {excelData.slice(1).map((row, ri) => (
                              <tr
                                key={ri}
                                className={
                                  ri % 2 === 0 ? "bg-background" : "bg-muted/20"
                                }
                              >
                                {row.map((cell, ci) => (
                                  <td
                                    key={ci}
                                    className="px-3 py-2 border-b border-r whitespace-pre-wrap break-words align-top"
                                  >
                                    {cell || ""}
                                  </td>
                                ))}
                                {/* Fill missing cells */}
                                {row.length < excelData[0].length &&
                                  Array.from({
                                    length: excelData[0].length - row.length,
                                  }).map((_, i) => (
                                    <td
                                      key={`empty-${i}`}
                                      className="px-3 py-2 border-b border-r"
                                    >
                                      &nbsp;
                                    </td>
                                  ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No data in Excel file
                        </div>
                      )}
                    </div>
                  ) : fileKind === "csv" ? (
                    <div className="p-4 overflow-x-auto">
                      {csvRows.length > 0 ? (
                        <table className="min-w-full border border-border text-sm">
                          <thead className="bg-muted/40 sticky top-0">
                            <tr>
                              {csvRows[0].map((h, i) => (
                                <th
                                  key={i}
                                  className="px-3 py-2 border-b border-r text-left font-semibold text-foreground/90"
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
                                    className="px-3 py-2 border-b border-r whitespace-pre-wrap break-words align-top"
                                  >
                                    {c}
                                  </td>
                                ))}
                                {/* Fill missing cells if row shorter than headers */}
                                {r.length < csvRows[0].length &&
                                  Array.from({
                                    length: csvRows[0].length - r.length,
                                  }).map((_, i) => (
                                    <td
                                      key={`empty-${i}`}
                                      className="px-3 py-2 border-b border-r"
                                    >
                                      &nbsp;
                                    </td>
                                  ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No CSV data
                        </div>
                      )}
                    </div>
                  ) : fileKind === "json" ? (
                    <pre className="p-4 text-xs overflow-x-auto font-mono">
                      <code>{content}</code>
                    </pre>
                  ) : (
                    <pre className="p-4 text-sm overflow-x-auto whitespace-pre-wrap break-words">
                      {content}
                    </pre>
                  )}
                </ScrollArea>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
