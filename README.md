# 🚜 Back testing Rebalancing strategies

## Objective

Be able to test and validate in a continuous way that rebalancing strategies can minimize borrowing costs or maximize yield versus other protocols.

## Getting started 

### Requirements

The requirements to run the Benchmark and Simulated vault scripts
- Install Node.js
- Install Axios: https://github.com/axios/axios/#Installing

### Benchmarks: Aave V2

- aave-v2-api.js

Performs a calculation of total interest a user pays for using the Aave V2 as lending provider to borrow "borrowedAmount" from "startDate" to "endDate".

You can vary these input variables to your preference and run: \
    ``node aave-v2-api.js``

It uses the Aave-V2 Data API as data source directly, this makes it a useful benchmark. We can compare results when using other aggregate data sources.

- aave-v2-test-cases.md

To test the accuracy of the above interest calculator for Aave V2, we compare the simulated amount with actual on-chain user sessions of the Aave V2 protocol. 

### Simulated Vault:

- simulated-borrowing-vault-v0.js

Prototype rebalance strategy to lower total interest paid on borrow position ("debtAmount"): switch to the lowest lending provider with the lowest APY. It only consider two providers, "lendingProvider1" and "lendingProvider2". Ignores slippage. Changes provider if APY is at least 0.5% cheaper.

Starts when API has data for both providers, ends at run date. To test, run: \
    ``node simulated-borrowing-vault-v0.js``

- simulated-borrowing-vault-v1.js

Prototype that adds a linear slippage model to V0. 

Default settings:
    borrowedAsset = 'USDC';
    lendingProviders = ['aavev2', 'compound'];
    Vault that manages: debtAmount = 400000

Test by running: \
    ``node simulated-borrowing-vault-v1.js``

### Simulation App

This is a React app built in Replit. 

You can run the react app yourself or go to:
https://simulate-loan.ben132333.repl.co/

## Data Sources

### DefiLlama Borrowing Interest Rates

Needed: borrow Interest rate or APR at given time intervals for the intended lending providers for intended assets.

We use DefiLlama's API to get historical data of their Yields Borrow dashboard: https://defillama.com/yields/borrow

- Get live data via API endpoint: https://yields.llama.fi/lendBorrow

- Get historic data:
1) Pick lending pool and get pool address via API endpoint: https://yields.llama.fi/pools
2) To get historic data, request: https://yields.llama.fi/chartLendBorrow/${poolAddress}

Here are the general API docs: https://defillama.com/docs/api

## Rebalance simulation API

The API simulates the total interest paid by a user, over a period from startDate to endDate, given collateral and debt assets, and selected lending providers.

See instructions in directory to host on Google Cloud or locally to modify.


