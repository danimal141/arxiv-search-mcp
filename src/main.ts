/**
 * arXiv Search MCP Server
 */
import { FastMCP } from "fastmcp";
import { z } from "zod";
import { DOMParser, Element } from "deno_dom";

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
function parseArxivEntry(entry: Element): ArxivEntry {
  const getTextContent = (selector: string): string => {
    const element = entry.querySelector(selector);
    return element?.textContent?.trim() ?? "";
  };

  const authorElements = Array.from(entry.querySelectorAll("author name"));
  const authors = authorElements
    .map((element) => (element as Element).textContent?.trim() ?? "")
    .filter((name) => name !== "")
    .join(", ");

  return {
    title: getTextContent("title"),
    authors,
    summary: getTextContent("summary"),
    link: getTextContent("id"),
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
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      if (!xmlDoc) {
        throw new Error("Failed to parse XML response");
      }

      // Parse entries
      const entries = Array.from(xmlDoc.querySelectorAll("entry"))
        .map((entry) => parseArxivEntry(entry as Element));

      if (entries.length === 0) {
        return "No papers found for the specified category.";
      }

      // Format results
      const formattedPapers = entries.map((paper) =>
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
