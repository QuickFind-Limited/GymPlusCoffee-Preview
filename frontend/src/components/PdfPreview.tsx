import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { authorizedFetch } from "@/services/authorizedFetch";

let pdfjsLibPromise: Promise<typeof import("pdfjs-dist/build/pdf")> | null = null;
let pdfWorkerInitialized = false;

const loadPdfJs = async () => {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist/build/pdf");
  }

  const pdfjsLib = await pdfjsLibPromise;

  if (!pdfWorkerInitialized) {
    const workerSrcModule = await import("pdfjs-dist/build/pdf.worker?url");
    const workerSrc = workerSrcModule.default || workerSrcModule;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
    pdfWorkerInitialized = true;
  }

  return pdfjsLib;
};

interface PdfPreviewProps {
  url: string;
  className?: string;
}

const PdfPreview: React.FC<PdfPreviewProps> = ({ url, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setError(null);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      return;
    }

    let isCancelled = false;
    const abortController = new AbortController();
    let pdfDocument: import("pdfjs-dist/types/src/display/api").PDFDocumentProxy | null = null;

    const renderPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        const fetchPromise = url.startsWith("blob:") || url.startsWith("data:")
          ? fetch(url, { signal: abortController.signal })
          : authorizedFetch(url, { signal: abortController.signal });

        const [pdfjsLib, response] = await Promise.all([
          loadPdfJs(),
          fetchPromise,
        ]);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.arrayBuffer();
        if (isCancelled) {
          return;
        }

        pdfDocument = await pdfjsLib.getDocument({ data }).promise;
        if (isCancelled) {
          return;
        }

        const container = containerRef.current;
        if (!container) {
          return;
        }

        container.innerHTML = "";

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
          if (isCancelled) {
            return;
          }

          const page = await pdfDocument.getPage(pageNumber);
          if (isCancelled) {
            return;
          }

          const viewport = page.getViewport({ scale: 1.2 });
          const canvas = document.createElement("canvas");
          canvas.className = "w-full max-w-[900px] rounded border border-border bg-white shadow-sm";
          const context = canvas.getContext("2d");
          if (!context) {
            continue;
          }

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({ canvasContext: context, viewport }).promise;

          if (isCancelled) {
            return;
          }

          container.appendChild(canvas);
        }
      } catch (err) {
        if (isCancelled) {
          return;
        }
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load PDF");
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    renderPdf();

    return () => {
      isCancelled = true;
      abortController.abort();
      if (pdfDocument) {
        pdfDocument.cleanup();
        pdfDocument.destroy();
      }
    };
  }, [url]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 text-sm text-muted-foreground">
          Loading PDF…
        </div>
      )}
      {error ? (
        <div className="p-4 text-sm text-red-600 dark:text-red-400">
          Failed to load PDF preview. {error}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-full w-full overflow-auto p-4 flex flex-col items-center gap-4"
        />
      )}
    </div>
  );
};

export default PdfPreview;
