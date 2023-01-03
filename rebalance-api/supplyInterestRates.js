const axios = require('axios');
const pools = require('./Pools.js');

module.exports = class supplyInterestRates {
    constructor(collateralAsset, borrowedAsset, lendingProviders) {
      this.collateralAsset = collateralAsset;
      this.borrowedAsset = borrowedAsset;
      this.lendingProviders = lendingProviders;
      this.firstCommonDate;
      this.chain = 'Mainnet';
      this.pools = pools;
    }
  
    formatApiRequest(data) {
      let formattedData = [];
      for (let i = 0; i < data.length; i++) {
        let formattedDataPoint = {};
  
        if (data[i]['apyBaseBorrow'] == null) {
          continue;
        }
  
        formattedDataPoint['timestamp'] = data[i].timestamp;
        formattedDataPoint['apyBaseBorrow'] = data[i].apyBaseBorrow;
        formattedDataPoint['apyReward'] = data[i].apyReward;
        formattedDataPoint['totalSupplyUsd'] = data[i].totalSupplyUsd;
        formattedDataPoint['totalBorrowUsd'] = data[i].totalBorrowUsd;
  
        formattedData.push(formattedDataPoint);
      }
      return formattedData;
    }
  
    timestampToDate(timestamp) {
      let date = new Date(timestamp.split('T')[0]);
      return date;
    }
  
    isSameDay(timestamp1, timestamp2) {
      // if type is string, convert to date
      if (typeof timestamp1 == 'string') {
        timestamp1 = this.timestampToDate(timestamp1);
        timestamp2 = this.timestampToDate(timestamp2);
      }
  
      return timestamp1.getFullYear() === timestamp2.getFullYear() &&
        timestamp1.getMonth() === timestamp2.getMonth() &&
        timestamp1.getDate() === timestamp2.getDate();
    }
  
    getLiveData() {
      let url = 'https://yields.llama.fi/lendBorrow';
      let response = axios.get(url);
  
      return response
    }
  
    async getHistoricData(poolAddress) {
      let url = `https://yields.llama.fi/chartLendBorrow/${poolAddress}`;
      let response = await axios.get(url);
      response = this.formatApiRequest(response.data.data);
  
      return response;
    }
  
    syncProviderData(allProviderData) {
      // Let all provider data start on the same date
      let syncProviderData = {};
      for (let provider in allProviderData) {
        let providerData = allProviderData[provider];
        let splitOn = 0;
        for (let i = 0; i < providerData.length; i++) {
          let date = this.timestampToDate(providerData[i]['timestamp']);
          if (this.isSameDay(date, this.firstCommonDate)) {
            splitOn = i;
            break;
          }
        }
        syncProviderData[provider] = providerData.slice(splitOn);
      }
      return syncProviderData;
    }
  
    async getAllProviderData() {
      let firstDateArray = [];
      let allProviderData = {};
      for (let i = 0; i < this.lendingProviders.length; i++) {
        let provider = this.lendingProviders[i];
        let providerData = await this.getHistoricData(this.pools[this.chain][this.borrowedAsset][provider]);
  
        allProviderData[provider] = providerData;
  
        let firstDate = this.timestampToDate(providerData[0]['timestamp']);
        firstDateArray.push(firstDate);
      }
  
      this.firstCommonDate = new Date(Math.max.apply(null, firstDateArray));
      allProviderData = this.syncProviderData(allProviderData);
  
      return allProviderData
    }
  
    async formatProviderData(allProviderData) {
      let formattedData = {};
  
      for (let i = 0; i < allProviderData[this.lendingProviders[0]].length; i++) {
        let date = this.timestampToDate(allProviderData[this.lendingProviders[0]][i].timestamp);
        formattedData[date] = {};
  
        for (let j = 0; j < this.lendingProviders.length; j++) {
          let lendingProvider = this.lendingProviders[j];
  
          formattedData[date][lendingProvider] = {};
  
          formattedData[date][lendingProvider]['apyBaseBorrow'] =
            allProviderData[lendingProvider][i].apyBaseBorrow;
          formattedData[date][lendingProvider]['apySlippage'] = 0;
  
          formattedData[date][lendingProvider]['totalBorrowUsd'] =
            allProviderData[lendingProvider][i].totalBorrowUsd;
          formattedData[date][lendingProvider]['simVaultBorrow'] = 0;
        }
      }
  
      return formattedData;
    }
}