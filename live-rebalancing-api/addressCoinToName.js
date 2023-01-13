// This file is used to ensure the same name is used as in Pools.js,
// so the DefiLlama API data can be compared with data read from the contract 
// DefiLlama "symbol" variable dictates the name convention.
const providerAddressName = {
    // This entry can be removed, here to try on testnet
    // name() in contract returns 'Test DAI', 
    // but 'symbol' in DefiLlama's API endpoint 'pools' is 'DAI'
    '0x918Cfff6AB82f5a28623b08Babd2893963A27AAC': 'DAI',
};

module.exports = providerAddressName;