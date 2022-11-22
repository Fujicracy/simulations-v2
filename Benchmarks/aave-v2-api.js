/*
    Benchmark calculation of total interest a user pays for using the Aave V2 as lending provider. 
    It uses the Aave-V2 Data API as data source directly, this will help to compare the result of useing other data sources.

    Borrowed amount: small amount so we don't need to model interest rate slippage

    Data API from Aave's dev docs: https://docs.aave.com/developers/v/2.0/
    API docs: https://aave-api-v2.aave.com
    Aave V2 deployed contracts: https://docs.aave.com/developers/v/2.0/deployed-contracts/deployed-contracts

    TODO: Turn input in parameters
 */

const axios = require('axios');

const borrowedAmount = 10000;
const debtAsset = 'USDC';

const startDate = new Date("Sep-19-2022 00:54:11 UTC");
const endDate = new Date("Nov-17-2022 06:27:47 UTC");

const DAIaddr = "0x6b175474e89094c44da98b954eedeac495271d0f";
const USDCaddr = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

let assetAddr = USDCaddr;
let lendingPoolAddrProvider = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5";

let resolutionInHours = 24;

function getDate(apiDateObject) {
    return new Date(
        apiDateObject.x.year,
        apiDateObject.x.month,
        apiDateObject.x.date,
        apiDateObject.x.hours
        );
}

function getUnixTimestamp(dateObj) {
    return Math.floor(dateObj.getTime() / 1000);
}

let baseUrlApi = 'https://aave-api-v2.aave.com/';

let reserveId = `${assetAddr}${lendingPoolAddrProvider}`;
let startTime = getUnixTimestamp(startDate);
let endTime = getUnixTimestamp(endDate);

let url_api = `${baseUrlApi}data/rates-history?reserveId=${reserveId}&from=${startTime}&resolutionInHours=${resolutionInHours}`;

function calculateTotalInterest(queryResult) {
    let accumulatedInterest = 0;
    let totalHours = 0;

    for (let i = 0; i < queryResult.length; i++) {
        let timestampRate = getDate(queryResult[i]);
        if ( getUnixTimestamp(timestampRate) <= endTime ) {
            totalHours += resolutionInHours;
            accumulatedInterest += queryResult[i].variableBorrowRate_avg;
        }
    }

    let totalInterest = (resolutionInHours / 24) * accumulatedInterest / 365;
    let totalDays = Math.floor(totalHours / 24);

    console.log("Borrowed on:", startDate);
    console.log("Payback on:", endDate);
    
    console.log('Total interest paid on borrowing', borrowedAmount, debtAsset, 'for', totalDays, 
                'days with variable rate:', borrowedAmount*totalInterest, debtAsset);
}

axios.get(url_api).then(
    (result) => { calculateTotalInterest(result.data) }
);
