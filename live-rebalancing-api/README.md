# Live Rebalancing

## Introduction

This API monitors the live interest rate data from Defi Llama. It compares that data with the rates of the current provders used by a vault. 

From this it decides if a rebalancing is needed. In case it is, it returns how much should be transferred from one provider to a new one. 

It uses a linear slippage model to cap max transfer amounts: the slippage caused by the transaction and the difference in provider rates need to pass a chosen treshold. 

### Code overview

- app.js: this is the API, using the hapi framework.
- liveRebalance.js: liveRebalance is the main class. It contains the decision making logic.
- liveRebalance is build using two main classes, which each represent a different data source
    - liveProviderRates.js: this gets live data from DefiLlama and processes it.
    - readVaultContract.js: uses Ethers.js to read the vault contract and the contracts of the lending providers
- Mapping dictionaries to stich together these two data soruces: pools.js, addressCoinToname.js, and providerAddressName.js

Note: create an app-env file with the API Keys for the Ethers.js getDefaultProvider() method.

### Using new vault addresses

When you want to use a new vaultAddress, check if the mapping dicts are ready to process them: pools.js, addressCoinToname.js, and providerAddressName.js.

The DefiLlama API and the data read from the smart contracts might have slightly different names, 'aavev3' vs 'AAVE_V3' for example. 

Checks:
- The debtAsset read from the vault contract, returns an address. Add that address to the addressToCoinName.js mapping. The key is the address; the value is the coin name exactly as it's used in DeFiLlama.
- pool.js lists the lending providers that are considered for a given chain and asset. Make sure chain the vault is on and the asset it manages are in pools. If a provider is missing in pools, add the DeFi Llama pool address. 
- To compare the lending provider addresses the live interest rates, make sure the provider address is mapped to the 'project' name in Defi Llama.

## API deployment guide

### Localhost

From this directory, simply run:  
``node app.js``

This will return where the server is running:  
``Server running on http://0.0.0.0:51074``

Then you can call the API from localhost (adjust the port number if needed) . Example query:  
``curl -X 'GET' 'http://0.0.0.0:51074/chain=goerli&tresholdInterestRate=0.5&vaultAddress=0xD08b093b4804DEC9af22f70Bc35E8e132106B5C2'``  

This will return:  
``{"rebalance":true,"toProvider":"euler","fromProvider":"aave-v2","fromProviderAddress":"0xbE55f76cC3f4409C320c8F8D5AF1220c914F7B54","debtAsset":"0x918Cfff6AB82f5a28623b08Babd2893963A27AAC","debtAssetName":"DAI","transferAmount":8015}``

### Hosting for production

We build a container image from the API. Goodle Cloud Run allows us to run containers directly on top its infrastructure. Its scalability and security are key features.

To build the container and deploy it on Cloud Run, run this command from the source code directory:  
``gcloud run deploy``

This will return the service URL.

In case of problems, this quickstart is a good guide: https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service

To debug deployment issues, build and run the container locally. Here is a good guide: https://docs.docker.com/get-started/02_our_app/



Create a app-env file locally with the API key for readVaultContract

