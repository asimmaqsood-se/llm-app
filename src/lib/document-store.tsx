"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { Document, DocumentVersion, AppState } from "@/types";

interface DocumentContextType {
  state: AppState;
  createDocument: (title: string, content: string, description?: string) => Document;
  updateDocument: (docId: string, content: string, description?: string) => DocumentVersion;
  openDocument: (docId: string, versionId?: string) => void;
  closeDocument: () => void;
  setActiveVersion: (versionId: string) => void;
  getActiveDocument: () => Document | null;
  getActiveVersion: () => DocumentVersion | null;
}

const DocumentContext = createContext<DocumentContextType | null>(null);

// Global ref so DocumentToolUI can call createDocument/updateDocument
// even when rendered inside AssistantRuntimeProvider tree
export const documentStoreRef: {
  createDocument?: DocumentContextType["createDocument"];
  updateDocument?: DocumentContextType["updateDocument"];
  getDocuments?: () => Document[];
} = {};

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    documents: [],
    activeDocumentId: null,
    isDocumentPanelOpen: false,
    activeVersionId: null,
  });

  // Keep a ref to current documents for use in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  const createDocument = useCallback((title: string, content: string, description?: string): Document => {
    const versionId = crypto.randomUUID();
    const docId = crypto.randomUUID();
    const now = new Date();

    const version: DocumentVersion = {
      id: versionId,
      version: 1,
      title,
      content,
      createdAt: now,
      description: description || "Initial version",
    };

    const doc: Document = {
      id: docId,
      title,
      versions: [version],
      currentVersionId: versionId,
      createdAt: now,
      updatedAt: now,
    };

    setState((prev) => ({
      ...prev,
      documents: [...prev.documents, doc],
      activeDocumentId: docId,
      activeVersionId: versionId,
      isDocumentPanelOpen: true,
    }));

    return doc;
  }, []);

  const updateDocument = useCallback((docId: string, content: string, description?: string): DocumentVersion => {
    let newVersion!: DocumentVersion;

    setState((prev) => {
      const doc = prev.documents.find((d) => d.id === docId);
      if (!doc) return prev;

      const versionNumber = doc.versions.length + 1;
      const versionId = crypto.randomUUID();
      const now = new Date();

      newVersion = {
        id: versionId,
        version: versionNumber,
        title: doc.title,
        content,
        createdAt: now,
        description: description || `Version ${versionNumber}`,
      };

      const updatedDoc: Document = {
        ...doc,
        versions: [...doc.versions, newVersion],
        currentVersionId: versionId,
        updatedAt: now,
      };

      return {
        ...prev,
        documents: prev.documents.map((d) => (d.id === docId ? updatedDoc : d)),
        activeDocumentId: docId,
        activeVersionId: versionId,
        isDocumentPanelOpen: true,
      };
    });

    return newVersion;
  }, []);

  const openDocument = useCallback((docId: string, versionId?: string) => {
    setState((prev) => {
      const doc = prev.documents.find((d) => d.id === docId);
      if (!doc) return prev;
      return {
        ...prev,
        activeDocumentId: docId,
        activeVersionId: versionId || doc.currentVersionId,
        isDocumentPanelOpen: true,
      };
    });
  }, []);

  const closeDocument = useCallback(() => {
    setState((prev) => ({ ...prev, isDocumentPanelOpen: false }));
  }, []);

  const setActiveVersion = useCallback((versionId: string) => {
    setState((prev) => ({ ...prev, activeVersionId: versionId }));
  }, []);

  const getActiveDocument = useCallback((): Document | null => {
    return stateRef.current.documents.find((d) => d.id === stateRef.current.activeDocumentId) || null;
  }, []);

  const getActiveVersion = useCallback((): DocumentVersion | null => {
    const doc = getActiveDocument();
    if (!doc) return null;
    return doc.versions.find((v) => v.id === stateRef.current.activeVersionId) || null;
  }, [getActiveDocument]);

  // Expose to global ref so DocumentToolUI can call without needing context
  documentStoreRef.createDocument = createDocument;
  documentStoreRef.updateDocument = updateDocument;
  documentStoreRef.getDocuments = () => stateRef.current.documents;

  return (
    <DocumentContext.Provider
      value={{
        state,
        createDocument,
        updateDocument,
        openDocument,
        closeDocument,
        setActiveVersion,
        getActiveDocument,
        getActiveVersion,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentProvider");
  return ctx;
}