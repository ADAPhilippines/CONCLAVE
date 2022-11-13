import { ethers } from "ethers";


export async function connectWallet() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    console.log('signer address', await signer.getAddress());
    const address = await signer.getAddress();
    return address;
}


window.interactContract = async (numberToStore: number) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contractAddress = "0xAb4033AA9f70A5F23E9D4EF24d3Bf931a1dc701C";

    const abiString = [
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "num",
                    "type": "uint256"
                }
            ],
            "name": "store",
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
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
        }
    ];
    // The Contract object
    const contract = new ethers.Contract(contractAddress, abiString, signer);
    console.log(contract);

    let txRetrieve = await contract.retrieve();
    console.log("retrieved value ", txRetrieve._hex);

    console.log('number to store', numberToStore)
    const tx = await contract.store(BigInt(numberToStore));

    txRetrieve = await contract.retrieve();
    console.log("transaction", tx);
    console.log("new retrieved value ", txRetrieve._hex);
}