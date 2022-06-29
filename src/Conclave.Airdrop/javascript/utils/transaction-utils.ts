import { BlockFrostAPI, BlockfrostServerError } from '@blockfrost/blockfrost-js';
import {
    CardanoAssetResponse,
    OutputAccount,
    ProtocolParametersResponse,
    TxBodyDetails,
    TxBodyInput,
    TxBodyOutput,
    UTXO,
} from '../types/response-types';
import { getCurrentEpochsAsync, getProtocolParametersAsync } from './epoch-utils';

import CardanoWasm, { AssetName, Assets, BigNum, MultiAsset, ScriptHash, TransactionBuilder, TransactionOutputBuilder } from '@emurgo/cardano-serialization-lib-nodejs';
import cbor from 'cbor';
import { fromHex } from './string-utils';
import { queryAllUTXOsAsync } from './utxo-utils';
import { Reward } from '../types/database-types';
import { updateRewardListStatusAsync } from './reward-utils';

export const getLatestProtocolParametersAsync = async (blockfrostAPI: BlockFrostAPI): Promise<ProtocolParametersResponse> => {
    const protocolParams = await getProtocolParametersAsync(blockfrostAPI, (await getCurrentEpochsAsync(blockfrostAPI)).epoch);
    const linearFee = CardanoWasm.LinearFee.new(
        CardanoWasm.BigNum.from_str(protocolParams.min_fee_a.toString()),
        CardanoWasm.BigNum.from_str(protocolParams.min_fee_b.toString())
    );

    return {
        linearFee,
        poolDeposit: protocolParams.pool_deposit.toString(),
        keyDeposit: protocolParams.key_deposit.toString(),
        maxValueSize: Number(protocolParams.max_val_size) ?? 0,
        maxTxSize: protocolParams.max_tx_size,
        coinsPerUtxoWord: Number(protocolParams.coins_per_utxo_word).toString(),
    };
};

//mainnet
// const blockfrostAPI = new BlockFrostAPI({
//     projectId: process.env.PROJECT_ID as string,
//     isTestnet: false,
// });

//tesnet
const blockfrostAPI = new BlockFrostAPI({
    projectId: "testnet4Zo3x6oMtftyJH0X0uutC1RflLn8JtWR",
    isTestnet: true,
});

export const getTransactionBuilder = (config: ProtocolParametersResponse): TransactionBuilder => {
    const txBuilderConfig = CardanoWasm.TransactionBuilderConfigBuilder.new()
        .fee_algo(config.linearFee)
        .pool_deposit(CardanoWasm.BigNum.from_str(config.poolDeposit))
        .key_deposit(CardanoWasm.BigNum.from_str(config.keyDeposit))
        .max_value_size(config.maxValueSize)
        .max_tx_size(config.maxTxSize)
        .coins_per_utxo_word(CardanoWasm.BigNum.from_str(config.coinsPerUtxoWord))
        .build();

    return CardanoWasm.TransactionBuilder.new(txBuilderConfig);
};

//sample wallet address and private key
//mainnet
// const cbor_hex_key = '58204765b18346caeb1ca0533dd2c0eb90f62a9ead7b8231dbede63393acde43ef20';
// const unhex = fromHex(cbor_hex_key);
// const decode = cbor.decode(unhex);
// const privKey = CardanoWasm.PrivateKey.from_normal_bytes(decode);

// const shelleyChangeAddress = CardanoWasm.Address.from_bech32('addr1v98kgx5f3z4xc5zhvrad9s4340h3y8aevwq9w4tcapvjgvqs5twp5');
// const shelleyOutputAddress = CardanoWasm.Address.from_bech32(
//     'addr1qykazed34gqdp3sy989p2xp3qdpvs0slex7umj35xdmzvcqa6g53xrnnhkv47txfj9vf6k8s4ulktgk7mlkfpxjflf2sjhcmpt'
// );

//testnet
const cbor_hex_key = '582007e4fc2151ff929ff906a48815d4707c715dbdd227bef6f8e0818407e59fd583';
const unhex = fromHex(cbor_hex_key);
const decode = cbor.decode(unhex);
const privKey = CardanoWasm.PrivateKey.from_normal_bytes(decode);

const shelleyChangeAddress = CardanoWasm.Address.from_bech32('addr_test1vrhcq70gslwqchcerumm0uqu08zy68qg2mdmh95ar5t545c7avx8t');
const shelleyOutputAddress = CardanoWasm.Address.from_bech32('addr_test1qryzkhzv3zuurkqz02cyvqq279yr2flk0fwfth2zhgs3ytp7g5cr0jtxf5u065efh4lgqrap7ceh0w85zs2zczvaswgqewwgrf');

