import { ConclaveAmount, Reward } from "../types/database-types";
import { CardanoAssetResponse, TxBodyInput } from "../types/response-types";
import { isEmpty, isNull } from "./boolean-utils";
import { conclaveCoinSelection, rewardCoinSelection } from "./coin-utils";
import { conclaveOutputSum, getCollateralOutputAmountSum, getInputAssetUTXOSum, getOutputAmountSum } from "./sum-utils";
import { blockfrostAPI, createAndSignConclaveTxAsync, createAndSignRewardTxAsync, policyStr, shelleyChangeAddress, shelleyOutputAddress } from "./transaction-utils";
import { queryAllUTXOsAsync } from "./utxo-utils";

const getRawUTXOAsset = async (unit: string = "lovelace"): Promise<Array<TxBodyInput>> => {
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let txBodyInputs: Array<TxBodyInput> = [];
    utxos = utxos.filter(utxo => utxo.amount.find(asset => asset.unit == unit));

    utxos.forEach((utxo) => {
        let assetArray: Array<CardanoAssetResponse> = [];
        utxo.amount.forEach(asset => {
            const cardanoAsset: CardanoAssetResponse = {
                unit: asset.unit,
                quantity: asset.quantity,
            };

            assetArray.push(cardanoAsset);
        });

        const utxoInput: TxBodyInput = {
            txHash: utxo.tx_hash,
            outputIndex: utxo.output_index,
            asset: assetArray,
        };

        txBodyInputs.push(utxoInput);
    });

    // return txBodyInputs;
    // for (let i = 0; i < 2; i++) {
    //     const cardanoAsset: CardanoAssetResponse = {
    //         unit: "Lovelace",
    //         quantity: "20000000000",
    //     };

    //     const utxoInput: TxBodyInput = {
    //         txHash: '8561258e210352fba2ac0488afed67b3427a27ccf1d41ec030c98a8199bc22ec',
    //         outputIndex: 0,
    //         asset: cardanoAsset,
    //     };

    //     txBodyInputs.push(utxoInput);
    // }
    return txBodyInputs;
};

//to be replaced with RJ's code
const getAllRewardTxOutput = (): Array<Reward> => {
    let txBodyOutputs: Array<Reward> = [];

    //ADA Transaction
    for (let i = 0; i < 100; i++) {
        const txBodyOutput: Reward = {
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardAmount: 500000000, //20 ADA
            rewardType: 2,
            id: "sampleId"
        };

        txBodyOutputs.push(txBodyOutput);
    }

    for (let i = 0; i < 100; i++) {
        const txBodyOutput: Reward = {
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardAmount: 40000000, //20 ADA
            rewardType: 2,
            id: "sampleId"
        };

        txBodyOutputs.push(txBodyOutput);
    }

    for (let i = 0; i < 500; i++) {
        const txBodyOutput: Reward = {
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardAmount: 2000000, //20 ADA
            rewardType: 2,
            id: "sampleId"
        };

        txBodyOutputs.push(txBodyOutput);
    }

    // for (let i = 0; i < 10; i++) {
    //     const txBodyOutput: Reward = {
    //         walletAddress: shelleyOutputAddress.to_bech32(),
    //         rewardAmount: 2000000, //20 ADA
    //         rewardType: 2,
    //         id: "sampleId"
    //     };

    //     txBodyOutputs.push(txBodyOutput);
    // }

    // const txBodyOutput1: Reward = {
    //     walletAddress: shelleyOutputAddress.to_bech32(),
    //     rewardAmount: 200000, //2 ADA
    //     rewardType: 2,
    //     id: "sampleId"
    // };

    // txBodyOutputs.push(txBodyOutput1);


    // for (let i = 0; i < 1000; i++) {
    //     const txBodyOutput: Reward = {
    //         walletAddress: shelleyOutputAddress.to_bech32(),
    //         rewardAmount: 500000000000,
    //         rewardType: 2,
    //         id: "sampleId"
    //     };

    //     txBodyOutputs.push(txBodyOutput);
    // }

    // for (let i = 0; i < 1000; i++) {
    //     const asset1: CardanoAssetResponse = {
    //         unit: "Lovelace",
    //         quantity: "5000000"
    //     }

    //     const txBodyOutput1: TxBodyOutput = {
    //         account: "addr_test1qrzx30tju0gvsmcvnn48zc3pe5qc49npydky6qd2huh4640h7m58dq0yf0uule4fq0cun04cxgh9n8nuk6dwdxnahmhs8dxnz8",
    //         asset: asset1
    //     };
    //     txBodyOutputs.push(txBodyOutput1);
    // }

    // for (let i = 0; i < 10; i++) {
    //     const asset2: CardanoAssetResponse = {
    //         unit: "Lovelace",
    //         quantity: "5000000000"
    //     }

    //     const txBodyOutput2: TxBodyOutput = {
    //         account: "addr_test1qrzx30tju0gvsmcvnn48zc3pe5qc49npydky6qd2huh4640h7m58dq0yf0uule4fq0cun04cxgh9n8nuk6dwdxnahmhs8dxnz8",
    //         asset: asset2
    //     };
    //     txBodyOutputs.push(txBodyOutput2);
    // }

    return txBodyOutputs;
};

