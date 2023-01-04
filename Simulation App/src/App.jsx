import './App.css'
import { supplyInterestRates, simulatedVault, simRebalance } from './calcInterest'
import React, { useState, useRef } from 'react';
import { pools } from './utils/Pools';

export default function App() {
  let borrowedAssetArray = Object.keys(pools['Mainnet']);
  let defaultDebt = borrowedAssetArray[0];
  let lendingProviderArray = Object.keys(pools['Mainnet'][defaultDebt]);

  let createCheckbox = (name, index) => (
    <input
      type="checkbox"
      id={`custom-checkbox-${index}`}
      name={name}
      value={name}
      checked={checkedState[index]}
      onChange={() => handleOnChange(index)}
    />
  )

  const [checkedState, setCheckedState] = useState(
    new Array(lendingProviderArray.length).fill(false)
  );

  const handleOnChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) =>
      index === position ? !item : item
    );

    setCheckedState(updatedCheckedState);
  };

  const [collateral, setCollateral] = useState('ETH');
  const handleCollateralChange = (e) => {
    setCollateral(e.target.value);
  }

  const [borrowed, setBorrowed] = useState(defaultDebt);
  const handleBorrowedChange = (e) => {
    setBorrowed(e.target.value);

    lendingProviderArray = Object.keys(pools['Mainnet'][e.target.value]);
    const updatedCheckedState = new Array(lendingProviderArray.length).fill(false);
    setCheckedState(updatedCheckedState);
  }

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

    lendingProviderArray = Object.keys(pools['Mainnet'][borrowed]);
    for (let i = 0; i < lendingProviderArray.length; i++) {
      if (checkedState[i] == true) {
        lendingProviders.push(lendingProviderArray[i]);
      }
    }

    console.log('Selected lending providers:', lendingProviders);
    console.log('The borrowed asset is', { borrowed });

    let ir = new supplyInterestRates(collateral, borrowed, lendingProviders);
    let borrowingVault = new simulatedVault(collateral, 1000,
      borrowed, borrowedAmount, lendingProviders);

    return simRebalance(startDateInput, endDateInput, borrowingVault, ir);
  }

  return (
    <main>
      <h1>Simulate Borrowing Vault (beta) </h1>
      <br></br>

      <fieldset>
        <legend> Collateral asset: </legend>
        <form>
          <input type="radio" name="collateral" value="ETH" id="ETH" onChange={handleCollateralChange} defaultChecked /> ETH
        </form>
      </fieldset>

      <br></br>

      <fieldset>
        <legend>Borrowed asset:</legend>
        <form>
          {borrowedAssetArray.map((name, index) => {
            return (
              <div className="borrowed-asset-section">
                <input type="radio" name="borrowed" value={name} id={name} onChange={handleBorrowedChange} checked={borrowed == name} />
                <label htmlFor={`borrowed-checkbox-${index}`}>{name}</label>
              </div>
            );
          })}
        </form>
        <br></br>
        Borrowed Amount: <input ref={simBorrowedAmount} type="text" /> <br></br>
      </fieldset>
      <br></br>

      <div className="lending-providers"> Lending providers:
        <ul className="provider-list">
          {
            Object.keys(pools['Mainnet'][borrowed]).map((name, index) => {
              return (
                <div className="provider-list-item">
                  {createCheckbox(name, index)}
                  <label htmlFor={`custom-checkbox-${index}`}>{name}</label>
                </div>
              );
            })
          }
        </ul>
      </div>

      Start date (mm/dd/yyyy): <input ref={simStartDate} type="text" /> <br></br>
      End date (mm/dd/yyyy):  <input ref={simEndDate} type="text" /> <br></br>
      <br></br>
      <br></br>

      <button onClick={calculateInterest}> Calculate interest </button>
    </main>
  )
}
