# Axelar cross-chain dApp starter kit

## Introduction

This repo provides a basic template to quickly bootstrap your application using the [Axelar Local Development Environment](https://github.com/axelarnetwork/axelar-local-dev), which simulates the relay of messages cross-chain, on the backend.

The code provides a basic scaffold for:

-   Solidity contract templates (`contract_templates` directory)
-   a web interface (`web` directory)

Once ready, you can use this repo to deploy your contracts to testnet and mainnet.

**Note:** In addition, we have a full suite of examples for various use cases [here](https://github.com/axelarnetwork/axelar-local-gmp-examples), for additional inspiration.

## One-time setup

Install [nodejs](https://nodejs.org/en/download/). Run `node -v` to check your installation.

Clone this repo:

```bash
git clone https://github.com/axelarnetwork/axelar-dapp-starter-kit.git
```

Install dependencies:

```bash
npm update && npm install
```

## Build

1. In order to run your application against the local emulator, cd to the root directory of this project and run

```bash
npm run run-local-env
```

NOTE: Leave this node running on a separate terminal before deploying and testing the dApps.

2. Build upon the existing Solidity templates. Each solidity template includes an opinionated structure for the contracts. In general, you will find that these contracts:

-   are of type `IAxelarExecutable`
-   are intended to be a single representative contract that are deployed on all chains.
-   includes basic implementation for `methodOnSrcChain`, which:
    -   is invoked on the source chain
    -   has a built-in method for paying the gas receiver in native tokens
    -   invokes the relevant cross-chain method (i.e. `callContract` or `callContractWithToken`) on the gateway contract on the source chain
-   includes `_execute` (for `callContract`) and `_executeWithToken` (for `callContractWithToken`) internal methods
    -   is invoked on the destination chain
    -   requires your own code logic (thus the "your custom code here" directive!)

Of course, these are just templates for basic usage. Please see `axelar-local-gmp-examples` for more advanced usage/examples.

3. Deploy your application locally.

```bash
npm run build
npm run deploy <TEMPLATE_DIRECTORY> <ENVIRONMENT>
```

e.g. `npm run deploy CallContractWithToken local`

4.

### Call contract with token

Send aUSDC from source-chain to destination-chain and distribute it equally among all accounts specified.

Deploy:

```bash
node scripts/deploy examples/call-contract-with-token [local|testnet]
```

Run the test:

```bash
node scripts/test examples/call-contract-with-token [local|testnet] ${"source-chain"} ${"destination-chain"} ${amount} ${account} ${account2} ...
```

#### Example

```bash
node scripts/deploy examples/call-contract-with-token local
node scripts/test examples/call-contract-with-token local "Moonbeam" "Ethereum" 100 0xBa86A5719722B02a5D5e388999C25f3333c7A9fb
```

Output:

```
--- Initially ---
0xBa86A5719722B02a5D5e388999C25f3333c7A9fb has 100 aUSDC
--- After ---
0xBa86A5719722B02a5D5e388999C25f3333c7A9fb has 199 aUSDC
```
