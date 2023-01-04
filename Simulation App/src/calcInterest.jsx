import axios from "axios";
import { pools } from "./utils/Pools";

export class supplyInterestRates {
  constructor(collateralAsset, borrowedAsset, lendingProviders) {
    this.collateralAsset = collateralAsset;
    this.borrowedAsset = borrowedAsset;
    this.lendingProviders = lendingProviders;
    this.firstCommonDate;
    this.chain = 'Mainnet',
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

// export class simulaterebalancing {
//   constructor(borroowingVault, supplyInterestRates) {
//     this.borroowingVault = borroowingVault;
//     this.supplyInterestRates = supplyInterestRates;
//   }

// method to sort interest rates 

// method to decide rebalancing strategy: 0.5%
// 
// }

export class simulatedVault {
  constructor(collateralAsset, collateralAmount, debtAsset, debtAmount, lendingProviders) {
    this.collateralAsset = collateralAsset;
    this.collateralAmount = collateralAmount;
    this.debtAsset = debtAsset;
    this.debtAmount = debtAmount;
    this.lendingProviders = lendingProviders;
    this.providerDistribution = {};
    this.linearModelCoeff = 0.35;
  }

  initProviderDistribution() {
    for (let i = 0; i < this.lendingProviders.length; i++) {
      this.providerDistribution[this.lendingProviders[i]] = 0;
    }
  }

  // slippage model
  apySlippage(tvlProvider, transferAmount) {
    // if transferAmount is 1% of tvlProvider, then slippage is 0.35%
    let slippage = this.linearModelCoeff * transferAmount / tvlProvider;
    return slippage;
  }

  maxTransferAmount(tvlProvider, maxSlippage) {
    // Inversion of apySlippage equation
    let maxTransferAmount = maxSlippage * tvlProvider / this.linearModelCoeff;
    return maxTransferAmount;
  }

  providerDistrTotal() {
    let total = 0;
    for (let i = 0; i < this.lendingProviders.length; i++) {
      let provider = this.lendingProviders[i];
      total += this.providerDistribution[provider];
    }
    return total;
  }

  // transfer from one provider to another
  transferDebt(fromProvider, toProvider, transferAmount) {
    // transferAmount: percentage expressed from 0 to 1. Tansfers providerDistribution.
    // if (this.providerDistrTotal() == 1) {
    if (this.providerDistribution[fromProvider] < transferAmount) {
      transferAmount = this.providerDistribution[fromProvider];
    }
    this.providerDistribution[fromProvider] -= transferAmount;
    // }

    if (this.providerDistribution[toProvider] + transferAmount > 1) {
      transferAmount = 1 - this.providerDistribution[toProvider];
    }
    this.providerDistribution[toProvider] += transferAmount;

    // console.log('Transfer', transferAmount, 'from', fromProvider, 'to', toProvider);
  }

  initialize() {
    // initialize when vault is too big to to be distributed because of slippage.
    // currently not needed with 4e5 debtAmount
    for (let i = 0; i < this.lendingProviders.length; i++) {
      let provider = this.lendingProviders[i];

    }
  }
}


const apyHistory = {};

function getMinProviderApy(oneDayProviderApys) {
  let minProvider = {};

  for (let provider in oneDayProviderApys) {
    if (minProvider['apyBaseBorrow'] == undefined || oneDayProviderApys[provider]['apyBaseBorrow'] < minProvider['apyBaseBorrow']) {
      minProvider['apyBaseBorrow'] = oneDayProviderApys[provider]['apyBaseBorrow'];
      minProvider['totalBorrowUsd'] = oneDayProviderApys[provider]['totalBorrowUsd'];
      minProvider['provider'] = provider;
    }
  }

  return minProvider;
}

function calcAvgBorrowRate(data) {
  data = JSON.parse(data);
  let avgBorrowRate = 0;

  let lendingProviders = Object.keys(data['activeApy']);

  for (let i = 0; i < lendingProviders.length; i++) {
    let provider = lendingProviders[i];
    // add apySlippage to activeApy
    avgBorrowRate += data['activeProvider'][provider] * (data['activeApy'][provider] + data['apySlippage'][provider]);
  }

  return avgBorrowRate;
}

function totalInterestPaid(historicRates, debtAmount, startDate, endDate) {
  let accumulatedInterest = 0;
  let totalDayCount = 0;

  for (let date in historicRates) {
    let currentDate = new Date(date);
    if (startDate < currentDate && currentDate <= endDate) {
      totalDayCount += 1;
      accumulatedInterest += calcAvgBorrowRate(historicRates[date]) / 100;
    }
  }

  let totalInterestPaid = debtAmount * accumulatedInterest / 365;

  return {
    "totalInterestPaid": totalInterestPaid,
    "totalDayCount": totalDayCount
  }

}

export async function simRebalance(startDateInput, endDateInput, borrowingVault, ir) {
  // console.log(Object.keys(ir.pools));
  const allProviderData = await ir.getAllProviderData();
  const borrowAPYs = await ir.formatProviderData(allProviderData);
  // console.log('First common date all providers have API data:', ir.firstCommonDate);
  // console.log('All data:', borrowAPYs);
  Object.freeze(borrowAPYs);

  const startDate = new Date(startDateInput);
  const endDate = new Date(endDateInput);

  borrowingVault.initProviderDistribution();
  for (let date in borrowAPYs) {
    let minProvider = getMinProviderApy(borrowAPYs[date]);

    // initialize provider distribution
    if (borrowingVault.providerDistrTotal() < 1) {
      borrowingVault.providerDistribution[minProvider['provider']] = 1;
      // TODO: add slippage
    }

    for (let provider in borrowAPYs[date]) {
      if (minProvider['apyBaseBorrow'] < borrowAPYs[date][provider]['apyBaseBorrow'] - 0.5) {
        if (borrowingVault.providerDistribution[provider] == 0) {
          continue; // There is nothing to transfer
        }

        let percentageToTransfer = borrowingVault.providerDistribution[provider];
        let amountToTransfer = percentageToTransfer * borrowingVault.debtAmount; // does this need to be collateral amount? The debtAmount is among the users, the borrowing vault manages the collateral?

        let maxSlippage = borrowAPYs[date][provider]['apyBaseBorrow'] - minProvider['apyBaseBorrow'] - 0.5;
        let maxTransferAmount = borrowingVault.maxTransferAmount(minProvider['totalBorrowUsd'], maxSlippage);

        if (amountToTransfer > maxTransferAmount) {
          amountToTransfer = maxTransferAmount;
          percentageToTransfer = amountToTransfer / borrowingVault.debtAmount;
        }

        // How much slippage did the transaction cause? Calculate via apySlippage and add to borrowAPYs
        let apySlippage = borrowingVault.apySlippage(minProvider['totalBorrowUsd'], amountToTransfer);
        borrowAPYs[date][minProvider['provider']]['apySlippage'] = apySlippage;
        borrowAPYs[date][minProvider['provider']]['simVaultBorrow'] = amountToTransfer;

        borrowAPYs[date][provider]['apySlippage'] -= apySlippage;
        borrowAPYs[date][provider]['simVaultBorrow'] -= amountToTransfer

        if (borrowAPYs[date][provider]['apySlippage'] > 0 || borrowAPYs[date][provider]['simVaultBorrow'] > 0) {
          throw "Check slippage"
        }

        borrowingVault.transferDebt(
          provider,
          minProvider['provider'],
          percentageToTransfer);
      }
    }

    // TODO get price to convert the debt asset to USD - okay now becasue we use USDC

    apyHistory[date] = {
      'activeProvider': borrowingVault.providerDistribution,
      'activeApy': {},
      'apySlippage': {}
    };
    for (let i = 0; i < borrowingVault.lendingProviders.length; i++) {
      let provider = borrowingVault.lendingProviders[i];
      apyHistory[date]['activeApy'][provider] = borrowAPYs[date][provider]['apyBaseBorrow'];
      apyHistory[date]['apySlippage'][provider] = borrowAPYs[date][provider]['apySlippage'];
    }

    apyHistory[date] = JSON.stringify(apyHistory[date]);
  }

  const result = totalInterestPaid(apyHistory, borrowingVault.debtAmount, startDate, endDate);

  const displayResult = `The borrowing vault rebalanced ${borrowingVault.debtAmount} ${borrowingVault.debtAsset} for ${result["totalDayCount"]} days. Total interest paid ${result["totalInterestPaid"]} ${borrowingVault.debtAsset}`;

  // console.log('The borrowing vault rebalanced', borrowingVault.debtAmount,
  //   borrowingVault.debtAsset, 'for', result["totalDayCount"], 'days. Total interest paid ', result["totalInterestPaid"], borrowingVault.debtAsset);

  console.log(displayResult);

  return displayResult;
}
