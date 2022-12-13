/*
Objective: to test and validate rebalancing strategies to minimize borrowing costs.

A Vault, in the end, proves the user with a certain interest rate.

To get the poolAddress, go to https://defillama.com/docs/api => pools or get request https://yields.llama.fi/pools

V1: Model Compound's slippage model for utility vs borrowing APY curve. Assume the lowest APY is not in the steep part of the curve, beyond 80% utilisation.
So adding 1% utilisation => 0.35% increases to APY.
Counpound slippage model: https://app.compound.finance/markets?market=1_USDC_0xc3d688B66703497DAA19211EEdff47f25384cdc3
*/

// sychronise all api date to the first where every protocol has ab apy
// inititalise vault: put all in the lowerst rate lending provider
// 

const axios = require('axios');

let collateralAsset = 'ETH';
let borrowedAsset = 'USDC';
let lendingProviders = ['aavev2', 'compound'];

let chains = ['Mainnet', 'Polygon', 'Arbitrum', 'Optimism'];
// let allowedLendingProviders = ['AaveV2', 'CompoundV2'];

// let allowedLendingProviders = ['aavev2', 'AaveV3', 'Compound-v2', 'Compound-v3', 
//                             'euler', 'Notional', 'Morpho', 'Sturdy Finance', 
//                             'Radiant', '0vix', 'Hundred', 'Iron Bank', 
//                             'dForce', 'WePiggy', 'Midas', 'Wing'];

