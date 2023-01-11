const axios = require('axios');
var ethers = require('ethers');

module.exports = class readVaultContract {
    async downloadVaultAbi(vaultAddress) {
        const abiUrl = `https://api-goerli.etherscan.io/api?module=contract&action=getabi&address=${vaultAddress}`;
        const rawAbi = await axios.get(abiUrl);
        const vaultAbi = JSON.parse(rawAbi.data.result);

        return vaultAbi;
    }

    async getVaultAssets(vaultAddress) {
        const vaultAbi = await this.downloadVaultAbi(vaultAddress);
        
        const network = 'goerli';
        const provider = ethers.getDefaultProvider(network, {
            etherscan: 'YOUR_API_KEY' // 
        });

        const vaultContract = new ethers.Contract(vaultAddress, vaultAbi, provider);

        // The asset of the Borrowing vault
        const collateralAsset = await vaultContract.asset();
        // const totalCollateralAsset = await vaultContract.totalAssets();


        // The debt asset of the borrowing vault
        const debtAsset = await vaultContract.debtAsset();
        // const totalDebtAsset = await vaultContract.totalDebt();

        // Array of addreses of the providers in which the asset is deposited as collateral
        const activeProviderAddresses = await vaultContract.getProviders();

        console.log("collateralAsset: ", collateralAsset);
        console.log("debtAsset: ", debtAsset);

        // define empty dictionary
        let providerAddressesDict = {};

        for (let i = 0; i < activeProviderAddresses.length; i++) {
            // TODO: delete limit:
            console.log('waiting 5 seconds for API limit');
            await new Promise(r => setTimeout(r, 5000));

            let providerAbi = await this.downloadVaultAbi(activeProviderAddresses[i]);
            let providerContract = new ethers.Contract(activeProviderAddresses[i], providerAbi, provider);
            providerAddressesDict[activeProviderAddresses[i]] = {};

            // TODO: find right arguments touse for getBorrowBalance and getDepositBalance
            // providerAddressesDict[activeProviderAddresses[i]]['borrowBalance'] = await providerContract.getBorrowBalance('user', 'vault');
            providerAddressesDict[activeProviderAddresses[i]]['borrowBalance'] = 1/activeProviderAddresses.length; // just placeholder value
            // providerAddressesDict[activeProviderAddresses[i]]['depositBalance'] = await providerContract.getDepositBalance('user', 'vault');
            providerAddressesDict[activeProviderAddresses[i]]['depositBalance'] = 1/activeProviderAddresses.length; // just placeholder value
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