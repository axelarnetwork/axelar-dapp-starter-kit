import { useEffect, useState } from "react";
import { getDefaultProvider, Contract, AddressZero, Wallet } from "ethers";
import { keccak256, defaultAbiCoder } from "ethers/lib/utils";
import NetworkInfo from "../info/local.json";
import ContractABI from "../utils/CallContractWithToken.json";
import IERC20 from "../utils/IERC20.json";
import Gateway from "../utils/IAxelarGateway.json";
import { getGasPrice } from "../utils/getGasPrice";
import { checkIfWalletIsConnected } from "../utils/checkIfWalletIsConnected";
import { checkCorrectNetwork } from "../utils/checkCorrectNetwork";
import { ChainList } from "../utils/ChainList.js";

const app = () => {
    const [currentAccount, setCurrentAccount] = useState("");
    const [correctNetwork, setCorrectNetwork] = useState(false);
    const [devChainId, setDevChainId] = useState(2501);
    const [srcChain, setSrcChain] = useState(ChainList[0]);
    const [destChain, setDestChain] = useState(ChainList[1]);
    const [amountToSend, setAmtToSend] = useState(10);
    const [environment] = useState("local");

    useEffect(() => {
        checkIfWalletIsConnected(setCurrentAccount);
        checkCorrectNetwork(devChainId, setCorrectNetwork);
    }, []);

    const executeCallContractWithToken = async () => {
        const source = srcChain
            ? NetworkInfo.find((chain) => chain.name.toLowerCase() === srcChain.name.toLowerCase())
            : "Avalanche";
        const destination = destChain
            ? NetworkInfo.find((chain) => chain.name.toLowerCase() === destChain.name.toLowerCase())
            : "Moonbeam";
        const amount = Math.floor(parseFloat(amountToSend)) * 1e6 || 10e6;
        const mnemonic = process.env.NEXT_PUBLIC_EVM_MNEMONIC;
        const private_key = keccak256(defaultAbiCoder.encode(["string"], [mnemonic]));
        const wallet = new Wallet(private_key);

        for (const chain of [source, destination]) {
            const provider = getDefaultProvider(chain.rpc);
            chain.wallet = wallet.connect(provider);
            chain.contract = new Contract(
                chain.contractCallWithToken,
                ContractABI.abi,
                chain.wallet
            );
            chain.gatewayContract = new Contract(chain.gateway, Gateway.abi, chain.wallet);
            const usdcAddress = await chain.gatewayContract.tokenAddresses("aUSDC");
            chain.usdc = new Contract(usdcAddress, IERC20.abi, chain.wallet);
        }

        const gasLimit = 3e6;
        const gasPrice = await getGasPrice(environment, source, destination, AddressZero);

        const samplePayload = defaultAbiCoder.encode(
            ["string"],
            ["this is a sample payload string"]
        );

        debugger;

        await (await source.usdc.approve(source.contract.address, amount)).wait();

        debugger;

        const tx = await (
            await source.contract.methodOnSrcChain(
                destination.name,
                destination.contractCallWithToken,
                samplePayload,
                "aUSDC",
                amount,
                { value: BigInt(Math.floor(gasLimit * gasPrice)) }
            )
        ).wait();
        console.log("tx!", tx);
        return tx;
    };

    return (
        <div className="flex flex-col items-center pt-32 bg-[#0B132B] text-[#d3d3d3] min-h-screen">
            <h2 className="text-3xl font-bold mb-20 mt-12">
                Sample ContractCallWithToken: Your code here!
            </h2>
            <button onClick={executeCallContractWithToken}>Execute</button>
        </div>
    );
};

export default app;
