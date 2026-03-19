/**
 * Service Provider — creates smart account, registers on trust registry, serves x402-gated API.
 *
 * CRITICAL: The provider MUST create an Azeth smart account, not just use an EOA.
 * Without a smart account + trust registry entry:
 *   - Other agents CANNOT rate this provider
 *   - This service will NOT appear in discovery results
 *   - There is NO on-chain reputation — agents won't trust it
 *
 * The smart account gives the provider:
 *   - An ERC-8004 trust registry entry (discoverable)
 *   - On-chain reputation scores (trustworthy)
 *   - Guardian guardrails (safe)
 *   - Payment agreement support (subscriptions)
 */

import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { AzethKit } from '@azeth/sdk';
import { createX402StackFromEnv, paymentMiddlewareFromHTTPServer } from '@azeth/provider';

const PORT = 3402; // A play on HTTP 402

async function main() {
  const privateKey = process.env['AZETH_PRIVATE_KEY'];
  if (!privateKey) {
    console.error('Set AZETH_PRIVATE_KEY in .env');
    process.exit(1);
  }

  const chain = (process.env['AZETH_CHAIN'] ?? 'baseSepolia') as 'baseSepolia' | 'base';

  console.log('--- Service Provider ---\n');

  // 1. Create SDK instance
  const agent = await AzethKit.create({
    privateKey: privateKey as `0x${string}`,
    chain,
    rpcUrl: process.env['AZETH_RPC_URL'],
  });

  console.log(`EOA: ${agent.address}`);

  // 2. Create smart account — THIS IS REQUIRED for reputation
  // Without this, you're just an EOA. No one can rate you, discover you, or trust you.
  const accounts = await agent.getSmartAccounts();
  if (accounts.length === 0) {
    console.log('Creating smart account + trust registry entry...');
    await agent.createAccount({
      name: 'WeatherOracle',
      entityType: 'service',
      description: 'Real-time weather data for AI agents',
    });
    console.log(`Smart account created: ${agent.smartAccount}`);
  } else {
    console.log(`Smart account: ${accounts[0]}`);
  }

  // 3. Publish service on trust registry so other agents can discover us
  console.log('\nPublishing service on trust registry...');
  const registration = await agent.publishService({
    capabilities: ['weather-data', 'climate-analysis'],
    endpoint: `http://localhost:${PORT}`,
  });
  console.log(`Registered! TokenId: ${registration.tokenId}`);
  console.log('Other agents can now discover this service via azeth_discover_services.');

  // 4. Set up x402 payment middleware
  const routes = {
    'GET /api/weather/:city': {
      price: '$0.001',
      network: 'base-sepolia',
      description: 'Weather data for a city',
    },
  };

  const x402 = createX402StackFromEnv(routes);

  // 5. Create Hono app with x402 paywall
  const app = new Hono();

  // Health check (free)
  app.get('/health', (c) => c.json({ status: 'ok', smartAccount: agent.smartAccount }));

  // Protected endpoint — requires x402 payment
  if (x402) {
    app.use('/api/*', paymentMiddlewareFromHTTPServer(x402.httpServer));
  }

  app.get('/api/weather/:city', (c) => {
    const city = c.req.param('city');
    return c.json({
      city,
      temperature: Math.round(15 + Math.random() * 15),
      humidity: Math.round(40 + Math.random() * 40),
      conditions: ['sunny', 'cloudy', 'rainy', 'windy'][Math.floor(Math.random() * 4)],
      timestamp: Math.floor(Date.now() / 1000),
      provider: 'WeatherOracle',
    });
  });

  // 6. Start server
  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`\nServer running on http://localhost:${PORT}`);
    console.log(`  Health: http://localhost:${PORT}/health`);
    console.log(`  Weather: http://localhost:${PORT}/api/weather/london (x402 paywall)`);
    console.log('\nWaiting for agent payments...');
  });
}

main().catch(console.error);
