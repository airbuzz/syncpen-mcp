/**
 * HTTP client for the SyncPen API
 */

import { Config } from "./config.js";

export interface Folder {
  id: string;
  name: string;
  order: number;
  documentCount: number;
  createdAt: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  isOwner: boolean;
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  isOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface CreateFolderResponse {
  folder: {
    id: string;
    name: string;
    parentId?: string | null;
    order: number;
    documentCount: number;
    createdAt: string;
  };
}

export interface RenameFolderResponse {
  folder: {
    id: string;
    name: string;
    parentId?: string | null;
    updatedAt: string;
  };
}

export interface CreateDocumentResponse {
  document: {
    id: string;
    title: string;
    folderId: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UpdateDocumentResponse {
  document: {
    id: string;
    title: string;
    isOwner: boolean;
    updatedAt: string;
  };
}

export class SyncPenClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: Config) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.apiUrl;
  }

  private async fetch<T>(path: string, params?: Record<string, string>): Promise<T> {
    // Ensure proper URL construction - baseUrl must end with / and path must not start with /
    const base = this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const url = new URL(cleanPath, base);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(`SyncPen API error: ${error.message || error.error || "Unknown error"}`);
    }

    return data as T;
  }

  async listFolders(): Promise<Folder[]> {
    const response = await this.fetch<{ folders: Folder[] }>("/folders");
    return response.folders;
  }

  async listDocuments(options?: { folderId?: string; limit?: number }): Promise<DocumentSummary[]> {
    const params: Record<string, string> = {};
    if (options?.folderId) params.folderId = options.folderId;
    if (options?.limit) params.limit = String(options.limit);

    const response = await this.fetch<{ documents: DocumentSummary[] }>("/documents", params);
    return response.documents;
  }

  async readDocument(documentId: string): Promise<Document> {
    const response = await this.fetch<{ document: Document }>(`/documents/${documentId}`);
    return response.document;
  }

  async search(options: { query: string; folderId?: string; limit?: number }): Promise<DocumentSummary[]> {
    const params: Record<string, string> = { query: options.query };
    if (options.folderId) params.folderId = options.folderId;
    if (options.limit) params.limit = String(options.limit);

    const response = await this.fetch<{ query: string; results: DocumentSummary[] }>("/search", params);
    return response.results;
  }

  private async mutate<T>(
    method: "POST" | "PUT" | "DELETE",
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const base = this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`;
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    const url = new URL(cleanPath, base);

    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(`SyncPen API error: ${error.message || error.error || "Unknown error"}`);
    }

    return data as T;
  }

  async createDocument(options?: {
    title?: string;
    content?: string;
    folderId?: string;
  }): Promise<CreateDocumentResponse["document"]> {
    const body: Record<string, unknown> = {};
    if (options?.title) body.title = options.title;
    if (options?.content) body.content = options.content;
    if (options?.folderId) body.folderId = options.folderId;

    const response = await this.mutate<CreateDocumentResponse>("POST", "/documents", body);
    return response.document;
  }

  async createFolder(
    name: string,
    parentId?: string | null
  ): Promise<CreateFolderResponse["folder"]> {
    const body: Record<string, unknown> = { name };
    if (parentId !== undefined) body.parentId = parentId;
    const response = await this.mutate<CreateFolderResponse>("POST", "/folders", body);
    return response.folder;
  }

  async renameFolder(folderId: string, name: string): Promise<RenameFolderResponse["folder"]> {
    const response = await this.mutate<RenameFolderResponse>("PUT", `/folders/${folderId}`, { name });
    return response.folder;
  }

  async moveFolder(
    folderId: string,
    parentId: string | null
  ): Promise<RenameFolderResponse["folder"]> {
    const response = await this.mutate<RenameFolderResponse>(
      "PUT",
      `/folders/${folderId}`,
      { parentId }
    );
    return response.folder;
  }

  async deleteFolder(folderId: string): Promise<void> {
    await this.mutate<{ ok: boolean }>("DELETE", `/folders/${folderId}`);
  }

  async updateDocument(
    documentId: string,
    options: { title?: string; content?: string }
  ): Promise<UpdateDocumentResponse["document"]> {
    const body: Record<string, unknown> = {};
    if (options.title !== undefined) body.title = options.title;
    if (options.content !== undefined) body.content = options.content;

    const response = await this.mutate<UpdateDocumentResponse>(
      "PUT",
      `/documents/${documentId}`,
      body
    );
    return response.document;
  }

  async moveDocument(
    documentId: string,
    folderId: string | null
  ): Promise<UpdateDocumentResponse["document"]> {
    const response = await this.mutate<UpdateDocumentResponse>(
      "PUT",
      `/documents/${documentId}`,
      { folderId }
    );
    return response.document;
  }

  async deleteDocument(documentId: string): Promise<void> {
    await this.mutate<{ ok: boolean }>("DELETE", `/documents/${documentId}`);
  }
}
