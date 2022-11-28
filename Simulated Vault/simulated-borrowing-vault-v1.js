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

let chains = ['Mainnet', 'Polygon', 'Arbitrum', 'Optimism'];
// let allowedLendingProviders = ['AaveV2', 'CompoundV2'];

// let allowedLendingProviders = ['AaveV2', 'AaveV3', 'CompoundV2', 'CompoundV3', 
//                             'Euler', 'Notional', 'Morpho', 'Sturdy Finance', 
//                             'Radiant', '0vix', 'Hundred', 'Iron Bank', 
//                             'dForce', 'WePiggy', 'Midas', 'Wing'];

let pools = {
    'USDC': {
        'aavev2': 'a349fea4-d780-4e16-973e-70ca9b606db2',
        'compound': 'cefa9bb8-c230-459a-a855-3b94e96acd8c',
        'euler': '61b7623c-9ac2-4a73-a748-8db0b1c8c5bc',
    }
};

class supplyInterestRates {
    constructor(collateralAsset, borrowedAsset) {
        this.collateralAsset = collateralAsset;
        this.borrowedAsset = borrowedAsset;
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
}

class rebalanceStrategy {
    constructor(borroowingVault, supplyInterestRates) {
        this.borroowingVault = borroowingVault;
        this.supplyInterestRates = supplyInterestRates;
        this.lastRebalnceDate = new Date();
        this.rebalanceFrequency = 24; // in hours
    }

    // method to sort interest rates 

    // method to decide rebalancing strategy: 0.5%
    
}

class simulatedVault {
    constructor(collateralAsset, collateralAmount, debtAsset, debtAmount) {
        this.collateralAsset = collateralAsset;
        this.collateralAmount = collateralAmount;
        this.debtAsset = debtAsset;
        this.debtAmount = debtAmount;
        this.lendingProviders = ['aavev2', 'compound'];
        this.apyHistory = {};
        this.providerDistribution = {};
    }

    // // The borrow rate a user gets from the vault is the weighted average of the borrow rates of the providers
    // get userBorrowrate() {
    //     return this.calcAvgBorrowRate();
    // }

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
        for (let i = 0; i < this.lendingProviders.length; i++) {
            let provider = this.lendingProviders[i];
            
        }
    }
}

let ir = new supplyInterestRates(collateralAsset, borrowedAsset);

let borrowingVault = new simulatedVault(collateralAsset = collateralAsset,
                                        collateralAmount = 1000,
                                        debtAsset = borrowedAsset,
                                        debtAmount = 4e5);

let lendingProvider1 = borrowingVault.lendingProviders[0];
let lendingProvider2 = borrowingVault.lendingProviders[1];

