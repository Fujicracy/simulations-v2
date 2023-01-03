'use strict';

const Hapi = require('@hapi/hapi');
const supplyInterestRates = require('./supplyInterestRates.js');
const simulatedVault = require('./simulatedVault.js');
const simRebalance = require('./simRebalance.js');

const init = async () => {

    const server = Hapi.server({
        port: process.env.PORT,
        host: '0.0.0.0'
    });

    server.route({
        method: 'GET',
        path: '/calculateTotalInterest/startDate={startDate}&endDate={endDate}&collateralAsset={collateralAsset}&borrowedAsset={borrowedAsset}&lendingProviders={lendingProviders}',
        handler: (request, h) => {
            const startDate = new Date(`${request.params.startDate} 00:00:00 UTC`);
            const endDate = new Date(`${request.params.endDate} 00:00:00 UTC`);
            const collateralAsset = request.params.collateralAsset;
            const borrowedAsset = request.params.borrowedAsset;
            const lendingProviders = request.params.lendingProviders.split(',');

            const ir = new supplyInterestRates(collateralAsset, borrowedAsset, lendingProviders);
            const borrowingVault = new simulatedVault(collateralAsset, 1000, borrowedAsset, '400000', lendingProviders);
            const result = simRebalance(startDate, endDate, borrowingVault, ir);

            return result;
        }
    });

    // example query: http://localhost:3000/calculateTotalInterest/startDate=09-19-2022&endDate=11-17-2022&collateralAsset=ETH&borrowedAsset=USDC&lendingProviders=aavev2,compound,euler

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init(); 
