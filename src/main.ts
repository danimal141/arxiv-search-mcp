/**
 * arXiv Search MCP Server
 */
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { XMLParser } from "fast-xml-parser";

// Type definitions for XML parsing
interface XMLFeedEntry {
  title: string;
  author: { name: string }[] | { name: string };
  summary: string;
  id: string;
}

interface XMLResponse {
  feed: {
    entry: XMLFeedEntry[];
  };
}

// Constants
const ARXIV_API_BASE = "https://export.arxiv.org/api/query?";
const USER_AGENT = "arxiv-mcp/1.0";

// Schema definition
const SearchArxivParamsZod = z.object({
  category: z.string().describe("arXiv category (e.g., cs.LG, astro-ph)"),
  max_results: z.number().min(1).max(100).default(5).describe(
    "Number of papers to fetch (1-100)",
  ),
});

interface ArxivEntry {
  title: string;
  authors: string;
  summary: string;
  link: string;
}

// Helper function for parsing XML entries
function parseArxivEntry(entry: XMLFeedEntry): ArxivEntry {
  const authors = Array.isArray(entry.author)
    ? entry.author.map((a) => a.name).join(", ")
    : entry.author.name;

  return {
    title: entry.title,
    authors,
    summary: entry.summary,
    link: entry.id,
  };
}

const server = new FastMCP({
  name: "arXiv-Search",
  version: "1.0.0",
});

server.addTool({
  name: "search_arxiv",
  description: "Search latest papers from a specific arXiv category",
  parameters: SearchArxivParamsZod,
  execute: async (args) => {
    try {
      // Build API request
      const query = new URLSearchParams({
        search_query: `cat:${args.category}`,
        sortBy: "submittedDate",
        sortOrder: "descending",
        max_results: args.max_results.toString(),
      });

      const response = await fetch(`${ARXIV_API_BASE}${query}`, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "application/xml",
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const xmlText = await response.text();
      // Debug output
      console.error("Raw XML:", xmlText);

      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      });
      const xmlDoc = parser.parse(xmlText) as XMLResponse;

      // Debug output
      console.error("Parsed XML:", JSON.stringify(xmlDoc, null, 2));

      if (!xmlDoc || !xmlDoc.feed) {
        throw new Error("Failed to parse XML response");
      }

      // Parse entries
      const entries = Array.isArray(xmlDoc.feed.entry)
        ? xmlDoc.feed.entry.map(parseArxivEntry)
        : xmlDoc.feed.entry
        ? [parseArxivEntry(xmlDoc.feed.entry)]
        : [];

      if (entries.length === 0) {
        return "No papers found for the specified category.";
      }

      // Format results
      const formattedPapers = entries.map((paper: ArxivEntry) =>
        `Title: ${paper.title}\nAuthors: ${paper.authors}\nSummary: ${paper.summary}\nLink: ${paper.link}`
      );

      return formattedPapers.join("\n\n---\n\n");
    } catch (error: unknown) {
      console.error("Error in search_arxiv:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "An unknown error occurred";
      return `Error during search: ${errorMessage}`;
    }
  },
});

server.start({
  transportType: "stdio",
});
