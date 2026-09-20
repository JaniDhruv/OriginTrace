# OriginTrace - Content Provenance Agent

> Built for the [Sanity Challenge](https://dev.to/challenges/sanity-2026-09-16) (Path One: Ship an Agent That Queries Real Content)

OriginTrace starts from a user's original DEV.to post URL, searches the web for duplicates and republishes, checks whether each repost includes the original author name and original post link, then uses Sanity-backed reconciliation to estimate duplicated content and draft a DMCA complaint template for unattributed copies.

## How It Works

1. Paste the original DEV.to post URL.
2. OriginTrace fetches the post and stores it as the canonical source in Sanity when credentials are available.
3. The agent extracts distinctive phrases and searches the web with Serper/Google.
4. Candidate reposts are fetched, cleaned, and compared against the original content.
5. Results show duplicated-content percentage, author-name attribution, original-link attribution, matched passages, and a DMCA complaint template for missing-attribution reposts.

## Quick Start

### Prerequisites

- Node.js 18+
- A Sanity account
- A Serper.dev API key for web search

### Setup

```bash
# Clone
git clone https://github.com/JaniDhruv/OriginTrace.git
cd OriginTrace

# Install
npm install

# Configure
cp .env.example .env.local
# Fill in your Sanity project ID, dataset, API token, and SERPER_API_KEY

# Optional: seed an existing DEV.to portfolio
DEVTO_HANDLE=yourhandle npm run seed

# Run
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Your Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Dataset name (default: `production`) |
| `SANITY_API_TOKEN` | Yes | Sanity API token with write access |
| `SERPER_API_KEY` | Yes | Serper.dev API key for web search |
| `SANITY_CONTEXT_API_TOKEN` | No | Org-level token for Context MCP |
| `SANITY_MCP_ENDPOINT` | No | Sanity Context MCP endpoint URL |
| `DEVTO_HANDLE` | No | DEV.to username for optional seeding |

## Architecture

```text
DEV.to URL -> fetch original -> search web -> fetch candidate pages ->
Sanity-backed overlap reconciliation -> attribution evidence -> DMCA template
```

Tech stack: Next.js App Router, Sanity Content Lake, Readability, Cheerio, Serper web search, vanilla CSS.

## License

MIT
