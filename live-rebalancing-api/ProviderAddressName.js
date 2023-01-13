// This file is used to ensure the same name is used as in Pools.js,
// so the DefiLlama API data can be compared with data read from the contract 
// DefiLlama "project" variable dictates the name convention.
const providerAddressName = {
    // Can be removed, here to try on testnet
    '0x72d763fbD586C5fF7ECc657ab884F2539eBC6a74': 'euler',
    '0xbE55f76cC3f4409C320c8F8D5AF1220c914F7B54': 'aave-v2'
};

module.exports = providerAddressName;