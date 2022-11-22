# Test Aave V2 simulator with on-chain borrowings

## Aim

Test the accurcay of the simulated total interest paid, calculated by aave-v2-api.js, with on-chain user borrow-repay session. 

Aave Lending Pool V2 address: 0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9

## Test case 1

### Total accrued interest from on-chain session

User account: 0x7a2a29462d15c63ecc094690f93bbd47c4ced549

Transactions from account to Aave Lending Pool: https://etherscan.io/address/0x7a2a29462d15c63ecc094690f93bbd47c4ced549?toaddress=0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9

Borrow transaction: https://etherscan.io/tx/0x6b34ffa6ab9402d7484ce76870091cd718833b9fdbbd425f8005920833bb0bc2
    - This is the only borrow done of Dai at variable rate by the user.
    - Borrow amount: 500 DAI
        - Date: Jul-21-2022 12:53:05 UTC
        - User mints 500 "Aave variable debt bearing DAI"
        - User receives 500 Dai from "Aave: aDAI Token V2"

Repay transaction: https://etherscan.io/tx/0xacd3f09e34afe5c99023e97bef38416e0ec040f1f9b45580114b3a13bd2ecce8
    - Partial repay of 450.3 Dai to Aave Protocol V2
        - Date: Nov-10-2022 08:16:23 UTC
        - User burns 450.3 "Aave variable debt bearing DAI"
        - User pays back 450.3 Dai to "Aave: aDAI Token V2"

User left with 52.846284120172025936 "Aave variable debt bearing DAI" (non-transferrable) in wallet (on Nov-10-2022)

Total accrued "Aave variable debt bearing DAI" at payback was: 450.3 + 52.846284120172025936 = 503.146284120172025936

So total interest on 500 Dai from Jul-21-2022 12:53:05 UTC to Nov-10-2022 08:16:23 UTC: 3.146284120172025936 Dai

### Simulated total paid interest

Running: node Benchmarks/aave-v2-api.js

```
Borrowed on: 2022-07-21T12:53:05.000Z
Payback on: 2022-11-10T08:16:23.000Z
Total interest paid on borrowing 500 Dai for 113 days with variable rate: 3.0229190989715473 Dai
```

### Conclusion Test Case 1

The on-chain accrued interest is 3.146284120172025936 Dai, the simulated total interest paid is 3.0229190989715473 Dai. So the error between on-chain value and simulated value is only 3.92%. Which is good, given the resolution of the variable APY rates in the simulated data is 24 hours. 

## Test Case 2: very short loan

### Total accrued interest from on-chain session

User account: 0x42dfF40B8b29627a80E84CcC3a73b18A5fE80617

Transactions from account to Aave Lending Pool: https://etherscan.io/address/0x42dff40b8b29627a80e84ccc3a73b18a5fe80617?toaddress=0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9

Borrow transaction: https://etherscan.io/tx/0xcdcba8e35f097b39dc195ee2820f6672a4f310bba1cbbf88bb7875f595c30cfa
    - Borrow amount: 180 USDC
        - Date: Nov-08-2022 00:54:11 UTC
        - User mints 180 "Aave variable debt bearing USDC"
        - User receives 180 USDC from "Aave: aUSDC Token V2"

Repay transaction: https://etherscan.io/tx/0xa7002e7b1975f9ae06c3d1fb9f2c71e7e36e22ef31d922841223ca737bd212d0
    - Repay full amount: 
        - Date: Nov-10-2022 06:27:47 UTC
        - User burns 180.025014 "Aave variable debt bearing USDC"
        - User pays back 180.025014 USDC to "Aave: aUSDC Token V2"

So total interest on 180 USDC from Nov-08-2022 00:54:11 UTC to Nov-10-2022 06:27:47 UTC: 0.025014 USDC.

### Simulated total paid interest

Running: node Benchmarks/aave-v2-api.js

Because the total length of the laon is 2 days and 6 hours, I drop the 'resolutionInHours' from 24 to 6 hours. 

```
Borrowed on: 2022-11-08T00:54:11.000Z
Payback on: 2022-11-10T06:27:47.000Z
Total interest paid on borrowing 180 USDC for 2 days with variable rate: 0.026289505534367128 USDC
```

### Conclusion Test Case 2

The on-chain paid interest is 0.025014 USDC, the simulated interest is 0.026289505534367128 USDC. So the error between on-chain value and simulated value is 5.09%. Which is acceptable, especially for such a short loan.

If I drop the 'resolutionInHours' from 6 hours to 1 hour, the simulated paid interest is 0.024318618657893993 USDC. Then the error compared to the on-chain value drops to 2.78%. 

## General conclusion

The aave-v2-api.js simulator works accurate enough for our purpose. 
