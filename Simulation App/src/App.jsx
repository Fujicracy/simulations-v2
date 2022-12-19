import './App.css'
import { supplyInterestRates, simulatedVault, simRebalance } from './calcInterest'
import React, { useState, useRef } from 'react';

export default function App() {
  const [collateral, setCollateral] = useState();
  const handleCollateralChange = (e) => {
    setCollateral(e.target.value);
  }

  const [borrowed, setBorrowed] = useState();
  const handleBorrowedChange = (e) => {
    setBorrowed(e.target.value);
  }

  /* Handling checkboxes for lending provider selection */
  const [isCompoundChecked, setIsCompoundChecked] = useState(true);
  const handleCompoundOnChange = () => {
    setIsCompoundChecked(!isCompoundChecked);
  };

  const [isAavev2Checked, setIsAavev2Checked] = useState(true);
  const handleAavev2OnChange = () => {
    setIsAavev2Checked(!isAavev2Checked);
  };

  const [isEulerChecked, setIsEulerChecked] = useState(true);
  const handleEulerOnChange = () => {
    setIsEulerChecked(!isEulerChecked);
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

    let lendingProviders = [];
    if (isCompoundChecked) {
      lendingProviders.push("compound");
    }
    if (isAavev2Checked) {
      lendingProviders.push("aavev2");
    }
    if (isEulerChecked) {
      lendingProviders.push("euler");
    }

    console.log('Selected lending providers areee:', lendingProviders);

    let ir = new supplyInterestRates(collateral, borrowed, lendingProviders);
    let borrowingVault = new simulatedVault(collateral, 1000,
      borrowed, borrowedAmount, lendingProviders);

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
          <input type="radio" value="FTT" id="FTT" onChange={handleCollateralChange} name="collateral" /> Coming soon...
        </form>
      </fieldset>

      <br></br>
      <fieldset>
        <legend>Borrowed asset:</legend>
        <form>
          <input type="radio" value="USDC" id="USDC" onChange={handleBorrowedChange} name="borrowed" /> USDC
          <br></br>
          <input type="radio" value="FTT" id="FTT" onChange={handleBorrowedChange} name="borrowed" /> Coming soon...
        </form>
        Borrowed Amount: <input ref={simBorrowedAmount} type="text" /> <br></br>
      </fieldset>
      <br></br>

      Lending providers: <br></br>
      <input type="checkbox" id="provider-1" name="compound" value="compound" checked={isCompoundChecked} onChange={handleCompoundOnChange} /> Compound <br></br>
      <input type="checkbox" id="provider-2" name="aavev2" value="aavev2" checked={isAavev2Checked} onChange={handleAavev2OnChange} /> Aave V2 <br></br>
      <input type="checkbox" id="provider-3" name="euler" value="euler" checked={isEulerChecked} onChange={handleEulerOnChange} /> Euler <br></br>
      <br></br>

      Start date (mm/dd/yyyy): <input ref={simStartDate} type="text" /> <br></br>
      End date (mm/dd/yyyy):  <input ref={simEndDate} type="text" /> <br></br>
      <br></br>
      <br></br>
      <button onClick={calculateInterest}> Calculate interest </button>
    </main>
  )
}
