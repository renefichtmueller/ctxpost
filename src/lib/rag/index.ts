/**
 * RAG (Retrieval Augmented Generation) System
 *
 * Uses Ollama embeddings (nomic-embed-text) and an in-memory vector store
 * for document retrieval. Can optionally connect to ChromaDB for persistence.
 *
 * Documents: brand guidelines, successful posts, best practices
 */

export interface RAGDocument {
  id: string;
  content: string;
  metadata: {
    source: string; // "brand_guide" | "successful_post" | "best_practice"
    platform?: string;
    engagementScore?: number;
    language?: string;
    createdAt?: string;
  };
  embedding?: number[];
}

export interface RAGQueryResult {
  document: RAGDocument;
  score: number;
}

/**
 * Simple in-memory vector store (no external DB required)
 * For production, swap with ChromaDB client
 */
class InMemoryVectorStore {
  private documents: RAGDocument[] = [];

  add(doc: RAGDocument) {
    const existing = this.documents.findIndex((d) => d.id === doc.id);
    if (existing >= 0) {
      this.documents[existing] = doc;
    } else {
      this.documents.push(doc);
    }
  }

  addMany(docs: RAGDocument[]) {
    for (const doc of docs) {
      this.add(doc);
    }
  }

  query(queryEmbedding: number[], topK: number = 5, filter?: { source?: string; platform?: string }): RAGQueryResult[] {
    let candidates = this.documents.filter((d) => d.embedding && d.embedding.length > 0);

    if (filter?.source) {
      candidates = candidates.filter((d) => d.metadata.source === filter.source);
    }
    if (filter?.platform) {
      candidates = candidates.filter((d) => d.metadata.platform === filter.platform);
    }

    const scored = candidates.map((doc) => ({
      document: doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding!),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  getAll(): RAGDocument[] {
    return this.documents;
  }

  clear() {
    this.documents = [];
  }

  size(): number {
    return this.documents.length;
  }
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

// Singleton store
const vectorStore = new InMemoryVectorStore();

/**
 * Generate embeddings using Ollama (nomic-embed-text)
 */
export async function generateEmbedding(
  text: string,
  ollamaUrl: string = "http://localhost:11434"
): Promise<number[]> {
  try {
    const response = await fetch(`${ollamaUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nomic-embed-text",
        input: text,
      }),
    });

    if (!response.ok) {
      console.error("Embedding API error:", response.status);
      return [];
    }

    const data = await response.json();
    return data.embeddings?.[0] || [];
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    return [];
  }
}

/**
 * Ingest a document into the vector store
 */
export async function ingestDocument(
  doc: Omit<RAGDocument, "embedding">,
  ollamaUrl?: string
): Promise<void> {
  const embedding = await generateEmbedding(doc.content, ollamaUrl);
  vectorStore.add({ ...doc, embedding });
}

/**
 * Ingest multiple documents
 */
export async function ingestDocuments(
  docs: Omit<RAGDocument, "embedding">[],
  ollamaUrl?: string
): Promise<number> {
  let count = 0;
  for (const doc of docs) {
    const embedding = await generateEmbedding(doc.content, ollamaUrl);
    if (embedding.length > 0) {
      vectorStore.add({ ...doc, embedding });
      count++;
    }
  }
  return count;
}

/**
 * Query the RAG system with a natural language question
 */
export async function queryRAG(
  query: string,
  options: {
    topK?: number;
    source?: string;
    platform?: string;
    ollamaUrl?: string;
  } = {}
): Promise<RAGQueryResult[]> {
  const { topK = 5, source, platform, ollamaUrl } = options;

  const queryEmbedding = await generateEmbedding(query, ollamaUrl);
  if (queryEmbedding.length === 0) return [];

  return vectorStore.query(queryEmbedding, topK, { source, platform });
}

/**
 * Build RAG context for AI prompt augmentation
 * Returns a formatted context string to prepend to the system prompt
 */
export async function buildRAGContext(
  query: string,
  options: {
    topK?: number;
    source?: string;
    platform?: string;
    ollamaUrl?: string;
    minScore?: number;
  } = {}
): Promise<string> {
  const { minScore = 0.3, ...queryOptions } = options;
  const results = await queryRAG(query, queryOptions);

  const relevant = results.filter((r) => r.score >= minScore);
  if (relevant.length === 0) return "";

  const contextParts = relevant.map((r, i) => {
    const meta = r.document.metadata;
    const sourceLabel = meta.source === "successful_post"
      ? `Successful ${meta.platform || ""} post`
      : meta.source === "brand_guide"
      ? "Brand guideline"
      : "Best practice";
    return `[${sourceLabel}] ${r.document.content}`;
  });

  return `\n\n--- Relevant Context ---\n${contextParts.join("\n\n")}\n--- End Context ---\n`;
}

/**
 * Get store statistics
 */
export function getRAGStats() {
  const docs = vectorStore.getAll();
  const sources = docs.reduce((acc, d) => {
    acc[d.metadata.source] = (acc[d.metadata.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalDocuments: vectorStore.size(),
    bySource: sources,
  };
}

/**
 * Clear the vector store
 */
export function clearRAGStore() {
  vectorStore.clear();
}
