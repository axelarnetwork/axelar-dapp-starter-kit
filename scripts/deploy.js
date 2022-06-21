'use strict';

require('dotenv').config();
const { utils: { setJSON}, testnetInfo } = require('@axelar-network/axelar-local-dev');
const {  Wallet, getDefaultProvider } = require('ethers');
const { keccak256, defaultAbiCoder } = require('ethers/lib/utils');
const { GasCostLogger } = require('./gasCosts');
const fs = require("fs");

const example = require(`../contract_templates/${process.argv[2]}/index.js`);

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

const private_key = keccak256(defaultAbiCoder.encode(['string'], [process.env.EVM_MNEMONIC]));
const wallet = new Wallet(private_key);

(async () => {
    const promises = [];
    for(const name in chains) {
        const rpc = chains[name].rpc;
        const provider = getDefaultProvider(rpc);
        promises.push(example.deploy(chains[name], wallet.connect(provider)));
    }
    await Promise.all(promises);
    if(example.postDeploy) {
        for(const name in chains) {
            const rpc = chains[name].rpc;
            const provider = getDefaultProvider(rpc);
            promises.push(example.postDeploy(chains[name], chains, wallet.connect(provider)));
        }
        await Promise.all(promises);
    }
    setJSON(chains, `./info/${env}.json`);
    setJSON(chains, `./web/info/${env}.json`);

    fs.copyFile(`./build/${process.argv[2]}.json`, `./web/utils/${process.argv[2]}.json`, (err) => {
        if (err) throw err;
    });
    fs.copyFile(`./build/IAxelarGateway.json`, `./web/utils/IAxelarGateway.json`, (err) => {
        if (err) throw err;
    });
    fs.copyFile(`./build/IERC20.json`, `./web/utils/IERC20.json`, (err) => {
        if (err) throw err;
    });
})();