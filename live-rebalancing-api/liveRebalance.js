const liveProviderRates = require('./liveProviderRates.js');
const readVaultContract = require('./readVaultContract.js');

module.exports = class liveRebalance {
    constructor(chain, tresholdInterestRate, vaultAddress) {
        this.chain = chain;
        this.tresholdInterestRate = Number(tresholdInterestRate);
        this.vaultAddress = vaultAddress

        this.lpr = new liveProviderRates();
        this.rvc = new readVaultContract(chain);
    }

    getMinProviderApy(oneDayProviderApys) {
        let minProvider = {};
      
        for (let provider in oneDayProviderApys) {
          if (minProvider['apyBaseBorrow'] == undefined || oneDayProviderApys[provider]['apyBaseBorrow'] < minProvider['apyBaseBorrow']) {
            minProvider['apyBaseBorrow'] = oneDayProviderApys[provider]['apyBaseBorrow'];
            minProvider['totalSupplyUsd'] = oneDayProviderApys[provider]['totalSupplyUsd'];
            minProvider['totalBorrowUsd'] = oneDayProviderApys[provider]['totalBorrowUsd'];
            minProvider['provider'] = provider;
          }
        }

        return minProvider;
    }

    calcUtility(minProvider) {
        return minProvider['totalBorrowUsd'] / minProvider['totalSupplyUsd'];
    }

    calcMaxTransferAmount(maxSlippage, providerSuppliedUsd, coeffSlippage) {
        // based on linear slippage model where slippage = 0.35% x (transferAmount / providerSuppliedUsd)
        let maxTransferAmount = maxSlippage * providerSuppliedUsd / coeffSlippage; // TODO: multiply with conversion of debtAsset to USd, in this case 1 DAI/Usd
        return maxTransferAmount;
    }

    async rebalance() {
        let result = {
            'rebalance': false,
            'toProvider': '',
            'fromProvider': '',
            'fromProviderAddress': '',
            'debtAsset': '',
            'debtAssetName': '',
            'transferAmount': 0
        };

        // the chain name needs to be a key in the pools dictionary.
        // The currency needs to be a key in the dictionary nested under chain.
        let vaultInfo = await this.rvc.getVaultInfo(this.vaultAddress);

        if (!vaultInfo['debtAssetName']) {
            console.warn('Define a providerAddressName for debtAsset:', vaultInfo['debtAsset']);
            return {'errorMessage': 'Define a providerAddressName for debtAsset: ' + vaultInfo['debtAsset']};
        }

        let liveBorrowRates = await this.lpr.getLiveBorrowRates(this.chain, vaultInfo['debtAssetName']);
        let minProvider = this.getMinProviderApy(liveBorrowRates);
        
        for (let activeProviderAddress in vaultInfo['activeProviderAddressesDict']) {
            let activeProviderInfo = vaultInfo['activeProviderAddressesDict'][activeProviderAddress];

            if (activeProviderInfo['providerName'] != minProvider['provider'] && activeProviderInfo['borrowBalance'] > 0) {
                let borrowRate = liveBorrowRates[activeProviderInfo['providerName']]['apyBaseBorrow'];

                if (minProvider['apyBaseBorrow'] + this.tresholdInterestRate < borrowRate) {
                    // calculate amount to transfer, taking into account max slippage
                    let maxSlippage = borrowRate - minProvider['apyBaseBorrow'] - this.tresholdInterestRate;

                    let maxTransferAmount = this.calcMaxTransferAmount(maxSlippage, minProvider['totalSupplyUsd'], 0.35);
                    let transferAmount = activeProviderInfo['borrowBalance'];
                    if (transferAmount > maxTransferAmount) {
                        transferAmount = maxTransferAmount;
                    }

                    result['rebalance'] = true;
                    result['toProvider'] = minProvider['provider'];
                    result['fromProvider'] = activeProviderInfo['providerName'];
                    result['fromProviderAddress'] = activeProviderAddress;
                    result['debtAsset'] = vaultInfo['debtAsset'];
                    result['debtAssetName'] = vaultInfo['debtAssetName'];
                    result['transferAmount'] = transferAmount; // Should it be multiplied with 1e18?
                }
            }
        }

        return result;
    }
}