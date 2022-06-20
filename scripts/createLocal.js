require('dotenv').config();
const { createAndExport, utils: { setJSON, deployContract } } = require('@axelar-network/axelar-local-dev');
const { Wallet, utils: {keccak256, defaultAbiCoder} } = require('ethers');
const fs = require("fs");

const ConstAddressDeployer = require('axelar-utils-solidity/dist/ConstAddressDeployer.json');

(async () => {
    const deployer_key = keccak256(defaultAbiCoder.encode(['string'], [process.env.EVM_MNEMONIC]));
    const deployer_address = new Wallet(deployer_key).address;
    const weth_addresses = {};

    async function callback(chain, info) {
        await chain.giveToken(deployer_address, 'aUSDC', 100e6);
        const contract = await deployContract(new Wallet(deployer_key, chain.provider), ConstAddressDeployer);
        info.constAddressDeployer = contract.address;
    }

    const toFund = [deployer_address]

    for(let j=2; j<process.argv.length; j++) {
        console.log("canh?",process.argv[j])
        toFund.push(process.argv[j]);
    }

    await createAndExport({
        chainOutputPath: "./info/local.json",
        accountsToFund: toFund,
        callback: callback,
    });

    fs.copyFile("./info/local.json", "./web/info/local.json", (err) => {
        if (err) throw err;
    });
})();