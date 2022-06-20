//index.js

import { useState, useEffect } from "react";
import { ethers, getDefaultProvider, Contract, AddressZero, Wallet } from "ethers";
import { keccak256, defaultAbiCoder } from "ethers/lib/utils";
import Loader from "react-loader-spinner";
import NetworkInfo from "../info/local.json";
import ContractABI from "../utils/CallContractWithToken.json";
import IERC20 from "../utils/IERC20.json";
import Gateway from "../utils/IAxelarGateway.json";
import { ChainList } from "../utils/ChainList.js";
import { TextInput } from "./components/TextInput.js";
import { getGasPrice } from "../utils/getGasPrice";
import { connectWallet } from "../utils/connectWallet";
import { checkIfWalletIsConnected } from "../utils/checkIfWalletIsConnected";
import { checkCorrectNetwork } from "../utils/checkCorrectNetwork";

const app = () => {
    const [miningStatus, setMiningStatus] = useState(null);
    const [loadingState, setLoadingState] = useState(0);
    const [needInput, setNeedInput] = useState(true);
    const [txError, setTxError] = useState(null);
    const [currentAccount, setCurrentAccount] = useState("");
    const [correctNetwork, setCorrectNetwork] = useState(false);
    const [devChainId, setDevChainId] = useState(2501);
    const [srcChain, setSrcChain] = useState(ChainList[0]);
    const [destChain, setDestChain] = useState(ChainList[1]);
    const [destAddresses, setDestAddresses] = useState([]);
    const [amountToSend, setAmountToSend] = useState(0);
    const [environment, setEnvironment] = useState("local");

    useEffect(() => {
        checkIfWalletIsConnected(setCurrentAccount);
        checkCorrectNetwork(devChainId, setCorrectNetwork);
    }, []);

    const executeCallContractWithToken = async () => {
        setNeedInput(false);
        const source = NetworkInfo.find(
            (chain) => chain.name.toLowerCase() === srcChain.name.toLowerCase()
        );
        const destination = NetworkInfo.find(
            (chain) => chain.name.toLowerCase() === destChain.name.toLowerCase()
        );
        const amount = Math.floor(parseFloat(amountToSend)) * 1e6 || 10e6;
        const private_key = keccak256(
            defaultAbiCoder.encode(
                ["string"],
                ["this is a random string to get a random account. You need to provide the private key for a funded account here."]
            )
        );
        const wallet = new Wallet(private_key);
        console.log("wallet address", private_key, await wallet.getAddress())

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
            console.log("aUSDC address for chain", chain.rpc, usdcAddress);
            chain.usdc = new Contract(usdcAddress, IERC20.abi, chain.wallet);
        }

        async function print() {
            for (const account of destAddresses) {
                console.log(
                    `${wallet.address} has ${
                        (await source.usdc.balanceOf(account)) / 1e6
                    } aUSDC on ${source.name}`
                );
                console.log(
                    `${account} has ${(await destination.usdc.balanceOf(account)) / 1e6} aUSDC on ${
                        destination.name
                    }`
                );
            }
        }

        function sleep(ms) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, ms);
            });
        }

        const gasLimit = 3e6;
        const gasPrice = await getGasPrice(environment, source, destination, AddressZero);
        setMiningStatus(0);
        setLoadingState(0);

        const balance = BigInt(await destination.usdc.balanceOf(destAddresses[0]));
        await (await source.usdc.approve(source.contract.address, amount)).wait();
        const tx = await (
            await source.contract.methodOnSrcChain(
                destination.name,
                destination.contractCallWithToken,
                destAddresses,
                "aUSDC",
                amount,
                { value: BigInt(Math.floor(gasLimit * gasPrice)) }
            )
        ).wait();
        console.log("tx", tx);
        while (BigInt(await destination.usdc.balanceOf(destAddresses[0])) == balance) {
            await sleep(2000);
        }
        setLoadingState(1);
        console.log("--- After ---");
        await print();
    };

    return (
        <div className="flex flex-col items-center pt-32 bg-[#0B132B] text-[#d3d3d3] min-h-screen">
            <h2 className="text-3xl font-bold mb-20 mt-12">
                Sample ContractCallWithToken: Let's airdrop!
            </h2>
            {currentAccount === "" ? (
                <button
                    className="text-2xl font-bold py-3 px-12 bg-black shadow-lg shadow-[#6FFFE9] rounded-lg mb-10 hover:scale-105 transition duration-500 ease-in-out"
                    onClick={connectWallet}
                >
                    Connect Wallet
                </button>
            ) : correctNetwork ? (
                needInput && (
                    <div class="bg-base-100 shadow-xl w-4/6">
                        <div class="grid grid-cols-2 gap-10 ">
                            {" "}
                            {ChainCard(srcChain, (option) => {
                                setSrcChain(option);
                                setDevChainId(
                                    NetworkInfo.find(
                                        (network) =>
                                            network.name.toLowerCase() === option.name.toLowerCase()
                                    )?.chainId
                                );
                            })}
                            {ChainCard(destChain, (option) => setDestChain(option))}
                        </div>
                        <div className="flex flex-col justify-center items-center mb-10 font-bold text-2xl">
                            <div class="form-control">
                                <label class="label">
                                    <span class="label-text">Enter aUSDC amount</span>
                                </label>
                                <label class="input-group">
                                    <input
                                        type="text"
                                        placeholder="5"
                                        class="input input-bordered"
                                        onChange={(e) => setAmountToSend(e.target.value)}
                                    />
                                    <span>aUSDC</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex flex-col justify-center items-center mb-10 font-bold text-2xl">
                            <TextInput
                                className={"w-1/2"}
                                cb={(addr) => setDestAddresses([...destAddresses, addr])}
                            />
                        </div>
                        <div className="flex flex-row justify-center items-center mb-10 font-bold text-2xl gap-2">
                            {destAddresses?.map((addr) => (
                                <div class="badge badge-primary">
                                    {addr.slice(0, 5) + "..." + addr.slice(35)}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-row justify-center items-center mb-10 font-bold text-2xl gap-2">
                            <button
                                className="text-2xl font-bold py-3 px-12 bg-black rounded-lg mb-10 hover:scale-105 transition duration-500 ease-in-out"
                                onClick={executeCallContractWithToken}
                            >
                                Execute CallContractWithToken
                            </button>
                        </div>
                    </div>
                )
            ) : (
                <div className="flex flex-col justify-center items-center mb-20 font-bold text-2xl gap-y-3">
                    <div>----------------------------------------</div>
                    <div>Please connect to the {srcChain.name} Network</div>
                    <div>and reload the page</div>
                    <div>----------------------------------------</div>
                </div>
            )}

            {loadingState === 0 ? (
                miningStatus === 0 ? (
                    txError === null ? (
                        <div className="flex flex-col justify-center items-center">
                            <div className="text-lg font-bold">Processing your transaction</div>
                            <Loader
                                className="flex justify-center items-center pt-12"
                                type="TailSpin"
                                color="#d3d3d3"
                                height={40}
                                width={40}
                            />
                        </div>
                    ) : (
                        <div className="text-lg text-red-600 font-semibold">{txError}</div>
                    )
                ) : (
                    <div></div>
                )
            ) : (
                <div className="flex flex-col justify-center items-center h-60 w-60 rounded-lg shadow-2xl shadow-[#6FFFE9] hover:scale-105 transition duration-500 ease-in-out">
                    Transfers Complete!
                </div>
            )}
        </div>
    );
};

export const ChainOptions = (cb) => {
    return ChainList.map((option) => (
        <li class="bg-black" onClick={() => cb(option)}>
            <a>{option.name}</a>
        </li>
    ));
};
export const ChainCard = ({ name, imgUrl }, cb) => {
    return (
        <div>
            <br />
            <br />
            <div class="flex justify-center avatar">
                <div class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img src={imgUrl} alt="Logo" />
                </div>
            </div>
            <div class="card-body">
                <div class="card-actions justify-center">
                    <div class="dropdown dropdown-bottom">
                        <label tabindex="0" class="btn m-1">
                            {name}
                        </label>
                        <ul
                            tabindex="0"
                            class="dropdown-content menu p-2 rounded-box w-52 h-44 overflow-scroll"
                        >
                            {ChainOptions(cb)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default app;