class supplyInterestRates {
    constructor(collateralAsset, borrowedAsset, lendingProviders) {
        this.collateralAsset = collateralAsset;
        this.borrowedAsset = borrowedAsset;
        this.lendingProviders = lendingProviders;
        this.firstCommonDate;
        this.pools = {
                'USDC': {
                    'aavev2': 'a349fea4-d780-4e16-973e-70ca9b606db2',
                    'compound': 'cefa9bb8-c230-459a-a855-3b94e96acd8c',
                    'euler': '61b7623c-9ac2-4a73-a748-8db0b1c8c5bc',
                }
        }
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
            for (let i=0; i<providerData.length; i++) {
                let date = this.timestampToDate(providerData[i]['timestamp']);
                if ( this.isSameDay(date, this.firstCommonDate) ) {
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
        for (let i=0; i<this.lendingProviders.length; i++) {
            let provider = this.lendingProviders[i];
            let providerData = await this.getHistoricData(this.pools[this.borrowedAsset][provider]);
    
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
            let date = ir.timestampToDate(allProviderData[this.lendingProviders[0]][i].timestamp);
            formattedData[date] = {};

            for (let j = 0; j < this.lendingProviders.length; j++) {
                let lendingProvider = this.lendingProviders[j];
                
                formattedData[date][lendingProvider] = {};

                formattedData[date][lendingProvider]['apyBaseBorrow'] = allProviderData[lendingProvider][i].apyBaseBorrow;
                formattedData[date][lendingProvider]['totalBorrowUsd'] = allProviderData[lendingProvider][i].totalBorrowUsd;
            }
        }
        
        return formattedData;
    }
}

class simulaterebalancing {
    constructor(borroowingVault, supplyInterestRates) {
        this.borroowingVault = borroowingVault;
        this.supplyInterestRates = supplyInterestRates;
    }

    logResults(date,
                apys,
                maxSlippage, 
                totalBorrowUsd, 
                maxTransferAmount, 
                amountToTransfer,
                distr) {
        console.log();
        console.log('---------------------------------');
        console.log('date:', date);
        console.log('apys:', apys);
        console.log('maxSlippage: ', maxSlippage);
        console.log('totalBorrowUsd1: ', totalBorrowUsd);
        console.log('maxTransferAmount: ', maxTransferAmount);
        console.log('Amount to transfer: ', amountToTransfer);
        console.log('Distribution: ', distr);
        console.log('---------------------------------');
        console.log();
    }

    // method to sort interest rates 

    // method to decide rebalancing strategy: 0.5%
    
}

class simulatedVault {
    constructor(collateralAsset, collateralAmount, debtAsset, debtAmount, lendingProviders) {
        this.collateralAsset = collateralAsset;
        this.collateralAmount = collateralAmount;
        this.debtAsset = debtAsset;
        this.debtAmount = debtAmount;
        this.lendingProviders = lendingProviders;
        this.apyHistory = {};
        this.providerDistribution = {};
    }

    // // The borrow rate a user gets from the vault is the weighted average of the borrow rates of the providers
    // get userBorrowrate() {
    //     return this.calcAvgBorrowRate();
    // }

    initProviderDistribution() {
        for (let i=0; i<this.lendingProviders.length; i++) {
            this.providerDistribution[this.lendingProviders[i]] = 0;
        }
    }

    calcAvgBorrowRate(data) {
        let avgBorrowRate = 0;

        // loop through the lending providers
        for (let i = 0; i < this.lendingProviders.length; i++) {
            let provider = this.lendingProviders[i];
            avgBorrowRate += data['activeProvider'][provider] * data['activeApy'][provider];
        }

        return avgBorrowRate;
    }

    // slippage model
    apySlippage(tvlProvider, transferAmount) {
        // if transferAmount is 1% fo tvlProvider, then slippage is 0.35%
        let slippage = 0.35 * transferAmount / (tvlProvider);
        return slippage;
    }

    // function with default value

    maxTransferAmount(tvlProvider, maxSlippage = 0.35) {
        let maxTransferAmount = 2 * maxSlippage * tvlProvider;
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
        // transferAmount: 0 to 1

        if (this.providerDistrTotal() == 1) {
            if (this.providerDistribution[fromProvider] < transferAmount) {
                transferAmount = this.providerDistribution[fromProvider];
            }
            this.providerDistribution[fromProvider] -= transferAmount;
        }

        if (this.providerDistribution[toProvider] + transferAmount > 1) {
            transferAmount = 1 - this.providerDistribution[toProvider];
        }
        this.providerDistribution[toProvider] += transferAmount;

        console.log('Transfer', transferAmount, 'from', fromProvider, 'to', toProvider);
    }
    
    initialize() {
        // initialize when vault is too big to to be distributed because of slippage.
        // currently not needed with 4e5 debtAmount
        for (let i = 0; i < this.lendingProviders.length; i++) {
            let provider = this.lendingProviders[i];
            
        }
    }
}

let ir = new supplyInterestRates(collateralAsset, borrowedAsset, lendingProviders);

let borrowingVault = new simulatedVault(collateralAsset = collateralAsset,
                                        collateralAmount = 1000,
                                        debtAsset = borrowedAsset,
                                        debtAmount = 4e5,
                                        lendingProviders);

let rebalance = new simulaterebalancing(borrowingVault, ir);

async function simRebalance() {
    let allProviderData = await ir.getAllProviderData();
    let borrowAPYs = await ir.formatProviderData(allProviderData);

    borrowingVault.initProviderDistribution();

    for (let date in borrowAPYs) {
        let min = {};
        for (let provider in borrowAPYs[date]) {
            if (min['apyBaseBorrow'] == undefined || borrowAPYs[date][provider]['apyBaseBorrow'] < min['apyBaseBorrow']) {
              min['apyBaseBorrow'] = borrowAPYs[date][provider]['apyBaseBorrow'];
              min['totalBorrowUsd'] = borrowAPYs[date][provider]['totalBorrowUsd'];
              min['provider'] = provider;
            }
        }

        if (borrowingVault.providerDistrTotal() == 0) {
            borrowingVault.providerDistribution[min['provider']] = 1;
            // TODO: track slippage
        }

        let amountToTransfer = borrowingVault.debtAmount;
        for (let provider in borrowAPYs[date]) {
            if ( min['apyBaseBorrow'] < borrowAPYs[date][provider]['apyBaseBorrow'] - 0.5 ) {
                let maxSlippage = borrowAPYs[date][provider]['apyBaseBorrow'] - min['apyBaseBorrow'] - 0.5;
                let maxTransferAmount = borrowingVault.maxTransferAmount(
                    min['totalBorrowUsd'],
                    maxSlippage);
                
                if (borrowingVault.providerDistrTotal() != 0 && borrowingVault.providerDistribution[provider] != 0) {
                    amountToTransfer *= borrowingVault.providerDistribution[provider];
                }

                if (amountToTransfer > maxTransferAmount) {
                    amountToTransfer = maxTransferAmount;
                }

                borrowingVault.transferDebt(provider, min['provider'], amountToTransfer / borrowingVault.debtAmount);

                rebalance.logResults(date, borrowAPYs[date], maxSlippage, min['totalBorrowUsd'], maxTransferAmount, amountToTransfer, borrowingVault.providerDistribution);
            }
        }

        // TODO get price to convert the debt asset to USD - okay now becasue we use USDC
        
        borrowingVault.apyHistory[date] = {
            'activeProvider': borrowingVault.providerDistribution,
            'activeApy': {}
        };
        for (let i = 0; i < borrowingVault.lendingProviders.length; i++) {
            let provider = borrowingVault.lendingProviders[i];
            borrowingVault.apyHistory[date]['activeApy'][provider] = borrowAPYs[date][provider]['apyBaseBorrow'];
        }
    }

    /* 
        Calculate the total interest paid by the vault
    */

    endDate = new Date();

    // sum up borrowingVault.apyHistory rates
    let accumulatedInterest = 0;
    let totalDayCount = 0;
    for (let date in borrowingVault.apyHistory) {
        let currentDate = new Date(date);
        if (currentDate <= endDate) {
            totalDayCount += 1;
            accumulatedInterest += borrowingVault.calcAvgBorrowRate(borrowingVault.apyHistory[date]) / 100;
        }
    }

    let totalInterestPaid = borrowingVault.debtAmount * accumulatedInterest / 365;

    console.log('The borrowing vault rebalanced', borrowingVault.debtAmount, 
                borrowingVault.debtAsset, 'for', totalDayCount, 'days');
    console.log('Total interest paid ', totalInterestPaid, borrowingVault.debtAsset);

    /*
    - how much total interest paid with rebalancing
    - how much total interest paid with aavev2
    - how much total interest paid with compound
    */

}

simRebalance();
