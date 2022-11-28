/*
Objective: to test and validate rebalancing strategies to minimize borrowing costs.

A Vault, in the end, proves the user with a certain interest rate.

To get the poolAddress, go to https://defillama.com/docs/api => pools or get request https://yields.llama.fi/pools

V0: switch 100% of fund between aave and compound if the interest rate difference is greater than 0.5%. Ignore slippage.
*/

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

            formattedData.push(formattedDataPoint);
        }
        return formattedData;
    }

    timestampToDate(timestamp) {
        let date = new Date(timestamp.split('T')[0]);
        return date;
    }

    isSameDay(timestamp1, timestamp2) {
        let date1 = this.timestampToDate(timestamp1);
        let date2 = this.timestampToDate(timestamp2);

        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    }

    getLiveData() {
        let url = 'https://yields.llama.fi/lendBorrow';
        let response = axios.get(url);

        return response
    }

    getHistoricData(poolAddress) {
        let url = `https://yields.llama.fi/chartLendBorrow/${poolAddress}`;
        let response = axios.get(url);
        
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
}

let ir = new supplyInterestRates(collateralAsset, borrowedAsset);

let borrowingVault = new simulatedVault(collateralAsset = collateralAsset, 
                                        collateralAmount = 1000, 
                                        debtAsset = borrowedAsset, 
                                        debtAmount = 4e5);

let lendingProvider1 = 'aavev2';
let lendingProvider2 = 'compound';

(async function(){

    // for (provider in lendingProviders) {
    //     let providerData = await ir.getHistoricData(pools[ir.borrowedAsset][provider]);
    //     providerData = ir.formatApiRequest(providerData.data.data);
    // }

    let aavev2Data = await ir.getHistoricData(pools[ir.borrowedAsset][lendingProvider1]);
    let compoundData = await ir.getHistoricData(pools[ir.borrowedAsset][lendingProvider2]);

    aavev2Data = ir.formatApiRequest(aavev2Data.data.data);
    compoundData = ir.formatApiRequest(compoundData.data.data);

    // main
    let borrowAPYs = {};
    
    for (let i = 0; i < aavev2Data.length; i++) {
        if ( ir.isSameDay(aavev2Data[i].timestamp, compoundData[i].timestamp) ) {
            
            let date = ir.timestampToDate(aavev2Data[i].timestamp);
            borrowAPYs[date] = {};
            borrowAPYs[date][lendingProvider1] = aavev2Data[i].apyBaseBorrow;
            borrowAPYs[date][lendingProvider2] = compoundData[i].apyBaseBorrow;
        }
    }
    
    borrowingVault.providerDistribution[lendingProvider1] = 0;
    borrowingVault.providerDistribution[lendingProvider2] = 0;

    for (let date in borrowAPYs) {
        console.log();
        console.log(date);
        console.log(borrowAPYs[date]);

        if ( (borrowAPYs[date][lendingProvider1] < borrowAPYs[date][lendingProvider2] - 0.5) && (borrowingVault.providerDistribution[lendingProvider1] != 1) ) {
            borrowingVault.providerDistribution[lendingProvider1] = 1;
            borrowingVault.providerDistribution[lendingProvider2] = 0;
        } else if ( (borrowAPYs[date][lendingProvider2] < borrowAPYs[date][lendingProvider1] - 0.5) && (borrowingVault.providerDistribution[lendingProvider2] != 1) ) {
            borrowingVault.providerDistribution[lendingProvider1] = 0;
            borrowingVault.providerDistribution[lendingProvider2] = 1;
        }

        borrowingVault.apyHistory[date] = {
            'activeProvider': borrowingVault.providerDistribution,
            'activeApy': borrowAPYs[date]
        };
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