const getAllConclaveAmountOutput = (): Array<ConclaveAmount> => {
    let txBodyOutputs: Array<ConclaveAmount> = [];

    //ADA Transaction
    for (let i = 0; i < 200; i++) {
        const txBodyOutput: ConclaveAmount = {
            walletAddress: shelleyOutputAddress.to_bech32(),
            collateralAmount: 5000000000, //10 ADA
            conclaveAmount: 2, //2 Tokens
            id: "sampleId"
        };

        txBodyOutputs.push(txBodyOutput);
    }

    // for (let i = 0; i < 10; i++) {
    //     const txBodyOutput: Reward = {
    //         walletAddress: shelleyOutputAddress.to_bech32(),
    //         rewardAmount: 2000000, //20 ADA
    //         rewardType: 2,
    //         id: "sampleId"
    //     };

    //     txBodyOutputs.push(txBodyOutput);
    // }

    // const txBodyOutput1: Reward = {
    //     walletAddress: shelleyOutputAddress.to_bech32(),
    //     rewardAmount: 200000, //2 ADA
    //     rewardType: 2,
    //     id: "sampleId"
    // };

    // txBodyOutputs.push(txBodyOutput1);


    // for (let i = 0; i < 1000; i++) {
    //     const txBodyOutput: Reward = {
    //         walletAddress: shelleyOutputAddress.to_bech32(),
    //         rewardAmount: 500000000000,
    //         rewardType: 2,
    //         id: "sampleId"
    //     };

    //     txBodyOutputs.push(txBodyOutput);
    // }

    // for (let i = 0; i < 1000; i++) {
    //     const asset1: CardanoAssetResponse = {
    //         unit: "Lovelace",
    //         quantity: "5000000"
    //     }

    //     const txBodyOutput1: TxBodyOutput = {
    //         account: "addr_test1qrzx30tju0gvsmcvnn48zc3pe5qc49npydky6qd2huh4640h7m58dq0yf0uule4fq0cun04cxgh9n8nuk6dwdxnahmhs8dxnz8",
    //         asset: asset1
    //     };
    //     txBodyOutputs.push(txBodyOutput1);
    // }

    // for (let i = 0; i < 10; i++) {
    //     const asset2: CardanoAssetResponse = {
    //         unit: "Lovelace",
    //         quantity: "5000000000"
    //     }

    //     const txBodyOutput2: TxBodyOutput = {
    //         account: "addr_test1qrzx30tju0gvsmcvnn48zc3pe5qc49npydky6qd2huh4640h7m58dq0yf0uule4fq0cun04cxgh9n8nuk6dwdxnahmhs8dxnz8",
    //         asset: asset2
    //     };
    //     txBodyOutputs.push(txBodyOutput2);
    // }

    return txBodyOutputs;
};

let dummyRewards = getAllRewardTxOutput();
let dummyConclave = getAllConclaveAmountOutput();

