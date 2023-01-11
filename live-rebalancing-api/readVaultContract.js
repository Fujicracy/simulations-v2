const axios = require('axios');
var ethers = require('ethers');

const abiVault = require('./abis/abiVault.json');
const abiProvider = require('./abis/abiProvider.json');

module.exports = class readVaultContract {
    constructor() {
        this.abiVault = abiVault;
        this.abiProvider = abiProvider;
    }

    async getVaultInfo(vaultAddress) {
        const network = 'goerli';
        const provider = ethers.getDefaultProvider(network, {
            etherscan: process.env.ETHERSCAN_API_KEY // https://docs.ethers.io/api-keys/
            // infura
            // alchemy
        });

        const vaultContract = new ethers.Contract(vaultAddress, this.abiVault, provider);

        // The asset of the Borrowing vault
        const collateralAsset = await vaultContract.asset();
        // const totalCollateralAsset = await vaultContract.totalAssets();


        // The debt asset of the borrowing vault
        const debtAsset = await vaultContract.debtAsset();
        // const totalDebtAsset = await vaultContract.totalDebt();

        const activeProviderAddresses = await vaultContract.getProviders();

        console.log("collateralAsset: ", collateralAsset);
        console.log("debtAsset: ", debtAsset);
        
        let providerAddressesDict = {};

        for (let i = 0; i < activeProviderAddresses.length; i++) {
            // TODO: delete limit:
            console.log('waiting 5 seconds for API limit');
            await new Promise(r => setTimeout(r, 5000));

            let providerContract = new ethers.Contract(activeProviderAddresses[i], this.abiProvider, provider);

            providerAddressesDict[activeProviderAddresses[i]] = {};

            let borrowBalance = await providerContract.getBorrowBalance(vaultAddress, vaultAddress);
            let convertBorrowBalance = borrowBalance.toBigInt() / BigInt(1e18);
            providerAddressesDict[activeProviderAddresses[i]]['borrowBalance'] = parseInt(convertBorrowBalance.toString(), 10);
            
            // TODO: delete limit:
            console.log('waiting 5 seconds for API limit');
            await new Promise(r => setTimeout(r, 5000));
            
            let depositBalance = await providerContract.getDepositBalance(vaultAddress, vaultAddress);
            let convertDepositBalance = depositBalance.toBigInt() / BigInt(1e18);
            providerAddressesDict[activeProviderAddresses[i]]['depositBalance'] = parseInt(convertDepositBalance.toString(), 10);
        }

        return {
          'collateralAsset: ': collateralAsset,
        //   'totalCollateralAsset: ': totalCollateralAsset,
          'debtAsset: ': debtAsset,
        //   'totalDebtAsset: ': totalDebtAsset,
          'activeProviderAddressesDict: ': providerAddressesDict
        };  
      }

}