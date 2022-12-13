import './App.css'
import { supplyInterestRates, simulatedVault, simulaterebalancing } from './calcInterest'
import React, { useState, useRef } from 'react';

async function simRebalance(startDateInput, endDateInput, borrowingVault, ir) {

  let lendingProviders = borrowingVault.lendingProviders;

  let allProviderData = await ir.getAllProviderData();
  let borrowAPYs = await ir.formatProviderData(allProviderData);

  let startDate = new Date(startDateInput);
  let endDate = new Date(endDateInput);

  borrowingVault.initProviderDistribution();

  for (let date in borrowAPYs) {

    let min = {};
    for (let provider in borrowAPYs[date]) {
        if (min['apyBaseBorrow'] == undefined || borrowAPYs[date][provider]['apyBaseBorrow'] < min['apyBaseBorrow']) {
          min['apyBaseBorrow'] = borrowAPYs[date][provider]['apyBaseBorrow'];
          min['totalBorrowUsd'] = borrowAPYs[date][provider]['totalBorrowUsd'];
          min['provider'] = provider;
        }
    }

    // initialize provider distribution
    if (borrowingVault.providerDistrTotal() == 0) {
      borrowingVault.providerDistribution[min['provider']] = 1;
      // TODO: track slippage
    }

    let amountToTransfer = borrowingVault.debtAmount;
    for (let provider in borrowAPYs[date]) {
        if ( min['apyBaseBorrow'] < borrowAPYs[date][provider]['apyBaseBorrow'] - 0.5 ) {
            let maxSlippage = borrowAPYs[date][provider]['apyBaseBorrow'] - min['apyBaseBorrow'] - 0.5;
            let maxTransferAmount = borrowingVault.maxTransferAmount(
                min['totalBorrowUsd'],
                maxSlippage);
            
            if (borrowingVault.providerDistrTotal() != 0 && borrowingVault.providerDistribution[provider] != 0) {
                amountToTransfer *= borrowingVault.providerDistribution[provider];
            }

            if (amountToTransfer > maxTransferAmount) {
                amountToTransfer = maxTransferAmount;
            }

            borrowingVault.transferDebt(provider, min['provider'], amountToTransfer / borrowingVault.debtAmount);

            // rebalance.logResults(date, borrowAPYs[date], maxSlippage, min['totalBorrowUsd'], maxTransferAmount, amountToTransfer, borrowingVault.providerDistribution);
        }
    }
    
    // TODO get price to convert the debt asset to USD - okay now becasue we use USDC

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
  const simBorrowedAmount = useRef()

  async function calculateInterest() {
    let startDateInput = simStartDate.current.value;
    let endDateInput = simEndDate.current.value;

    let borrowedAmount = simBorrowedAmount.current.value;

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
      borrowed, borrowedAmount,
      lendingProviders);
    // let rebalance = new simulaterebalancing(borrowingVault, ir);

    simRebalance(startDateInput, endDateInput, borrowingVault, ir);
  }

  return (
    <main>
      <h1>Simulate Borrowing Vault (beta)</h1>
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
        Borrowed Amount: <input ref={simBorrowedAmount} type="text" /> <br></br>
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