export const sendRewardTransactionAsync = async (rewards: Array<Reward> = dummyRewards) => {
    let utxosInWallet = await getRawUTXOAsset();
    if (isEmpty(rewards) || isEmpty(utxosInWallet)) return;

    let txinputoutputs = await rewardCoinSelection(utxosInWallet, rewards);
    if (isNull(txinputoutputs) || isEmpty(txinputoutputs!)) return;

    txinputoutputs?.forEach((element, index) => {
        console.log(' ');
        console.log('Transaction ' + index);
        element.txInputs.forEach((e) => {
            console.log('Txinput ' + e.txHash + ' ' + e.asset.find(f => f.unit == "lovelace")!.quantity + " " + e.asset.find(f => f.unit == "lovelace")!.unit);
        });

        console.log('Txinput sum ' + getInputAssetUTXOSum(element.txInputs));
        console.log('Txoutput sum ' + getOutputAmountSum(element.txOutputs));
        console.log('TxOutput count: ' + element.txOutputs.length);
    });

    console.log(' ');

    for (let txItem of txinputoutputs!) {
        let transaction = await createAndSignRewardTxAsync(txItem);
        if (transaction == null) continue;

        // await updateRewardListStatusAsync(txItem.txOutputs,2,transaction.txHash.to_bech32("_"));

        console.log('Transaction ' + transaction.txHash.to_bech32('tx_test').toString() + ' fee ' + transaction.transaction.body().fee().to_str());

        // Submit Transaction
        // let txResult = await submitRewardTransactionAsync(transaction.transaction, transaction.txHash, txItem);
        // if (txResult == null) {
        //     console.log("Updating Status to Failed");
        //     // await updateRewardListStatusAsync(txItem.txOutputs,3,transaction.txHash.to_bech32("_"));
        // }
        // console.log(' ');
    }
};

export const sendTokenTransactionAsync = async (conclaveOutputs: Array<ConclaveAmount> = dummyConclave) => {
    let conclaveAssets = await getRawUTXOAsset(policyStr);
    if (isEmpty(conclaveOutputs) || isNull(conclaveOutputs)) return;

    let utxosInWallet = await getRawUTXOAsset();
    if (isEmpty(utxosInWallet)) return;

    let conclaveCoinIO = await conclaveCoinSelection(conclaveAssets, conclaveOutputs, utxosInWallet);
    if (isNull(conclaveCoinIO) || isEmpty(conclaveCoinIO)) return;

    conclaveCoinIO?.forEach((element, index) => {
        console.log(' ');
        console.log('Transaction ' + index);
        element.txInputs.forEach((e) => {
            console.log('Txinput ' + e.txHash + ' ' + e.asset.find(f => f.unit == "lovelace")!.quantity + " " + e.asset.find(f => f.unit == "lovelace")!.unit + " " + e.asset.find(f => f.unit == "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a")?.quantity);
        });

        console.log('TxinputCollateral sum ' + getInputAssetUTXOSum(element.txInputs));
        console.log('TxConclave sum ' + getInputAssetUTXOSum(element.txInputs, policyStr))
        console.log('ConclaveOutput sum ' + conclaveOutputSum(element.txOutputs));
        console.log('CollateralOutput sum ' + getCollateralOutputAmountSum(element.txOutputs));
        console.log('TxOutput count: ' + element.txOutputs.length);
    })

    console.log(' ');

    for (let txItem of conclaveCoinIO) {
        let transaction = await createAndSignConclaveTxAsync(txItem);
        if (transaction == null) continue;

        // await updateRewardListStatusAsync(txItem.txOutputs,2,transaction.txHash.to_bech32("_"));
        console.log('Transaction ' + transaction.txHash.to_bech32('tx_test').toString() + ' fee ' + transaction.transaction.body().fee().to_str());

        //Submit Transaction
        // let txResult = await submitConclaveTransactionAsync(transaction.transaction, transaction.txHash, txItem);
        // if (txResult == null) {
        //     console.log("Updating Status to Failed");
        //     // await updateRewardListStatusAsync(txItem.txOutputs,3,transaction.txHash.to_bech32("_"));
        // }

        // console.log(' ');
    }
}