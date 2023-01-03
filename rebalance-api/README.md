# Rebalance API

This can be called from the front end to simulate the total interest paid by user in one API call.

The API is build using the Hapi framework: https://hapi.dev/

## Usage guide to host and test the API locally

From RebalanceAPI directory, run:  
``node index.js``

This will return where the server is running:  
``Server running on http://0.0.0.0:53972``

Then you can call the API from localhost (adjust the port number if needed) . Example query:  
``curl -X 'GET' 'http://0.0.0.0:53972/calculateTotalInterest/startDate=09-19-2022&endDate=11-17-2022&collateralAsset=ETH&borrowedAsset=USDC&lendingProviders=aavev2,compound,euler'``  

This will return:  
``{"totalInterestPaid":1209.9423361008921,"totalDayCount":58}``


Note:   
- "startDate" and "endDate" format: MM-DD-YYYY  
- lendingProvoders are comma separated. Available proivders can be found in: Pools.js  

## Hosting the API on Google Cloud

We build a container image from the API. Goodle Cloud Run allows us to run containers directly on top its infrastructure. Its scalability and security are key features.

To build the container and deploy it on Cloud Run, run this command from the source code directory:  
``gcloud run deploy``

In case of problems, this quickstart is a good guide: https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service

To debug deployment issues, build and run the container locally. Here is a good guide: https://docs.docker.com/get-started/02_our_app/

TODO:   
- integrate API with React app  

