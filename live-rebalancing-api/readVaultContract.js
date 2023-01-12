const axios = require('axios');
var ethers = require('ethers');

const abiVault = require('./abis/abiVault.json');
const abiProvider = require('./abis/abiProvider.json');

module.exports = class readVaultContract {
    /* 
        Available chains depends on API choice in getDefaultProvider()
        Alchamy chain options: homestead, goerli, matic. maticmum, arbitrum, 
                                arbitrum-goerli, optimism and optimism-goerli 
    */
    constructor(chain) {
        this.chain = chain;
        this.abiVault = abiVault;
        this.abiProvider = abiProvider;
    }

    async convertBigNumber(bigInt) {
        let convertBigInt = bigInt.toBigInt() / BigInt(1e18);
        return parseInt(convertBigInt.toString(), 10);
    }

    async getVaultInfo(vaultAddress) {
        const provider = ethers.getDefaultProvider(this.chain, {
            // https://docs.ethers.io/api-keys/
            infura: process.env.INFURA_API_KEY,
            alchemy: process.env.ALCHEMY_API_KEY,
            etherscan: process.env.ETHERSCAN_API_KEY, 
        });

        const vaultContract = new ethers.Contract(vaultAddress, this.abiVault, provider);

        // The asset of the Borrowing vault
        const collateralAsset = await vaultContract.asset();
        const totalCollateralAssetBigNumber = await vaultContract.totalAssets();
        const totalCollateralAsset = await this.convertBigNumber(totalCollateralAssetBigNumber);

        // The debt asset of the borrowing vault
        const debtAsset = await vaultContract.debtAsset();
        const totalDebtAssetBigNumber = await vaultContract.totalDebt();
        const totalDebtAsset = await this.convertBigNumber(totalDebtAssetBigNumber);

        const activeProviderAddresses = await vaultContract.getProviders();

        console.log("collateralAsset: ", collateralAsset);
        console.log("debtAsset: ", debtAsset);
        
        let providerAddressesDict = {};

        for (let i = 0; i < activeProviderAddresses.length; i++) {
            let providerAddress = activeProviderAddresses[i];
            let providerContract = new ethers.Contract(providerAddress, this.abiProvider, provider);

            providerAddressesDict[providerAddress] = {};

            let borrowBalance = await providerContract.getBorrowBalance(vaultAddress, vaultAddress);
            providerAddressesDict[providerAddress]['borrowBalance'] = await this.convertBigNumber(borrowBalance);
            
            let depositBalance = await providerContract.getDepositBalance(vaultAddress, vaultAddress);
            providerAddressesDict[providerAddress]['depositBalance'] = await this.convertBigNumber(depositBalance);
        }

        return {
          'collateralAsset': collateralAsset,
          'totalCollateralAsset': totalCollateralAsset,
          'debtAsset': debtAsset,
          'totalDebtAsset': totalDebtAsset,
          'activeProviderAddressesDict': providerAddressesDict
        };  
      }

}