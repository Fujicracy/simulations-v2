'use strict';

const Hapi = require('@hapi/hapi');
const liveProviderRates = require('./liveProviderRates.js');
const readVaultContract = require('./readVaultContract.js');

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT,
        host: '0.0.0.0'
    });

    server.route({
        method: 'GET',
        path: '/chain={chain}&tresholdInterestRate={tresholdInterestRate}&vaultAddress={vaultAddress}',
        handler: (request, h) => {
            const chain = request.params.chain;
            const tresholdInterestRate = request.params.tresholdInterestRate;
            const vaultAddress = request.params.vaultAddress;

            const providerRates = new liveProviderRates();
            const vaultContract = new readVaultContract();

            const rebalanceNeeded = false;
            const rebalanceAmount = {};

            // TODO: apply life rebalancing logic

            const result = {
                'rebalanceNeeded': rebalanceNeeded,
                'rebalanceAmount': rebalanceAmount,
            };

            return result;
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init(); 
