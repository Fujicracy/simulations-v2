const pools = {
    'Mainnet': {
        'USDC': {
          'aavev2': 'a349fea4-d780-4e16-973e-70ca9b606db2',
          // 'aavev3': '', // not yet on Mainnet in DefiLlama
          'compound': 'cefa9bb8-c230-459a-a855-3b94e96acd8c',
          'compoundv3': '7da72d09-56ca-4ec5-a45f-59114353e487',
          'euler': '61b7623c-9ac2-4a73-a748-8db0b1c8c5bc',
        },
        'DAI': {
          'aavev2': '405d8dad-5c99-4c91-90d3-82813ade1ff1',
          // 'aavev3': '', // not yet on Mainnet in DefiLlama
          'compound': 'cc110152-36c2-4e10-9c12-c5b4eb662143',
          // 'compoundv3': '', // not yet on Mainnet in DefiLlama
          'euler': 'c256de58-4176-49f9-99af-f48226573bb5',
        },
        'USDT': {
          'aavev2': '60d657c9-5f63-4771-a85b-2cf8d507ec00',
          // 'aavev3': '', // not yet on Mainnet in DefiLlama
          'compound': '57647093-2868-4e65-97ab-9cae8ec74e7d',
          // 'compoundv3': '', // not yet on Mainnet in DefiLlama
          // 'euler': '', // not yet on Mainnet in DefiLlama
        }
    },
  // For testing purposes, can be deleted later:
  'goerli': {
    'DAI': {
      'aave-v2': '405d8dad-5c99-4c91-90d3-82813ade1ff1',
      'compound': 'cc110152-36c2-4e10-9c12-c5b4eb662143',
      'euler': 'c256de58-4176-49f9-99af-f48226573bb5',
    }
  }
};

module.exports = pools;