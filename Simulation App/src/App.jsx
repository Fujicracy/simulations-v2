import './App.css'
import { supplyInterestRates, simulatedVault, simulaterebalancing } from './calcInterest'
import React, { useState, useRef } from 'react';

async function simRebalance(startDateInput, endDateInput, borrowingVault, ir) {
  let lendingProvider1 = borrowingVault.lendingProviders[0];
  let lendingProvider2 = borrowingVault.lendingProviders[1];

  let allProviderData = await ir.getAllProviderData();
  let borrowAPYs = await ir.formatProviderData(allProviderData);

  let startDate = new Date(startDateInput);
  let endDate = new Date(endDateInput);

  borrowingVault.initProviderDistribution();

  for (let date in borrowAPYs) {
    let apy1 = borrowAPYs[date][lendingProvider1]['apyBaseBorrow'];
    let apy2 = borrowAPYs[date][lendingProvider2]['apyBaseBorrow'];

    let totalBorrowUsd1 = borrowAPYs[date][lendingProvider1]['totalBorrowUsd'];
    let totalBorrowUsd2 = borrowAPYs[date][lendingProvider2]['totalBorrowUsd'];

    // TODO get price to convert the debt asset to USD - okay now becasue we use USDC

    let amountToTransfer = borrowingVault.debtAmount;

    if (apy1 < apy2 - 0.5) {
      let maxSlippage = apy2 - apy1 - 0.5;
      let maxTransferAmount = borrowingVault.maxTransferAmount(totalBorrowUsd1, maxSlippage);

      if (borrowingVault.providerDistrTotal() != 0 && borrowingVault.providerDistribution[lendingProvider2] != 0) {
        amountToTransfer *= borrowingVault.providerDistribution[lendingProvider2];
      }

      if (amountToTransfer > maxTransferAmount) {
        amountToTransfer = maxTransferAmount;
      }
      borrowingVault.transferDebt(lendingProvider2, lendingProvider1, amountToTransfer / borrowingVault.debtAmount);

      // add amountToTransfer to totalBorrowUsd

      // if there is still left to transfer after maxTransferAmount and 
      // there is debt in the vault wihtout provider, then transfer the rest

      // rebalance.logResults(date, borrowAPYs[date], maxSlippage, totalBorrowUsd1, maxTransferAmount, amountToTransfer, borrowingVault.providerDistribution)

    } else if (apy2 < apy1 - 0.5) {
      let maxSlippage = apy1 - apy2 - 0.5;

      let maxTransferAmount = borrowingVault.maxTransferAmount(totalBorrowUsd2, maxSlippage);

      if (borrowingVault.providerDistrTotal() != 0 & borrowingVault.providerDistribution[lendingProvider1] != 0) {
        amountToTransfer *= borrowingVault.providerDistribution[lendingProvider1];
      }

      if (amountToTransfer > maxTransferAmount) {
        amountToTransfer = maxTransferAmount;
      }
      borrowingVault.transferDebt(lendingProvider1, lendingProvider2, amountToTransfer / borrowingVault.debtAmount);

      // rebalance.logResults(date, borrowAPYs[date], maxSlippage, totalBorrowUsd2, maxTransferAmount, amountToTransfer, borrowingVault.providerDistribution)
    }

    borrowingVault.apyHistory[date] = {
      'activeProvider': borrowingVault.providerDistribution,
      'activeApy': {}
    };
    for (let i = 0; i < borrowingVault.lendingProviders.length; i++) {
      let provider = borrowingVault.lendingProviders[i];
      borrowingVault.apyHistory[date]['activeApy'][provider] = borrowAPYs[date][provider]['apyBaseBorrow'];
    }
  }

  /* 
      Calculate the total interest paid by the vault
  */

  // sum up borrowingVault.apyHistory rates
  let accumulatedInterest = 0;
  let totalDayCount = 0;
  for (let date in borrowingVault.apyHistory) {
    let currentDate = new Date(date);
    if (startDate < currentDate && currentDate <= endDate) {
      totalDayCount += 1;
      accumulatedInterest += borrowingVault.calcAvgBorrowRate(borrowingVault.apyHistory[date]) / 100;
    }
  }

  let totalInterestPaid = borrowingVault.debtAmount * accumulatedInterest / 365;

  console.log('The borrowing vault rebalanced', borrowingVault.debtAmount,
    borrowingVault.debtAsset, 'for', totalDayCount, 'days. Total interest paid ', totalInterestPaid, borrowingVault.debtAsset);

  /*
  - how much total interest paid with rebalancing
  - how much total interest paid with aavev2
  - how much total interest paid with compound
  */

}

