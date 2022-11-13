import { ethers, Wallet, providers, UnsignedTransaction, Contract, BigNumber, PopulatedTransaction } from 'ethers';

window.abi = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "requestId",
				"type": "uint256"
			}
		],
		"name": "addPendingRequests",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bool",
				"name": "_result",
				"type": "bool"
			}
		],
		"name": "changeIsDelegatorResult",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "requestId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "numberOfdecimals",
				"type": "uint256"
			}
		],
		"name": "request",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "requestId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "numberOfdecimals",
				"type": "uint256"
			}
		],
		"name": "RequestCreated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "num",
				"type": "uint256"
			}
		],
		"name": "store",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "requestId",
				"type": "uint256"
			},
			{
				"internalType": "uint256[]",
				"name": "decimals",
				"type": "uint256[]"
			}
		],
		"name": "submitResult",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPendingRequests",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "isDelegated",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "retrieve",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "submitted",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

window.InitializeEthWallet = (privateKey: string, rpc: string): Wallet | undefined => {
	try {
		return new Wallet(privateKey, new providers.JsonRpcProvider(rpc));
	} catch (err) {
		console.log(err);
	}
}

window.GetPublicAddress = async (privateKey: string, rpc: string): Promise<string> => {
	const wallet: Wallet = window.InitializeEthWallet(privateKey, rpc);
	return await (wallet).getAddress();
}

//Done
window.IsDelegatedAsync = async (privateKey: string, contractAddress: string, rpc: string): Promise<boolean> => {
	const contract: Contract = new ethers.Contract(contractAddress, window.abi, window.InitializeEthWallet(privateKey, rpc));
	return await contract.isDelegated();
}

window.GetPendingRequestsAsync = async (privateKey: string, contractAddress: string, rpc: string): Promise<BigInt[]> => {
	const contract: Contract = new ethers.Contract(contractAddress, window.abi, window.InitializeEthWallet(privateKey, rpc));
	return await contract.getPendingRequests();
}

window.SubmitResultAsync = async (privateKey: string, contractAddress: string, requestId: string, decimalsString: string[], nonce: number, rpc: string): Promise<void> => {
	const wallet: Wallet = window.InitializeEthWallet(privateKey, rpc);
	const contract: Contract = new ethers.Contract(contractAddress, window.abi, wallet);

	let decimalsBigInt: BigInt[] = decimalsString.map(decimal => BigInt(decimal));
	let unsignedTx: PopulatedTransaction = await contract.populateTransaction.submitResult(BigInt(requestId), decimalsBigInt);

	let gasPriceHex: string = ethers.utils.hexlify(80000000000000);
	let gasLimitHex: string = ethers.utils.hexlify(4000000);
	unsignedTx.gasLimit = BigNumber.from(gasLimitHex);
	unsignedTx.gasPrice = BigNumber.from(gasPriceHex);
	unsignedTx.nonce = nonce + 1;

	await wallet.sendTransaction(unsignedTx);
}

window.Delay = (ms: number): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, ms));
}

window.GetTransactionCount = async (privateKey: string, rpc: string): Promise<number> => {
	const wallet: Wallet = window.InitializeEthWallet(privateKey, rpc);
	return await wallet.provider.getTransactionCount(wallet.getAddress());
}

window.ListenToRequestCreatedEventAsync = async (contractAddress: string, rpc: string) => {
	let provider = new providers.JsonRpcProvider(rpc);

	const contract: Contract = new Contract(contractAddress, window.abi, provider);
	contract.on("RequestCreated", (requestId: BigInt, timestamp: BigInt, numberOfdecimals: BigInt) => {
		// Do something
		window.requestnumbers(requestId.toString(), timestamp.toString(), numberOfdecimals.toString());
	});
}

window.GetBalance = async (privateKey: string, rpc: string): Promise<string> => {
	const wallet: Wallet = window.InitializeEthWallet(privateKey, rpc);
	return (await wallet.getBalance()).toString();
}