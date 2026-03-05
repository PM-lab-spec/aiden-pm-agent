import { useRef, useState } from "react";
import { Upload, FileText, X, File, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDocuments } from "@/context/DocumentContext";
import { toast } from "sonner";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function DocumentSidebar() {
  const { documents, addDocuments, removeDocument, maxDocuments } = useDocuments();
  const atLimit = documents.length >= maxDocuments;
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) addDocuments(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground text-sm">Documents</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Upload product docs for AI context
        </p>
      </div>

      {/* Upload zone */}
      <div className="p-4">
        <div
          onDragOver={(e) => { if (!atLimit) { e.preventDefault(); setIsDragOver(true); } }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => { if (atLimit) return; handleDrop(e); }}
          onClick={() => { if (atLimit) { toast.error(`Maximum ${maxDocuments} documents allowed. Remove a document first.`); return; } fileInputRef.current?.click(); }}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            atLimit
              ? "border-border/50 bg-muted/20 cursor-not-allowed opacity-60"
              : isDragOver
              ? "border-primary bg-primary/5 cursor-pointer"
              : "border-border hover:border-primary/50 hover:bg-secondary/30 cursor-pointer"
          }`}
        >
          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">
            {atLimit ? `Limit reached (${maxDocuments} docs)` : <>Drop files here or <span className="text-primary font-medium">browse</span></>}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {atLimit ? "Remove a document to upload more" : "PDF, DOCX, TXT, MD"}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addDocuments(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-4">
        <AnimatePresence>
          {documents.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2"
            >
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border group">
                <div className="shrink-0">
                  {file.status === "uploading" || file.status === "indexing" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : file.status === "error" ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                    {file.status === "indexed" && (
                      <span className="text-success ml-1.5">• Indexed</span>
                    )}
                    {file.status === "indexing" && (
                      <span className="text-primary ml-1.5">• Indexing...</span>
                    )}
                    {file.status === "uploading" && (
                      <span className="text-muted-foreground ml-1.5">• Reading...</span>
                    )}
                    {file.status === "error" && (
                      <span className="text-destructive ml-1.5">• Failed</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => removeDocument(file.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {documents.length === 0 && (
          <div className="text-center py-8">
            <File className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No documents yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