(async function(){

    let firstDateArray = [];
    let providerDataArray = {};
    for (i=0; i<borrowingVault.lendingProviders.length; i++) {
        let provider = borrowingVault.lendingProviders[i];
        let providerData = await ir.getHistoricData(pools[ir.borrowedAsset][provider]);

        providerDataArray[provider] = providerData;

        let firstDate = ir.timestampToDate(providerData[0]['timestamp']);
        firstDateArray.push(firstDate);
    }
    
    // Get earliest date where each provider has apy data:
    let firstCommonDate = new Date(Math.max.apply(null, firstDateArray));
    console.log('First common date all provider have data: ', firstCommonDate);

    formattedDataArray = {};
    for (provider in providerDataArray) {
        let providerData = providerDataArray[provider];
        let splitOn = 0;
        for (i=0; i<providerData.length; i++) {
            let date = ir.timestampToDate(providerData[i]['timestamp']);
            if ( ir.isSameDay(date, firstCommonDate) ) {
                splitOn = i;
                break;
            }
        }
        formattedDataArray[provider] = providerData.slice(splitOn);
    }

    providerDataArray = formattedDataArray;

    let borrowAPYs = {};
    
    for (let i = 0; i < providerDataArray[lendingProvider1].length; i++) {
        if ( ir.isSameDay(providerDataArray[lendingProvider1][i].timestamp, providerDataArray[lendingProvider2][i].timestamp) ) {
            let date = ir.timestampToDate(providerDataArray[lendingProvider1][i].timestamp);
            borrowAPYs[date] = {};

            borrowAPYs[date][lendingProvider1] = {};
            borrowAPYs[date][lendingProvider1]['apyBaseBorrow'] = providerDataArray[lendingProvider1][i].apyBaseBorrow;
            borrowAPYs[date][lendingProvider1]['totalBorrowUsd'] = providerDataArray[lendingProvider1][i].totalBorrowUsd;
            
            borrowAPYs[date][lendingProvider2] = {};
            borrowAPYs[date][lendingProvider2]['apyBaseBorrow'] = providerDataArray[lendingProvider2][i].apyBaseBorrow;
            borrowAPYs[date][lendingProvider2]['totalBorrowUsd'] = providerDataArray[lendingProvider2][i].totalBorrowUsd;
        }
    }
    
    borrowingVault.providerDistribution[lendingProvider1] = 0;
    borrowingVault.providerDistribution[lendingProvider2] = 0;

    for (let date in borrowAPYs) {
        console.log();
        console.log('********************************************************');
        console.log(date);
        console.log(borrowAPYs[date]);

        let apy1 = borrowAPYs[date][lendingProvider1]['apyBaseBorrow'];
        let apy2 = borrowAPYs[date][lendingProvider2]['apyBaseBorrow'];

        let totalBorrowUsd1 = borrowAPYs[date][lendingProvider1]['totalBorrowUsd'];
        let totalBorrowUsd2 = borrowAPYs[date][lendingProvider2]['totalBorrowUsd'];

        // TODO get price to convert the debt asset to USD - okay now becasue we use USDC
        
        let amountToTransfer = borrowingVault.debtAmount;

        function logResults(maxSlippage, 
                            totalBorrowUsd, 
                            maxTransferAmount, 
                            amountToTransfer,
                            distr) {
            console.log();
            console.log('---------------------------------');
            console.log('maxSlippage: ', maxSlippage);
            console.log('totalBorrowUsd1: ', totalBorrowUsd);
            console.log('maxTransferAmount: ', maxTransferAmount);
            console.log('Amount to transfer: ', amountToTransfer);
            console.log('Distribution: ', distr);
            console.log('---------------------------------');
            console.log();
        }

        if ( apy1 < apy2 - 0.5 ) {
            let maxSlippage = apy2 - apy1 - 0.5;
            let maxTransferAmount = borrowingVault.maxTransferAmount(tvlProvider = totalBorrowUsd1, maxSlippage = maxSlippage);

            if (borrowingVault.providerDistrTotal() != 0 && borrowingVault.providerDistribution[lendingProvider2] != 0) {
                amountToTransfer *= borrowingVault.providerDistribution[lendingProvider2];
            }

            if (amountToTransfer > maxTransferAmount) {
                amountToTransfer = maxTransferAmount;
            }
            borrowingVault.transferDebt(lendingProvider2, lendingProvider1, amountToTransfer / borrowingVault.debtAmount);

            // add amountToTransfer to totalBorrowUsd

            // if there is still left to transfer after maxTransferAmount and 
            // there is debt in the vault wihtout provider, then transfer the rest

            logResults(maxSlippage, totalBorrowUsd1, maxTransferAmount, amountToTransfer, borrowingVault.providerDistribution)

        } else if ( apy2 < apy1 - 0.5 ) {
            let maxSlippage = apy1 - apy2 - 0.5;

            let maxTransferAmount = borrowingVault.maxTransferAmount(tvlProvider = totalBorrowUsd2, maxSlippage = maxSlippage);
            
            if (borrowingVault.providerDistrTotal() != 0 & borrowingVault.providerDistribution[lendingProvider1] != 0) {
                amountToTransfer *= borrowingVault.providerDistribution[lendingProvider1];
            }

            if (amountToTransfer > maxTransferAmount) {
                amountToTransfer = maxTransferAmount;
            }
            borrowingVault.transferDebt(lendingProvider1, lendingProvider2, amountToTransfer / borrowingVault.debtAmount);
            
            logResults(maxSlippage, totalBorrowUsd2, maxTransferAmount, amountToTransfer, borrowingVault.providerDistribution)
        }
        
        borrowingVault.apyHistory[date] = {
            'activeProvider': borrowingVault.providerDistribution,
            'activeApy': {
                'aavev2': borrowAPYs[date][lendingProvider1]['apyBaseBorrow'],
                'compound': borrowAPYs[date][lendingProvider2]['apyBaseBorrow']
            }
        };
        // for (i in borrowingVault.lendingProviders) {
        //     borrowingVault.apyHistory[date]['activeApy'][borrowingVault.lendingProviders[i]] = borrowAPYs[date][borrowingVault.lendingProviders[i]]['apyBaseBorrow'];
        // }
    }

    /* 
        Calculate the total interest paid by the vault
    */

    endDate = new Date();

    // sum up borrowingVault.apyHistory rates
    let accumulatedInterest = 0;
    let totalDayCount = 0;
    for (date in borrowingVault.apyHistory) {
        currentDate = new Date(date);
        if (currentDate <= endDate) {
            totalDayCount += 1;
            accumulatedInterest += borrowingVault.calcAvgBorrowRate(borrowingVault.apyHistory[date]) / 100;
        }
    }

    let totalInterestPaid = borrowingVault.debtAmount * accumulatedInterest / 365;

    console.log('The borrowing vault rebalanced', borrowingVault.debtAmount, 
                borrowingVault.debtAsset, 'for', totalDayCount, 'days');
    console.log('Total interest paid ', totalInterestPaid, debtAsset);

    /*
    - how much total interest paid with rebalancing
    - how much total interest paid with aavev2
    - how much total interest paid with compound
    */

})();
