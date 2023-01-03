module.exports = class simulatedVault {
    constructor(collateralAsset, collateralAmount, debtAsset, debtAmount, lendingProviders) {
      this.collateralAsset = collateralAsset;
      this.collateralAmount = collateralAmount;
      this.debtAsset = debtAsset;
      this.debtAmount = debtAmount;
      this.lendingProviders = lendingProviders;
      this.providerDistribution = {};
      this.linearModelCoeff = 0.35;
    }
  
    initProviderDistribution() {
      for (let i = 0; i < this.lendingProviders.length; i++) {
        this.providerDistribution[this.lendingProviders[i]] = 0;
      }
    }
  
    // slippage model
    apySlippage(tvlProvider, transferAmount) {
      // if transferAmount is 1% of tvlProvider, then slippage is 0.35%
      let slippage = this.linearModelCoeff * transferAmount / tvlProvider;
      return slippage;
    }
  
    maxTransferAmount(tvlProvider, maxSlippage) {
      // Inversion of apySlippage equation
      let maxTransferAmount = maxSlippage * tvlProvider / this.linearModelCoeff;
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
      // transferAmount: percentage expressed from 0 to 1. Tansfers providerDistribution.
      // if (this.providerDistrTotal() == 1) {
      if (this.providerDistribution[fromProvider] < transferAmount) {
        transferAmount = this.providerDistribution[fromProvider];
      }
      this.providerDistribution[fromProvider] -= transferAmount;
      // }
  
      if (this.providerDistribution[toProvider] + transferAmount > 1) {
        transferAmount = 1 - this.providerDistribution[toProvider];
      }
      this.providerDistribution[toProvider] += transferAmount;
  
      // console.log('Transfer', transferAmount, 'from', fromProvider, 'to', toProvider);
    }
  
    initialize() {
      // initialize when vault is too big to to be distributed because of slippage.
      // currently not needed with 4e5 debtAmount
      for (let i = 0; i < this.lendingProviders.length; i++) {
        let provider = this.lendingProviders[i];
  
      }
    }
  }