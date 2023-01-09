const axios = require('axios');
// const pools = require('./Pools.js');

module.exports = class liveProviderRates {
    getLiveBorrowRates() {
      let url = 'https://yields.llama.fi/lendBorrow';
      let response = axios.get(url);
      
      return response
    }

    getLiveSupplyRates() {
      let url = 'https://yields.llama.fi/pools';
      let response = axios.get(url);
      
      return response
    }
}