const convertRawUTXO = async (): Promise<Array<TxBodyInput>> => {
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let txBodyInputs: Array<TxBodyInput> = [];

    utxos.forEach((utxo) => {
        const cardanoAsset: CardanoAssetResponse = {
            unit: utxo.amount[0].unit,
            quantity: utxo.amount[0].quantity,
        };
        const utxoInput: TxBodyInput = {
            txHash: utxo.tx_hash,
            outputIndex: utxo.output_index,
            asset: cardanoAsset,
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

const getAllTxOutput = (): Array<Reward> => {
    let txBodyOutputs: Array<Reward> = [];

    for (let i = 0; i < 1000; i++) {
        const txBodyOutput: Reward = {
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardAmount: 20000000, //20 ADA
            rewardType: 2,
            id: "sampleId"
        };

        txBodyOutputs.push(txBodyOutput);
    }

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

const selectTxInputOutputAsync = async (
    txBodyInputs: Array<TxBodyInput>,
    txBodyOutputs: Array<Reward>
    ): Promise<Array<TxBodyDetails> | null> => {
    let _txBodyInputs = txBodyInputs.sort((m, n) => parseInt(n.asset.quantity) - parseInt(m.asset.quantity));
    let _txBodyOutputs = txBodyOutputs.sort((m, n) => m.rewardAmount - n.rewardAmount);

    let txBodyDetailsArray: Array<TxBodyDetails> = [];
    let currentUTXOsBatch: Array<TxBodyInput> = _txBodyInputs.splice(0, 248);
    let currentOutputsBatch: Array<Reward> = _txBodyOutputs.splice(0, 248);

    let partialUTXOSum = getInputUTXOSum(currentUTXOsBatch);
    let partialOutputsSum = getOutputAmountSum(currentOutputsBatch);

    while (currentOutputsBatch.length > 0 && currentUTXOsBatch.length > 0) {
        while (currentUTXOsBatch.length + currentOutputsBatch.length > 249) {
            if (partialOutputsSum > partialUTXOSum) {
                if (currentOutputsBatch.length > 0) _txBodyOutputs.unshift(currentOutputsBatch.pop()!);
            } else {
                if (currentUTXOsBatch.length > 0) _txBodyInputs.unshift(currentUTXOsBatch.pop()!);
            }
            partialOutputsSum = getOutputAmountSum(currentOutputsBatch);
            partialUTXOSum = getInputUTXOSum(currentUTXOsBatch);
        }
        
        while (partialUTXOSum < partialOutputsSum) {
            if (currentOutputsBatch.length > 0) _txBodyOutputs.unshift(currentOutputsBatch.pop()!);
            partialOutputsSum = getOutputAmountSum(currentOutputsBatch);
        }
        if (partialOutputsSum == 0) break;

        while (partialUTXOSum >= partialOutputsSum) {
            if (currentUTXOsBatch.length > 0) _txBodyInputs.unshift(currentUTXOsBatch.pop()!);
            partialUTXOSum = getInputUTXOSum(currentUTXOsBatch);
        }
        if (_txBodyInputs.length > 0) currentUTXOsBatch.push(_txBodyInputs.shift()!);
        partialUTXOSum = getInputUTXOSum(currentUTXOsBatch);

        if (partialOutputsSum > 0 && (partialUTXOSum >= partialOutputsSum)) {
            const newTxBodyDetails: TxBodyDetails = {
                txInputs: currentUTXOsBatch,
                txOutputs: currentOutputsBatch,
                fee: '0',
                txOutputSum: partialOutputsSum,
            };

            let fees = await calculateFeesAsync(newTxBodyDetails);
            if (fees == null) continue;

            newTxBodyDetails.fee = fees;

            if (
                newTxBodyDetails != null && 
                newTxBodyDetails !== undefined) {
                txBodyDetailsArray.push(newTxBodyDetails);
            }

            currentUTXOsBatch = _txBodyInputs.splice(0, 248);
            currentOutputsBatch = _txBodyOutputs.splice(0, 248);
        } else break;
    }

    txBodyDetailsArray = deductFees(txBodyDetailsArray);

    return txBodyDetailsArray;
};

const calculateFeesAsync = async (newTxBodyDetails: TxBodyDetails): Promise<string | null> => {
    let _txOutputs: Array<Reward> = [];

    const _newTxBodyDetails: TxBodyDetails = {
        txInputs: newTxBodyDetails.txInputs,
        txOutputs: [],
        fee: '0',
        txOutputSum: newTxBodyDetails.txOutputSum,
    };

    newTxBodyDetails.txOutputs.forEach((e) => {
        let _reward: Reward = {
            id: e.id,
            rewardAmount: 1000000,
            rewardType: e.rewardType,
            walletAddress: e.walletAddress
        }

        _txOutputs.push(_reward);
    });

    _newTxBodyDetails.txOutputs = _txOutputs;

    let _result = await createTxBodyAsync(_newTxBodyDetails);
    if (_result == null) return null;

    return _result.txBody.fee().to_str();
};

const deductFees = (txBodyDetailsArray: Array<TxBodyDetails>): Array<TxBodyDetails> => {
    txBodyDetailsArray.forEach((element) => {
        let newFee = parseInt(element.fee) + 200;
        element.txOutputs.forEach((e) => {
            e.rewardAmount = parseInt((e.rewardAmount - (newFee / element.txOutputSum) * e.rewardAmount).toFixed());
        });
    });

    return txBodyDetailsArray;
};

const setTTLAsync = async (): Promise<number> => {
    const latestBlock = await blockfrostAPI.blocksLatest();
    const currentSlot = latestBlock.slot;

    return currentSlot! + 7200;
};

const createTxBodyAsync = async (
    txBodyDetails: TxBodyDetails
): Promise<{ txHash: CardanoWasm.TransactionHash; txBody: CardanoWasm.TransactionBody } | null> => {
    try {
        let txBuilder = await setTxBodyDetailsAsync(txBodyDetails);
        let ttl = await setTTLAsync();

        txBuilder.set_ttl(ttl);
        txBuilder.add_change_if_needed(shelleyChangeAddress);

        const txBody = txBuilder.build();
        const txHash = CardanoWasm.hash_transaction(txBody);

        return { txHash, txBody };
    } catch (error) {
        console.log('Error Creating Tx Body ' + error);
        return null;
    }
};

const setTxBodyDetailsAsync = async (txBodyDetails: TxBodyDetails): Promise<CardanoWasm.TransactionBuilder> => {
    let protocolParameter = await getLatestProtocolParametersAsync(blockfrostAPI);
    let txBuilder = getTransactionBuilder(protocolParameter);

    txBodyDetails.txInputs.forEach((txInput: TxBodyInput) => {
        txBuilder.add_key_input(
            privKey.to_public().hash(),
            CardanoWasm.TransactionInput.new(
                CardanoWasm.TransactionHash.from_bytes(Buffer.from(txInput.txHash, 'hex')), // tx hash
                txInput.outputIndex // index
            ),
            CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(txInput.asset.quantity))
        );
    });

    txBodyDetails.txOutputs.forEach((txOutput: Reward) => {
        txBuilder.add_output(
            CardanoWasm.TransactionOutput.new(
                CardanoWasm.Address.from_bech32(txOutput.walletAddress),
                CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(txOutput.rewardAmount.toString()))
            )
        );
    });

    return txBuilder;
};

const signTxBody = (
    txHash: CardanoWasm.TransactionHash,
    txBody: CardanoWasm.TransactionBody,
    signKey: CardanoWasm.PrivateKey
): CardanoWasm.Transaction | null => {
    try {
        const witnesses = CardanoWasm.TransactionWitnessSet.new();
        const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
        const vkeyWitness = CardanoWasm.make_vkey_witness(txHash, signKey);
        vkeyWitnesses.add(vkeyWitness);
        witnesses.set_vkeys(vkeyWitnesses);

        const transaction = finalizeTxBody(txBody, witnesses);

        return transaction;
    } catch (error) {
        console.log('Error Signing Transaction body ' + error);
        return null;
    }
};

const finalizeTxBody = (
    txBody: CardanoWasm.TransactionBody,
    witnesses: CardanoWasm.TransactionWitnessSet
): CardanoWasm.Transaction | null => {
    try {
        const transaction = CardanoWasm.Transaction.new(txBody, witnesses);
        return transaction;
    } catch (error) {
        console.log('Error Creating Transaction body ' + error);
        return null;
    }
};

const submitTransactionAsync = async (
    transaction: CardanoWasm.Transaction,
    txHash: CardanoWasm.TransactionHash,
    txItem: TxBodyDetails): Promise<TxBodyDetails | null> => {

    try {
        const res = await blockfrostAPI.txSubmit(transaction!.to_bytes());
        if (res) {
            console.log(`Transaction successfully submitted for Tx ` + txHash.to_bech32('tx_test').toString());
        }
        return txItem;
    } catch (error) {
        if (error instanceof BlockfrostServerError && error.status_code === 400) {
            console.log(`Transaction rejected for Tx ` + txHash.to_bech32('tx_test').toString());
            console.log(error.message);
        } 
        return null;
    }
};

const getOutputAmountSum = (currentOutputBatch: Array<Reward>): number => {
    if (currentOutputBatch === null || currentOutputBatch === undefined) return 0;

    let _partialSum = 0;

    currentOutputBatch.forEach((reward) => {
        _partialSum += reward.rewardAmount;
    });

    return _partialSum;
};

const getInputUTXOSum = (currentUTXOs: Array<TxBodyInput>): number => {
    let _partialSum = 0;

    currentUTXOs.forEach((utxo) => {
        _partialSum += parseInt(utxo.asset.quantity);
    });

    return _partialSum;
};

const awaitChangeInUTXOAsync = async (txInputs: Array<TxBodyInput>) => {
    let txHashArray: Array<string> = [];

    txInputs.forEach((element) => {
        txHashArray.push(element.txHash);
    });

    var CheckUTX0 = setInterval(async () => {
        console.log('Waiting for utxos to update after Submissions ');
        let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
        let commonHash = utxos.filter((v) => txHashArray.includes(v.tx_hash));

        if (commonHash.length === 0 || commonHash === null || commonHash === undefined) clearInterval(CheckUTX0);
    }, 10000);
};

const getLargeUTXOs = (utxos: UTXO): {
    txInputs: Array<TxBodyInput>;
    txOutputs: Array<Reward>
} | null => {
    let txBodyInputs: Array<TxBodyInput> = [];
    let txBodyOutputs: Array<Reward> = [];
    let divider = 0;
    let remainder = 0;

    utxos.forEach((utxo) => {
        if (parseInt(utxo.amount[0].quantity) > 1200000000) {
            const cardanoAsset: CardanoAssetResponse = {
                unit: utxo.amount[0].unit,
                quantity: utxo.amount[0].quantity,
            };

            const utxoInput: TxBodyInput = {
                txHash: utxo.tx_hash,
                outputIndex: utxo.output_index,
                asset: cardanoAsset,
            };

            txBodyInputs.push(utxoInput);
        }
    });

    txBodyInputs = txBodyInputs.splice(0, 248);
    let utxoSum = getInputUTXOSum(txBodyInputs);
    if (utxoSum == 0) return null;

    divider = parseInt((utxoSum / 2).toFixed());
    remainder = parseInt((utxoSum % 2).toFixed());

    for (let i = 0; i < 2; i++) {
        const reward: Reward = {
            id: "string",
            rewardType: 1,
            rewardAmount: divider,
            walletAddress: shelleyChangeAddress.to_bech32.toString()
        };

        txBodyOutputs.push(reward);
    }

    const reward: Reward = {
        id: "string",
        rewardType: 1,
        rewardAmount: remainder,
        walletAddress: shelleyChangeAddress.to_bech32.toString()
    };

    txBodyOutputs.push(reward);

    return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
};

const getSmallUTXOs = (utxos: UTXO): {
    txInputs: Array<TxBodyInput>;
    txOutputs: Array<Reward>;
    } | null => {
    let txBodyInputs: Array<TxBodyInput> = [];
    let txBodyOutputs: Array<Reward> = [];

    utxos.forEach((utxo) => {
        if (parseInt(utxo.amount[0].quantity) < 300000000) {
            const cardanoAsset: CardanoAssetResponse = {
                unit: utxo.amount[0].unit,
                quantity: utxo.amount[0].quantity,
            };

            const utxoInput: TxBodyInput = {
                txHash: utxo.tx_hash,
                outputIndex: utxo.output_index,
                asset: cardanoAsset,
            };

            txBodyInputs.push(utxoInput);
        }
    });

    txBodyInputs = txBodyInputs.splice(0, 248);

    let utxoSum = getInputUTXOSum(txBodyInputs);
    if (utxoSum === 0) return null;

    const reward: Reward = {
        id: "string",
        rewardType: 1,
        rewardAmount: utxoSum,
        walletAddress: shelleyChangeAddress.to_bech32.toString()
    };

    txBodyOutputs.push(reward);

    return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
};

export const divideLargeUTXOsAsync = async () => {
    console.log('Dividing UTXOs');
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let txInputsSent: Array<TxBodyInput> = [];
    let txOutputsSent: Array<TxBodyOutput> = [];

    let rewards = getLargeUTXOs(utxos);
    if (rewards?.txInputs === null || rewards?.txOutputs === null || rewards === null) return;

    let txinputoutputs = await selectTxInputOutputAsync(rewards.txInputs, rewards.txOutputs);
    if (txinputoutputs == null || txinputoutputs.length == 0 || txinputoutputs === undefined) return;

    if (rewards === null) return;

    for (let txItem of txinputoutputs) {
        let transaction = await createAndSignTxAsync(txItem);
        if (transaction == null) return;

        console.log('Dividing Large UTXOs');
        console.log(
            'Transaction ' + transaction.txHash.to_bech32('tx_test').toString() + ' fee ' + transaction.transaction.body().fee().to_str()
        );

        //Submit Transaction
        // let txResult = await submitTransactionAsync(transaction.transaction, transaction.txHash, txItem);
        // if (txResult !== null) {
        //     txInputsSent = txInputsSent.concat(txInputsSent, txResult.txInputs);
        //     txOutputSent = txOutputSent.concat(txOutputSent, txResult.txOutputs);
        //     console.log("Update Status to Completed");
        // }

        console.log(' ');
    }
    await awaitChangeInUTXOAsync(txInputsSent);
};

export const combineSmallUTXOsAsync = async () => {
    console.log('Combining UTXOs');
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let txInputsSent: Array<TxBodyInput> = [];
    let txOutputsSent: Array<TxBodyOutput> = [];

    let rewards = getSmallUTXOs(utxos);
    if (rewards?.txInputs === null || rewards?.txOutputs === null || rewards === null) return;

    let txinputoutputs = await selectTxInputOutputAsync(rewards.txInputs, rewards.txOutputs);
    if (txinputoutputs == null || txinputoutputs.length == 0 || txinputoutputs === undefined) return;

    if (rewards === null) return;
    
    for (let txItem of txinputoutputs) {
        let transaction = await createAndSignTxAsync(txItem);
        if (transaction == null) return;

        console.log('Combining Small UTXOs');
        console.log(
            'Transaction ' + transaction.txHash.to_bech32('tx_test').toString() + ' fee ' + transaction.transaction.body().fee().to_str()
        );

        //Submit Transaction
        // let txResult = await submitTransactionAsync(transaction.transaction, transaction.txHash, txItem);
        // if (txResult !== null) {
        //     txInputsSent = txInputsSent.concat(txInputsSent, txResult.txInputs);
        //     txOutputSent = txOutputSent.concat(txOutputSent, txResult.txOutputs);
        // }

        console.log(' ');
    }
    await awaitChangeInUTXOAsync(txInputsSent);
};

const createAndSignTxAsync = async (
    txBodyDetails: TxBodyDetails
    ): Promise<{
    transaction: CardanoWasm.Transaction;
    txHash: CardanoWasm.TransactionHash
    } | null> => {
    let txBodyResult = await createTxBodyAsync(txBodyDetails);
    if (txBodyResult == null) return null;

    let txSigned = signTxBody(txBodyResult.txHash, txBodyResult.txBody, privKey);
    if (txSigned == null) return null;

    return { transaction: txSigned, txHash: txBodyResult.txHash };
};

let dummyRewards = getAllTxOutput();
export const handleTransactionAsync = async (rewards: Array<Reward> = dummyRewards) => {
    let utxosInWallet = await convertRawUTXO();
   
    let txInputsSent: Array<TxBodyInput> = [];
    let txOutputSent: Array<Reward> = [];

    if (rewards.length == 0 || utxosInWallet.length == 0) {
        console.log('no transaction');
        return;
    }

    let txinputoutputs = await selectTxInputOutputAsync(utxosInWallet, rewards);

    if (txinputoutputs == null || txinputoutputs.length == 0) {
        console.log('no transaction');
        return;
    }

    txinputoutputs?.forEach((element, index) => {
        console.log(' ');
        console.log('Transaction ' + index);
        element.txInputs.forEach((e) => {
            console.log('Txinput ' + e.txHash + ' ' + e.asset.quantity);
        });

        console.log('Txinput sum ' + getInputUTXOSum(element.txInputs));
        console.log('Txoutput sum ' + getOutputAmountSum(element.txOutputs));
        console.log('TxOutput count: ' + element.txOutputs.length);
    });

    console.log(' ');

    for (let txItem of txinputoutputs) {
        let transaction = await createAndSignTxAsync(txItem);
        if (transaction == null) continue; 
        
        // await updateRewardListStatusAsync(txItem.txOutputs,2,transaction.txHash.to_bech32("_"));

        console.log('Transaction ' + transaction.txHash.to_bech32('tx_test').toString() + ' fee ' + transaction.transaction.body().fee().to_str());

        //Submit Transaction
        // let txResult = await submitTransactionAsync(transaction.transaction, transaction.txHash, txItem);
        // if (txResult !== null) {
        //     txInputsSent = txInputsSent.concat(txInputsSent, txResult.txInputs);
        //     txOutputSent = txOutputSent.concat(txOutputSent, txResult.txOutputs);
        // } else {
        //     // await updateRewardListStatusAsync(txItem.txOutputs,3,transaction.txHash.to_bech32("_"));
        //     console.log("Updating Status to Failed");
        // }

        console.log(' ');
    }
};


let policyId = "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca18"
let assetName = "53616d706c65546f6b656e4a0a"

export const sendTokenTransactionAsync = async () => {
    let protocolParameter = await getLatestProtocolParametersAsync(blockfrostAPI);
    let txBuilder = getTransactionBuilder(protocolParameter);
    let multiAssetInput = CardanoWasm.MultiAsset.new();
    let assetsInput = CardanoWasm.Assets.new();
    let multiAssetOutput = CardanoWasm.MultiAsset.new();
    let assetsOutput = CardanoWasm.Assets.new();

    assetsInput.insert(
        CardanoWasm.AssetName.new(Buffer.from(assetName, 'hex')),
        CardanoWasm.BigNum.from_str("999999995")
    );
    multiAssetInput.insert(
        CardanoWasm.ScriptHash.from_bytes(Buffer.from(policyId, 'hex')),
        assetsInput
    );

    assetsOutput.insert(
        CardanoWasm.AssetName.new(Buffer.from(assetName, 'hex')),
        CardanoWasm.BigNum.from_str("3")
    );
    multiAssetOutput.insert(
        CardanoWasm.ScriptHash.from_bytes(Buffer.from(policyId, 'hex')),
        assetsOutput
    );
    
    const inputValue = CardanoWasm.Value.new(
        CardanoWasm.BigNum.from_str("875456458")
    );
    const outputValue = CardanoWasm.Value.new(
        CardanoWasm.BigNum.from_str("2000000")
    );

    inputValue.set_multiasset(multiAssetInput);
    outputValue.set_multiasset(multiAssetOutput);

    txBuilder.add_key_input(
        privKey.to_public().hash(),
        CardanoWasm.TransactionInput.new(
            CardanoWasm.TransactionHash.from_bytes(Buffer.from("1b717f70e232f70cae50fa53da6aa0bcf379f50c591506c5964c363ae9b21a79", 'hex')), // tx hash
            1 // index
        ),
        inputValue
    );

    txBuilder.add_output(
        CardanoWasm.TransactionOutput.new(
            CardanoWasm.Address.from_bech32(shelleyOutputAddress.to_bech32()),
            outputValue
        )
    );
    
    let ttl = await setTTLAsync();

    txBuilder.set_ttl(ttl);
    txBuilder.add_change_if_needed(shelleyChangeAddress);

    const txBody = txBuilder.build();
    const txHash = CardanoWasm.hash_transaction(txBody);

    const witnesses = CardanoWasm.TransactionWitnessSet.new();
    const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
    const vkeyWitness = CardanoWasm.make_vkey_witness(txHash, privKey);
    vkeyWitnesses.add(vkeyWitness);
    witnesses.set_vkeys(vkeyWitnesses);

    const transaction = finalizeTxBody(txBody, witnesses);

    try {
        const res = await blockfrostAPI.txSubmit(transaction!.to_bytes());
        if (res) {
            console.log(`Transaction successfully submitted for Tx ` + txHash.to_bech32('tx_test').toString());
        }
    } catch (error) {
        if (error instanceof BlockfrostServerError && error.status_code === 400) {
            console.log(`Transaction rejected for Tx ` + txHash.to_bech32('tx_test').toString());
            console.log(error.message);
        } 
    }
}