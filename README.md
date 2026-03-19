# Build an AI Agent with a Wallet in 5 Minutes

<a href="https://glama.ai/mcp/servers/@azeth-protocol/mcp-azeth">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@azeth-protocol/mcp-azeth/badge" />
</a>

[![npm](https://img.shields.io/npm/v/@azeth/mcp-server)](https://www.npmjs.com/package/@azeth/mcp-server)
[![npm](https://img.shields.io/npm/v/@azeth/sdk)](https://www.npmjs.com/package/@azeth/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A template for building AI agents with non-custodial smart accounts, x402 payments, on-chain reputation, and service discovery. Built on [Azeth](https://azeth.ai) trust infrastructure.

## Quick Start

```bash
# Use this template on GitHub, then:
git clone https://github.com/YOUR_USERNAME/YOUR_AGENT.git
cd YOUR_AGENT
cp .env.example .env
# Edit .env with your private key
npm install
npm run dev:client    # Run the agent client
npm run dev:server    # Run the service provider
```

## What's Inside

| File | What it does |
|------|-------------|
| `src/client.ts` | **Agent consumer** — discovers services, checks reputation, pays via x402, rates providers |
| `src/server.ts` | **Service provider** — creates smart account, registers on trust registry, serves x402-gated API |
| `.claude/settings.json` | Pre-configured Azeth MCP server for Claude Code / Claude Desktop |

## Architecture: Client vs Provider

### Agent Consumer (`src/client.ts`)

The consumer agent discovers and pays for services:

```
Create Account → Discover Services → Check Reputation → Pay via x402 → Rate Provider
```

### Service Provider (`src/server.ts`)

The provider serves data behind an x402 paywall:

```
Create Smart Account → Register on Trust Registry → Start x402 Server → Earn Reputation
```

### Why Providers Need Smart Accounts

**This is critical.** A provider using a plain EOA wallet can receive payments, but:
- Other agents **cannot rate them** on the trust registry
- They **don't appear** in service discovery
- They have **no on-chain reputation** — agents won't trust them
- There are **no guardian guardrails** protecting their funds

A provider with an Azeth smart account gets:
- An **ERC-8004 trust registry entry** — discoverable by any agent
- **On-chain reputation** — weighted scores from agents who paid them
- **Guardian guardrails** — spending limits, token whitelists, emergency withdrawal
- **Payment agreements** — recurring subscriptions from consumer agents

**Rule: If you want to be discovered and trusted, you need a smart account.**

## Environment Variables

```bash
# Required
AZETH_PRIVATE_KEY=0x...          # Owner private key (controls smart account)

# Optional
AZETH_CHAIN=baseSepolia          # baseSepolia (default) | base | ethereumSepolia | ethereum
AZETH_RPC_URL=                   # Custom RPC (uses public default if empty)
AZETH_GUARDIAN_KEY=0x...         # Guardian co-signing key (for extra security)
AZETH_GUARDIAN_AUTO_SIGN=true    # Auto-approve guardian requests
X402_PAY_TO=0x...               # Payment recipient (defaults to smart account)
```

## Use with Claude

This template includes a pre-configured `.claude/settings.json`. Just add your private key:

```bash
# In Claude Code
echo '{ "AZETH_PRIVATE_KEY": "0x..." }' > .env
# Now Claude has access to 32 Azeth tools
```

Ask Claude: *"Create me a smart account and register as a weather data service"*

## Links

- [MCP Server](https://www.npmjs.com/package/@azeth/mcp-server) — 32 tools for AI agents
- [SDK](https://www.npmjs.com/package/@azeth/sdk) — TypeScript SDK
- [Provider](https://www.npmjs.com/package/@azeth/provider) — x402 middleware for Hono
- [Website](https://azeth.ai)
- [GitHub](https://github.com/azeth-protocol)

## License

MIT
