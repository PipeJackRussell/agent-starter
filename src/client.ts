/**
 * Agent Consumer — discovers services, pays via x402, rates providers.
 *
 * This is the "buyer" side of the machine economy. The agent:
 * 1. Creates a smart account (if none exists)
 * 2. Discovers services by capability
 * 3. Checks provider reputation before trusting
 * 4. Pays for a service via x402
 * 5. Rates the provider on-chain after receiving the response
 */

import 'dotenv/config';
import { AzethKit } from '@azeth/sdk';

async function main() {
  const privateKey = process.env['AZETH_PRIVATE_KEY'];
  if (!privateKey) {
    console.error('Set AZETH_PRIVATE_KEY in .env');
    process.exit(1);
  }

  const chain = (process.env['AZETH_CHAIN'] ?? 'baseSepolia') as 'baseSepolia' | 'base';

  console.log('--- Agent Consumer ---\n');

  // 1. Create SDK instance
  const agent = await AzethKit.create({
    privateKey: privateKey as `0x${string}`,
    chain,
    rpcUrl: process.env['AZETH_RPC_URL'],
  });

  console.log(`EOA: ${agent.address}`);

  // 2. Ensure we have a smart account
  const accounts = await agent.getSmartAccounts();
  if (accounts.length === 0) {
    console.log('No smart account found. Creating one...');
    await agent.createAccount({
      name: 'DataAnalyst',
      entityType: 'agent',
      description: 'Consumes data services and builds analytics',
    });
    console.log(`Smart account created: ${agent.smartAccount}`);
  } else {
    console.log(`Smart account: ${accounts[0]}`);
  }

  // 3. Discover services by capability
  console.log('\nDiscovering services with capability "weather-data"...');
  const services = await agent.discoverServices({ capability: 'weather-data' });

  if (services.length === 0) {
    console.log('No services found. Run the provider first: npm run dev:server');
    return;
  }

  const service = services[0]!;
  console.log(`Found: ${service.name} (tokenId: ${service.tokenId})`);
  console.log(`  Endpoint: ${service.endpoint}`);

  // 4. Check reputation before trusting
  console.log('\nChecking provider reputation...');
  const reputation = await agent.getWeightedReputation(service.tokenId);
  console.log(`  Score: ${reputation.compositeScore}/100`);
  console.log(`  Interactions: ${reputation.totalInteractions}`);

  // 5. Pay for the service via x402
  console.log('\nPaying for weather data via x402...');
  const startTime = Date.now();
  const result = await agent.pay(`${service.endpoint}/api/weather/london`);
  const responseTimeMs = Date.now() - startTime;
  console.log(`  Response: ${JSON.stringify(result.data)}`);
  console.log(`  Response time: ${responseTimeMs}ms`);

  // 6. Rate the provider on-chain
  console.log('\nRating provider on-chain...');
  await agent.submitOpinion({
    serviceTokenId: service.tokenId,
    success: true,
    responseTimeMs,
    qualityScore: 85,
  });
  console.log('  Opinion submitted! Provider reputation updated.');

  console.log('\n--- Complete ---');
  console.log('The provider now has a better reputation score.');
  console.log('Other agents will discover them higher in search results.');
}

main().catch(console.error);
