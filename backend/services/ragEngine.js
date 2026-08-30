const fs = require("fs");
const path = require("path");

class RAGEngine {
  constructor() {
    this.chunks = [];
    this.summaryInfo = {};
    this.isLoaded = false;
    this.initKnowledgeBase();
  }

  initKnowledgeBase() {
    try {
      const textPath = path.resolve(__dirname, "../rag_knowledge.txt");
      let fullText = "";

      if (fs.existsSync(textPath)) {
        fullText = fs.readFileSync(textPath, "utf-8");
      } else {
        // Fallback if file not yet generated
        fullText = "FocusGuard AI — RAG Knowledge Base. Dataset: 1057 activity records | Productive: 703 | Non-Productive: 354";
      }

      this.parseAndChunk(fullText);
      this.isLoaded = true;
      console.log(`[RAGEngine] Successfully indexed ${this.chunks.length} knowledge chunks from FocusGuard_RAG_Knowledge_Base.pdf`);
    } catch (err) {
      console.error("[RAGEngine] Error loading knowledge base:", err);
    }
  }

  parseAndChunk(text) {
    this.chunks = [];

    // Chunk 1: Overview & Guidelines
    this.chunks.push({
      id: "overview_rules",
      title: "Knowledge Base Overview & Productivity Interpretation",
      content:
        "FocusGuard AI — RAG Knowledge Base.\n" +
        "Dataset contains 1057 activity records (Productive: 703, Non-Productive: 354, Other/Neutral: 0).\n" +
        "productivity_status is the primary label.\n" +
        "Productive activities include: Coding, Learning, Research, Office work.\n" +
        "Non-Productive activities include: Social Media, Entertainment, Communication.\n" +
        "Classifications must be strictly derived from this official dataset.",
      keywords: ["overview", "dataset", "productive", "non-productive", "rules", "interpret", "status", "1057", "703", "354"],
    });

    // Chunk 2: Category Summary Table
    this.chunks.push({
      id: "category_summary",
      title: "Category Breakdown & Record Counts",
      content:
        "CATEGORY SUMMARY TABLE:\n" +
        "• Coding: Productive (264 records)\n" +
        "• Social Media: Non-Productive (177 records)\n" +
        "• Office: Productive (176 records)\n" +
        "• Research: Productive (175 records)\n" +
        "• Communication: Non-Productive (89 records)\n" +
        "• Entertainment: Non-Productive (88 records)\n" +
        "• Learning: Productive (88 records)\n" +
        "Total Productive Categories: Coding (264), Office (176), Research (175), Learning (88) = 703 records.\n" +
        "Total Non-Productive Categories: Social Media (177), Communication (89), Entertainment (88) = 354 records.",
      keywords: ["category", "coding", "social media", "office", "research", "communication", "entertainment", "learning", "264", "177", "176", "175", "89", "88"],
    });

    // Chunk 3: Domain / Website Classification Table
    this.chunks.push({
      id: "domain_summary",
      title: "Domain & Website Classification Summary",
      content:
        "WEBSITE & DOMAIN SUMMARY TABLE:\n" +
        "• facebook.com: Non-Productive (89 records) - Social Media\n" +
        "• chat.openai.com: Productive (88 records) - Research / AI Assistant\n" +
        "• codechef.com: Productive (88 records) - Coding / Problem Solving\n" +
        "• github.com: Productive (88 records) - Coding / Version Control\n" +
        "• linkedin.com: Productive (88 records) - Professional Networking\n" +
        "• twitter.com: Non-Productive (88 records) - Social Media\n" +
        "• udemy.com: Productive (88 records) - Learning / Online Courses\n" +
        "• stackoverflow.com: Productive (87 records) - Research / Programming Q&A",
      keywords: ["domain", "website", "facebook.com", "chat.openai.com", "codechef.com", "github.com", "linkedin.com", "twitter.com", "udemy.com", "stackoverflow.com", "url"],
    });

    // Chunk 4: Split full text into 400-word granular paragraphs for deep record retrieval
    const lines = text.split("\n");
    let currentBlock = [];
    let blockIndex = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      currentBlock.push(line);

      if (currentBlock.length >= 25 || i === lines.length - 1) {
        const chunkText = currentBlock.join("\n");
        const words = chunkText.toLowerCase().match(/\b[a-z0-9_\-\.]{3,}\b/g) || [];
        this.chunks.push({
          id: `record_block_${blockIndex++}`,
          title: `Activity Logs Source Records (Block ${blockIndex - 1})`,
          content: chunkText,
          keywords: Array.from(new Set(words)),
        });
        currentBlock = [];
      }
    }
  }

  retrieveContext(query, topK = 4) {
    if (!query) return "";

    const queryTokens = query.toLowerCase().match(/\b[a-z0-9_\-\.]{2,}\b/g) || [];
    if (queryTokens.length === 0) return "";

    // Score chunks by token match frequency + exact phrase matching
    const scored = this.chunks.map((chunk) => {
      let score = 0;
      const contentLower = chunk.content.toLowerCase();

      for (const token of queryTokens) {
        if (chunk.keywords && chunk.keywords.includes(token)) {
          score += 3;
        }
        if (contentLower.includes(token)) {
          score += 1;
        }
      }

      // Bonus for exact multi-word query substrings
      if (query.length > 5 && contentLower.includes(query.toLowerCase())) {
        score += 10;
      }

      return { chunk, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const selected = scored.slice(0, topK).filter((s) => s.score > 0).map((s) => s.chunk);

    // If no specific match, provide overview and domain summary
    if (selected.length === 0) {
      return this.chunks.slice(0, 3).map((c) => `### ${c.title}\n${c.content}`).join("\n\n");
    }

    return selected.map((c) => `### ${c.title}\n${c.content}`).join("\n\n");
  }
}

module.exports = new RAGEngine();
