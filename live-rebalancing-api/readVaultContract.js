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
            etherscan: 'YOUR_API_KEY' // https://docs.ethers.io/api-keys/
        });

        const vaultContract = new ethers.Contract(vaultAddress, vaultAbi, provider);

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

            let providerAbi = await this.downloadVaultAbi(activeProviderAddresses[i]);
            let providerContract = new ethers.Contract(activeProviderAddresses[i], providerAbi, provider);

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