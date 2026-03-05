import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type DocumentFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  status: "uploading" | "indexed" | "error";
};

type DocumentContextType = {
  documents: DocumentFile[];
  addDocuments: (files: FileList) => void;
  removeDocument: (id: string) => void;
  getDocumentContext: () => string;
};

const DocumentContext = createContext<DocumentContextType | null>(null);

export function useDocuments() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentProvider");
  return ctx;
}

export function DocumentProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);

  const addDocuments = useCallback((fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
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

      // Read file content as text
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, content: text, status: "indexed" } : d
          )
        );
      };
      reader.onerror = () => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, status: "error" } : d
          )
        );
      };
      reader.readAsText(file);
    });
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const getDocumentContext = useCallback(() => {
    const indexed = documents.filter((d) => d.status === "indexed" && d.content);
    if (indexed.length === 0) return "";

    return indexed
      .map(
        (d) =>
          `--- Document: ${d.name} ---\n${d.content.slice(0, 15000)}\n--- End of ${d.name} ---`
      )
      .join("\n\n");
  }, [documents]);

  return (
    <DocumentContext.Provider
      value={{ documents, addDocuments, removeDocument, getDocumentContext }}
    >
      {children}
    </DocumentContext.Provider>
  );
}
