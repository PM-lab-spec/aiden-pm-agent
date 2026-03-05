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
  maxDocuments: number;
};

const DocumentContext = createContext<DocumentContextType | null>(null);

export function useDocuments() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentProvider");
  return ctx;
}

const EMBED_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/embed-document`;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DOCUMENTS = 2;
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
  const processingRef = useRef(false);
  const queueRef = useRef<{ file: File; id: string }[]>([]);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      const { file, id } = queueRef.current.shift()!;

      try {
        let text: string;
        if (isPdf(file)) {
          text = await extractPdfText(file);
        } else if (isDocx(file)) {
          text = await extractDocxText(file);
        } else {
          text = await file.text();
        }

        if (!text || text.trim().length < 50) {
          throw new Error("Could not extract meaningful text from this file");
        }

        setDocuments((prev) =>
          prev.map((d) => d.id === id ? { ...d, content: text, status: "indexing" } : d)
        );

        const result = await embedDocument(text, file.name, sessionIdRef.current);
        console.log(`Embedded "${file.name}": ${result.chunksCreated} chunks`);

        setDocuments((prev) =>
          prev.map((d) => d.id === id ? { ...d, status: "indexed" } : d)
        );
        toast.success(`"${file.name}" indexed (${result.chunksCreated} chunks)`);
      } catch (err: any) {
        console.error("Error processing file:", file.name, err);
        setDocuments((prev) =>
          prev.map((d) => d.id === id ? { ...d, status: "error" } : d)
        );
        toast.error(`Failed to index "${file.name}": ${err.message || "Unknown error"}`);
      }
    }

    processingRef.current = false;
  }, []);

  const addDocuments = useCallback((fileList: FileList) => {
    const files = Array.from(fileList);
    const currentCount = documents.length;
    const remaining = MAX_DOCUMENTS - currentCount;

    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_DOCUMENTS} documents allowed. Remove a document first.`);
      return;
    }

    if (files.length > remaining) {
      toast.error(`You can only upload ${remaining} more document${remaining === 1 ? "" : "s"} (max ${MAX_DOCUMENTS})`);
    }

    const filesToProcess = files.slice(0, remaining);
    const newDocs: { file: File; doc: DocumentFile }[] = [];

    for (const file of filesToProcess) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is too large (max 10MB)`);
        continue;
      }

      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!SUPPORTED_TYPES.includes(ext)) {
        toast.error(`"${file.name}" is not a supported file type`);
        continue;
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
      newDocs.push({ file, doc });
    }

    if (newDocs.length === 0) return;

    setDocuments((prev) => [...newDocs.map((d) => d.doc), ...prev]);

    // Queue for sequential processing
    for (const { file, doc } of newDocs) {
      queueRef.current.push({ file, id: doc.id });
    }
    processQueue();
  }, [documents.length, processQueue]);

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    queueRef.current = queueRef.current.filter((q) => q.id !== id);
  }, []);

  return (
    <DocumentContext.Provider
      value={{ documents, addDocuments, removeDocument, sessionId: sessionIdRef.current, maxDocuments: MAX_DOCUMENTS }}
    >
      {children}
    </DocumentContext.Provider>
  );
}