export default function App() {
  const [collateral, setCollateral] = useState('');
  const handleCollateralChange = (e) => {
    setCollateral(e.target.value);
  }

  const [borrowed, setBorrowed] = useState('');
  const handleBorrowedChange = (e) => {
    setBorrowed(e.target.value);
  }

  /* Handling checkboxes for lending provider selection */
  const [isCompoundChecked, setIsCompoundChecked] = useState(false);
  const handleCompoundOnChange = () => {
    setIsCompoundChecked(!isCompoundChecked);
  };

  const [isAavev2Checked, setIsAavev2Checked] = useState(false);
  const handleAavev2OnChange = () => {
    setIsAavev2Checked(!isAavev2Checked);
  };

  const simStartDate = useRef()
  const simEndDate = useRef()

  async function calculateInterest() {
    let startDateInput = simStartDate.current.value;
    let endDateInput = simEndDate.current.value;

    if (!borrowed || !collateral) {
      console.log('Warning: Select a collateral and borrowed asset.');
      return
    } 

    // let lendingProviders = ['aavev2', 'compound'];
    let lendingProviders = [];
    if (isCompoundChecked) {
      lendingProviders.push("compound");
    }
    if (isAavev2Checked) {
      lendingProviders.push("aavev2");
    }

    console.log('Selected lending providers areee:', lendingProviders);

    let ir = new supplyInterestRates(collateral, borrowed, lendingProviders);
    let borrowingVault = new simulatedVault(collateral, 1000,
      borrowed, 4e5,
      lendingProviders);
    // let rebalance = new simulaterebalancing(borrowingVault, ir);

    simRebalance(startDateInput, endDateInput, borrowingVault, ir);
  }

  return (
    <main>
      <h1>Simulate borrowing (beta)</h1>
      <br></br>
      <fieldset>
        <legend> Collateral asset: </legend>
        <form>
          <input type="radio" value="ETH" id="ETH" onChange={handleCollateralChange} name="collateral" /> ETH
          <br></br>
          <input type="radio" value="FTT" id="FTT" onChange={handleCollateralChange} name="collateral" /> FTT (bad idea)
        </form>
      </fieldset>

      <br></br>
      <fieldset>
        <legend>Borrowed asset:</legend>
        <form>
          <input type="radio" value="USDC" id="USDC" onChange={handleBorrowedChange} name="borrowed" /> USDC
          <br></br>
          <input type="radio" value="FTT" id="FTT" onChange={handleBorrowedChange} name="borrowed" /> Something else (not functional)
        </form>
      </fieldset>
      <br></br>

      Lending providers: <br></br>
      <input type="checkbox" id="provider-1" name="compound" value="compound" checked={isCompoundChecked} onChange={handleCompoundOnChange} /> Compound <br></br>
      <input type="checkbox" id="provider-2" name="aavev2" value="aavev2" checked={isAavev2Checked} onChange={handleAavev2OnChange} /> Aave V2 <br></br>
      <br></br>
      <div className="result">
        Above checkbox is {isCompoundChecked ? "checked" : "unchecked"} and {isAavev2Checked ? "checked" : "unchecked"} .
      </div>

      Start date (mm/dd/yyyy): <input ref={simStartDate} type="text" /> <br></br>
      End date (mm/dd/yyyy):  <input ref={simEndDate} type="text" /> <br></br>
      <br></br>
      <br></br>
      <button onClick={calculateInterest}> Calculate interest </button>
    </main>
  )
}
