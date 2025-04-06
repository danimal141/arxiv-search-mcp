/**
 * Unit tests for arXiv Search MCP Server
 */
import { assertEquals, assertMatch } from "https://deno.land/std@0.208.0/testing/asserts.ts";

import {
  parseArxivEntry,
  SearchArxivParamsZod,
  search_arxiv_execute,
  type XMLFeedEntry,
} from "./main.ts";

// Testing utilities
const mockXMLFeedEntry: XMLFeedEntry = {
  title: "Test Paper Title",
  author: [
    { name: "John Doe" },
    { name: "Jane Smith" },
  ],
  summary: "This is a test paper summary",
  id: "https://arxiv.org/abs/test.123",
};

const mockXMLFeedSingleAuthor: XMLFeedEntry = {
  title: "Single Author Paper",
  author: { name: "Solo Author" },
  summary: "Paper with single author",
  id: "https://arxiv.org/abs/test.456",
};

Deno.test("parseArxivEntry handles multiple authors correctly", () => {
  const result = parseArxivEntry(mockXMLFeedEntry);
  assertEquals(result, {
    title: "Test Paper Title",
    authors: "John Doe, Jane Smith",
    summary: "This is a test paper summary",
    link: "https://arxiv.org/abs/test.123",
  });
});

Deno.test("parseArxivEntry handles single author correctly", () => {
  const result = parseArxivEntry(mockXMLFeedSingleAuthor);
  assertEquals(result, {
    title: "Single Author Paper",
    authors: "Solo Author",
    summary: "Paper with single author",
    link: "https://arxiv.org/abs/test.456",
  });
});

Deno.test("SearchArxivParamsZod validates category correctly", () => {
  const validResult = SearchArxivParamsZod.safeParse({
    category: "cs.AI",
    max_results: 5,
  });
  assertEquals(validResult.success, true);
});

Deno.test("SearchArxivParamsZod validates max_results range", () => {
  // Test minimum value
  const tooSmall = SearchArxivParamsZod.safeParse({
    category: "cs.AI",
    max_results: 0,
  });
  assertEquals(tooSmall.success, false);

  // Test maximum value
  const tooLarge = SearchArxivParamsZod.safeParse({
    category: "cs.AI",
    max_results: 101,
  });
  assertEquals(tooLarge.success, false);

  // Test valid range
  const validRange = SearchArxivParamsZod.safeParse({
    category: "cs.AI",
    max_results: 100,
  });
  assertEquals(validRange.success, true);
});

Deno.test("SearchArxivParamsZod provides default max_results", () => {
  const result = SearchArxivParamsZod.parse({
    category: "cs.AI",
  });
  assertEquals(result.max_results, 5);
});

// Integration test with mocked fetch
Deno.test("search_arxiv tool handles API errors gracefully", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Network error");
  };

  try {
    const result = await search_arxiv_execute({
      category: "cs.AI",
      max_results: 5,
    });
    assertMatch(result as string, /Error during search: Network error/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
