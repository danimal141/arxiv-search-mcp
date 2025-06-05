[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/danimal141-arxiv-search-mcp-badge.png)](https://mseep.ai/app/danimal141-arxiv-search-mcp)

# arXiv Search MCP Server

An MCP server that provides tools to search and fetch papers from arXiv.org.

## Features

- Search papers by category
- Get latest papers sorted by submission date
- Formatted output with title, authors, summary, and link

## Development

### Prerequisites

- [Deno](https://deno.land/) installed on your system
- MCP compatible environment

### Setup

1. Clone the repository
2. Install dependencies:
```bash
deno cache --reload src/main.ts
```

### Running the Server

Development mode with file watching:
```bash
deno task dev
```

Build executable:
```bash
deno task compile
```

## Integration with Claude Desktop

Add the following configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "arxiv-search-mcp": {
      "command": "/path/to/dir/arxiv-search-mcp/bin/arxiv-search-mcp"
    }
  }
}
```

Replace `/path/to/dir` with the actual path to your compiled binary.

## Usage

Example usage screenshot:
![Sample usage with Claude](images/sample_use.png)

The server provides a tool named `search_arxiv` that accepts the following parameters:

```typescript
{
  "category": string,    // arXiv category (e.g., cs.AI, cs.LG, astro-ph)
  "max_results": number  // Number of papers to fetch (1-100, default: 5)
}
```

### Example

Request:
```json
{
  "category": "cs.AI",
  "max_results": 5
}
```

This will return the 5 most recent papers from the Artificial Intelligence category.

### Available Categories

Some popular arXiv categories:

- `cs.AI`: Artificial Intelligence
- `cs.LG`: Machine Learning
- `cs.CL`: Computation and Language
- `cs.CV`: Computer Vision
- `cs.NE`: Neural and Evolutionary Computing
- `cs.RO`: Robotics
- `astro-ph`: Astrophysics
- `physics`: Physics
- `math`: Mathematics
- `q-bio`: Quantitative Biology

For a complete list of categories, visit [arXiv taxonomy](https://arxiv.org/category_taxonomy).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
