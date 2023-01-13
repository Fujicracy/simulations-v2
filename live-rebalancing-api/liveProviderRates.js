const axios = require('axios');
var ethers = require('ethers');

const pools = require('./pools.js');

module.exports = class liveProviderRates {
    constructor() {
      this.pools = pools;
    }

    async getLiveSupplyRates() {
      /*
        Example of array element of API response of endpoint 'pools':
        {
          "chain": "Polygon",
          "project": "aave-v3",
          "symbol": "MAI",
          "tvlUsd": 127118,
          "apyBase": 2.17788,
          "apyReward": null,
          "apy": 2.17788,
          "rewardTokens": null,
          "pool": "1a8a5716-bb77-4baf-a2d9-ba3bebc6652a",
          "apyPct1D": 0.07213,
          "apyPct7D": 0.01846,
          "apyPct30D": 0.16991,
          "stablecoin": true,
          "ilRisk": "no",
          "exposure": "single",
          "predictions": {
            "predictedClass": "Stable/Up",
            "predictedProbability": 60,
            "binnedConfidence": 1
        },
      */
      let url = 'https://yields.llama.fi/pools';
      let response = axios.get(url);
      
      return response
    }

    async getPoolProjectDictionary() {
      let poolProjectDict = {};

      let response = await this.getLiveSupplyRates();
      let responseData = response.data.data;

      for (let i = 0; i < responseData.length; i++) {
        poolProjectDict[responseData[i].pool] = responseData[i].project;
      }

      return poolProjectDict;
    }

    async formatLiveBorrowRates(response, chain, debtAsset) {
      let formattedResponse = {};
      let poolProjectDict = await this.getPoolProjectDictionary();
      let poolAddresses = Object.values(this.pools[chain][debtAsset]);
      
      for (let i = 0; i < response.data.length; i++) {
        if (!poolAddresses.includes(response.data[i].pool)) {
          response.data.splice(i, 1);
          i--;
        }
      }

      for (let i = 0; i < response.data.length; i++) {
        let projectName = poolProjectDict[response.data[i].pool];
        formattedResponse[projectName] = response.data[i];
      }

      return formattedResponse;
    }

    async getLiveBorrowRates(chain, debtAsset) {
      /* 
        Example of array eleement of API response endpoint 'lendBorrow':
        {
          pool: '1a8a5716-bb77-4baf-a2d9-ba3bebc6652a',
          apyBaseBorrow: 3.16454,
          apyRewardBorrow: null,
          totalSupplyUsd: 484601,
          totalBorrowUsd: 349472,
          debtCeilingUsd: null,
          ltv: 0.75,
          borrowable: true,
          mintedCoin: null,
          rewardTokens: null,
          underlyingTokens: [ '0xa3fa99a148fa48d14ed51d610c367c61876997f1' ]
        },
      */
      let url = 'https://yields.llama.fi/lendBorrow';
      let response = await axios.get(url);
      
      // link Defi Llama pool addresses to project names
      let formattedResponse = await this.formatLiveBorrowRates(response, chain, debtAsset);

      // TODO: add conversion rate of debtAsset to USD
      return formattedResponse;
    }
}