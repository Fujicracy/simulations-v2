# Rebalance API

This can be called from the front end to simulate the total interest paid by user in one API call.

The API is build using the Hapi framework: https://hapi.dev/

## Usage guide

From RebalanceAPI directory, run:  
``node rebalanceAPI.js``

This will return:  
``Server running on http://localhost:3000``

Then you can call the API from localhost, port 3000. Example query:  
``http://localhost:3000/calculateTotalInterest/startDate=09-19-2022&endDate=11-17-2022&collateralAsset=ETH&borrowedAsset=USDC&lendingProviders=aavev2,compound,euler``  

This will return:  
``{"totalInterestPaid":1209.9423361008921,"totalDayCount":58}``


Note:   
- "startDate" and "endDate" format: MM-DD-YYYY  
- lendingProvoders are comma separated. Available proivders can be found in: Pools.js  

TODO:   
- host API  
- integrate API with React app  

