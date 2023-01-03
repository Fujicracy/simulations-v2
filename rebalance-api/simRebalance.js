const apyHistory = {};
  
function getMinProviderApy(oneDayProviderApys) {
  let minProvider = {};

  for (let provider in oneDayProviderApys) {
    if (minProvider['apyBaseBorrow'] == undefined || oneDayProviderApys[provider]['apyBaseBorrow'] < minProvider['apyBaseBorrow']) {
      minProvider['apyBaseBorrow'] = oneDayProviderApys[provider]['apyBaseBorrow'];
      minProvider['totalBorrowUsd'] = oneDayProviderApys[provider]['totalBorrowUsd'];
      minProvider['provider'] = provider;
    }
  }

  return minProvider;
}

function calcAvgBorrowRate(data) {
  data = JSON.parse(data);
  let avgBorrowRate = 0;

  let lendingProviders = Object.keys(data['activeApy']);

  for (let i = 0; i < lendingProviders.length; i++) {
    let provider = lendingProviders[i];
    // add apySlippage to activeApy
    avgBorrowRate += data['activeProvider'][provider] * (data['activeApy'][provider] + data['apySlippage'][provider]);
  }

  return avgBorrowRate;
}

function totalInterestPaid(historicRates, debtAmount, startDate, endDate) {
  let accumulatedInterest = 0;
  let totalDayCount = 0;

  for (let date in historicRates) {
    let currentDate = new Date(date);
    if (startDate < currentDate && currentDate <= endDate) {
      totalDayCount += 1;
      accumulatedInterest += calcAvgBorrowRate(historicRates[date]) / 100;
    }
  }

  let totalInterestPaid = debtAmount * accumulatedInterest / 365;

  return {
    "totalInterestPaid": totalInterestPaid,
    "totalDayCount": totalDayCount
  }
} 
async function simRebalance(startDateInput, endDateInput, borrowingVault, ir) {
  const allProviderData = await ir.getAllProviderData();
  const borrowAPYs = await ir.formatProviderData(allProviderData);

  Object.freeze(borrowAPYs);

  const startDate = new Date(startDateInput);
  const endDate = new Date(endDateInput);

  borrowingVault.initProviderDistribution();
  for (let date in borrowAPYs) {
    let minProvider = getMinProviderApy(borrowAPYs[date]);

    // initialize provider distribution
    if (borrowingVault.providerDistrTotal() < 1) {
      borrowingVault.providerDistribution[minProvider['provider']] = 1;
      // TODO: add slippage
    }

    for (let provider in borrowAPYs[date]) {
      if (minProvider['apyBaseBorrow'] < borrowAPYs[date][provider]['apyBaseBorrow'] - 0.5) {
        if (borrowingVault.providerDistribution[provider] == 0) {
          continue; // There is nothing to transfer
        }

        let percentageToTransfer = borrowingVault.providerDistribution[provider];
        let amountToTransfer = percentageToTransfer * borrowingVault.debtAmount; // does this need to be collateral amount? The debtAmount is among the users, the borrowing vault manages the collateral?

        let maxSlippage = borrowAPYs[date][provider]['apyBaseBorrow'] - minProvider['apyBaseBorrow'] - 0.5;
        let maxTransferAmount = borrowingVault.maxTransferAmount(minProvider['totalBorrowUsd'], maxSlippage);

        if (amountToTransfer > maxTransferAmount) {
          amountToTransfer = maxTransferAmount;
          percentageToTransfer = amountToTransfer / borrowingVault.debtAmount;
        }

        // How much slippage did the transaction cause? Calculate via apySlippage and add to borrowAPYs
        let apySlippage = borrowingVault.apySlippage(minProvider['totalBorrowUsd'], amountToTransfer);
        borrowAPYs[date][minProvider['provider']]['apySlippage'] = apySlippage;
        borrowAPYs[date][minProvider['provider']]['simVaultBorrow'] = amountToTransfer;

        borrowAPYs[date][provider]['apySlippage'] -= apySlippage;
        borrowAPYs[date][provider]['simVaultBorrow'] -= amountToTransfer

        if (borrowAPYs[date][provider]['apySlippage'] > 0 || borrowAPYs[date][provider]['simVaultBorrow'] > 0) {
          throw "Check slippage"
        }

        borrowingVault.transferDebt(
          provider,
          minProvider['provider'],
          percentageToTransfer);
      }
    }

    // TODO get price to convert the debt asset to USD - okay now becasue we use USDC

    apyHistory[date] = {
      'activeProvider': borrowingVault.providerDistribution,
      'activeApy': {},
      'apySlippage': {}
    };
    for (let i = 0; i < borrowingVault.lendingProviders.length; i++) {
      let provider = borrowingVault.lendingProviders[i];
      apyHistory[date]['activeApy'][provider] = borrowAPYs[date][provider]['apyBaseBorrow'];
      apyHistory[date]['apySlippage'][provider] = borrowAPYs[date][provider]['apySlippage'];
    }

    apyHistory[date] = JSON.stringify(apyHistory[date]);
  }

  const result = totalInterestPaid(apyHistory, borrowingVault.debtAmount, startDate, endDate);
  
  return result;
}

module.exports = simRebalance;
