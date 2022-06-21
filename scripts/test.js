'use strict';

require('dotenv').config();
const { utils: { setJSON }, testnetInfo } = require('@axelar-network/axelar-local-dev');
const { AxelarQueryAPI } = require('@axelar-network/axelarjs-sdk');
const {  Wallet, getDefaultProvider, constants: { AddressZero } } = require('ethers');
const { keccak256, defaultAbiCoder } = require('ethers/lib/utils');
const { GasCostLogger } = require('./gasCosts');
const { getGasPrice, getDepositAddress } = require('./utils.js');

const example = require(`../contract_templates/${process.argv[2]}/index.js`);
const axelarApi = new AxelarQueryAPI({ environment: "testnet"})

const env = process.argv[3];
if(env == null || (env != 'testnet' && env != 'local')) throw new Error('Need to specify tesntet or local as an argument to this script.');
let temp;
if(env == 'local') {
    temp = require(`../info/local.json`);
} else {
    try {
        temp = require(`../info/testnet.json`);
    } catch {
        temp = testnetInfo;
    }
}
const chains = temp;
const args = process.argv.slice(4);

const private_key = keccak256(defaultAbiCoder.encode(['string'], [process.env.EVM_MNEMONIC]));
const wallet = new Wallet(private_key);

function wrappedGetGasPrice(sourceChainName, destinationChainName, tokenSymbol) {
    return axelarApi.estimateGasFee(sourceChainName, destinationChainName, tokenSymbol);
}
function wrappedGetDepositAddress(source, destination, destinationAddress, symbol) {
    return getDepositAddress(env, source, destination, destinationAddress, symbol);
}
(async () => {
    
    await example.test(chains, wallet, {
        getGasPrice: wrappedGetGasPrice, 
        getDepositAddress: wrappedGetDepositAddress,
        args: args
    });
})();