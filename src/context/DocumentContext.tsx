import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { extractPdfText, isPdf } from "@/lib/pdfExtractor";
import { extractDocxText, isDocx } from "@/lib/docxExtractor";
import { toast } from "sonner";

export type DocumentFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  status: "uploading" | "indexing" | "indexed" | "error";
};

type DocumentContextType = {
  documents: DocumentFile[];
  addDocuments: (files: FileList) => void;
  removeDocument: (id: string) => void;
  sessionId: string;
};

const DocumentContext = createContext<DocumentContextType | null>(null);

export function useDocuments() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentProvider");
  return ctx;
}

const EMBED_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/embed-document`;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_TYPES = [".pdf", ".docx", ".txt", ".md", ".csv"];

async function embedDocument(content: string, documentName: string, sessionId: string) {
  const resp = await fetch(EMBED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ content, documentName, sessionId }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `Embedding failed: ${resp.status}`);
  }

  return resp.json();
}

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const sessionIdRef = useRef(crypto.randomUUID());

  const addDocuments = useCallback((fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is too large (max 10MB)`);
        return;
      }

      // Validate file type
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!SUPPORTED_TYPES.includes(ext)) {
        toast.error(`"${file.name}" is not a supported file type`);
        return;
      }

      const id = crypto.randomUUID();
      const doc: DocumentFile = {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        content: "",
        status: "uploading",
      };
      setDocuments((prev) => [doc, ...prev]);

      const processFile = async () => {
        try {
          // 1. Extract text
          let text: string;
          if (isPdf(file)) {
            text = await extractPdfText(file);
          } else if (isDocx(file)) {
            text = await extractDocxText(file);
          } else {
            text = await file.text();
          }

          // Validate extracted content
          if (!text || text.trim().length < 50) {
            throw new Error("Could not extract meaningful text from this file");
          }

          setDocuments((prev) =>
            prev.map((d) =>
              d.id === id ? { ...d, content: text, status: "indexing" } : d
            )
          );

          // 2. Send to embedding edge function
          const result = await embedDocument(text, file.name, sessionIdRef.current);
          console.log(`Embedded "${file.name}": ${result.chunksCreated} chunks`);

          setDocuments((prev) =>
            prev.map((d) =>
              d.id === id ? { ...d, status: "indexed" } : d
            )
          );

          toast.success(`"${file.name}" indexed (${result.chunksCreated} chunks)`);
        } catch (err: any) {
          console.error("Error processing file:", file.name, err);
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === id ? { ...d, status: "error" } : d
            )
          );
          toast.error(`Failed to index "${file.name}": ${err.message || "Unknown error"}`);
        }
      };
      processFile();
    });
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return (
    <DocumentContext.Provider
      value={{ documents, addDocuments, removeDocument, sessionId: sessionIdRef.current }}
    >
      {children}
    </DocumentContext.Provider>
  );
}
