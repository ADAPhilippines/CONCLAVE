
import { BlockFrostAPI, BlockfrostServerError } from '@blockfrost/blockfrost-js';
import { 
    CardanoAssetResponse, 
    OutputAccount, 
    ProtocolParametersResponse, 
    TxBodyDetails, 
    TxBodyInput, 
    TxBodyOutput, 
    UTXO } from '../types/response_types';
import { getCurrentEpochsAsync, getProtocolParametersAsync } from './epoch_utils';

import CardanoWasm, { TransactionBuilder } from '@emurgo/cardano-serialization-lib-nodejs';
import cbor from 'cbor';
import { fromHex } from './string_utils';
import { queryAllUTXOsAsync } from './utxo_utils';

export const getLatestProtocolParametersAsync = async (
    blockfrostAPI: BlockFrostAPI
): Promise<ProtocolParametersResponse> => {
    const protocolParams = await getProtocolParametersAsync(
        blockfrostAPI,
        (
            await getCurrentEpochsAsync(blockfrostAPI)
        ).epoch
    );
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

const blockfrostAPI = new BlockFrostAPI({
    projectId: process.env.PROJECT_ID as string,
    isTestnet: true
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
const cbor_hex_key = "582007e4fc2151ff929ff906a48815d4707c715dbdd227bef6f8e0818407e59fd583";
const unhex = fromHex(cbor_hex_key);
const decode = cbor.decode(unhex);
const privKey = CardanoWasm.PrivateKey.from_normal_bytes(decode);

const shelleyOutputAddress = CardanoWasm.Address.from_bech32("addr_test1qrmrn6y4z846x38aj7rvusd8m58kw79k5yuqnje9kzvcllrjn3xacmz2j4j7qmtkw6z0hkxuuh06jd8actmgwgkhwf4qmlvcpr");
const shelleyChangeAddress = CardanoWasm.Address.from_bech32("addr_test1vrhcq70gslwqchcerumm0uqu08zy68qg2mdmh95ar5t545c7avx8t");
const shelleyOutputAddress2 = CardanoWasm.Address.from_bech32("addr_test1qrzx30tju0gvsmcvnn48zc3pe5qc49npydky6qd2huh4640h7m58dq0yf0uule4fq0cun04cxgh9n8nuk6dwdxnahmhs8dxnz8");

const convertRawUTXO = async (): Promise<Array<TxBodyInput>> => {
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let txBodyInputs: Array<TxBodyInput> = [];

    utxos.forEach((utxo) => {
        const cardanoAsset: CardanoAssetResponse = {
            unit: utxo.amount[0].unit,
            quantity: utxo.amount[0].quantity
        }
        const utxoInput: TxBodyInput = {
            txHash: utxo.tx_hash,
            outputIndex: utxo.output_index,
            asset: cardanoAsset
        }

        txBodyInputs.push(utxoInput);
    });

    return txBodyInputs;
}

const getAllTxOutput = (): Array<OutputAccount> => {
    let txBodyOutputs: Array<OutputAccount> = [];

    for (let i = 0; i < 10; i++) {
        const asset: CardanoAssetResponse = {
            unit: "Lovelace",
            quantity: "3000000"
        }

        const txBodyOutput: OutputAccount = {
            account: "addr_test1qrzx30tju0gvsmcvnn48zc3pe5qc49npydky6qd2huh4640h7m58dq0yf0uule4fq0cun04cxgh9n8nuk6dwdxnahmhs8dxnz8",
            asset: asset,
            airdropStatus: "new"
        };

        txBodyOutputs.push(txBodyOutput);
    }

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
}

function updateAirdropStatus(txOutputs: Array<OutputAccount>, newStatus: string)
{
    txOutputs.forEach(outputAccount => {
        outputAccount.airdropStatus = newStatus;
    });
    console.log("Updated airdrop status to " + newStatus);
};

const selectTxInputOutputAsync = async (
    txBodyInputs: Array<TxBodyInput>,
    txBodyOutputs: Array<OutputAccount>): 
    Promise<Array<TxBodyDetails> | null> => {

    let _txBodyInputs = txBodyInputs.sort((m, n) => parseInt(n.asset.quantity) - parseInt(m.asset.quantity));
    let _txBodyOutputs = txBodyOutputs.sort((m, n) => parseInt(m.asset.quantity) - parseInt(n.asset.quantity));
    
    let txBodyDetailsArray: Array<TxBodyDetails> = [];
    let currentUTXOsBatch: Array<TxBodyInput> = _txBodyInputs.splice(0, 249);
    let currentOutputsBatch: Array<OutputAccount> = _txBodyOutputs.splice(0, 249);

    let partialUTXOSum = getInputUTXOSum(currentUTXOsBatch);
    let partialOutputsSum = getOutputAmountSum(currentOutputsBatch);

    while (currentOutputsBatch.length > 0 && currentUTXOsBatch.length > 0) 
    {
        //Get 250
        while (currentUTXOsBatch.length + currentOutputsBatch.length > 250) {
            if (partialOutputsSum > partialUTXOSum) {
                if (currentOutputsBatch.length > 0) _txBodyOutputs.unshift(currentOutputsBatch.pop()!);
            }

            if (partialUTXOSum >= partialOutputsSum) {
                if (currentUTXOsBatch.length > 0) _txBodyInputs.unshift(currentUTXOsBatch.pop()!);
            }

            partialUTXOSum = getInputUTXOSum(currentUTXOsBatch);
            partialOutputsSum = getOutputAmountSum(currentOutputsBatch);
        }

        while (partialUTXOSum < partialOutputsSum) {
            if (currentOutputsBatch.length > 0) _txBodyOutputs.unshift(currentOutputsBatch.pop()!);

            partialUTXOSum = getInputUTXOSum(currentUTXOsBatch);
            partialOutputsSum = getOutputAmountSum(currentOutputsBatch);
        }

        while (partialUTXOSum < partialOutputsSum) {
            if (currentOutputsBatch.length > 0) _txBodyOutputs.unshift(currentOutputsBatch.pop()!);

            partialUTXOSum = getInputUTXOSum(currentUTXOsBatch);
            partialOutputsSum = getOutputAmountSum(currentOutputsBatch);
        }

        while (partialUTXOSum >= partialOutputsSum) {
            if (currentUTXOsBatch.length > 0) _txBodyInputs.unshift(currentUTXOsBatch.pop()!);

            partialUTXOSum = getInputUTXOSum(currentUTXOsBatch);
            partialOutputsSum = getOutputAmountSum(currentOutputsBatch);
        }

        if (_txBodyOutputs.shift !== null && _txBodyOutputs !== undefined)
        {
            currentUTXOsBatch.push(_txBodyInputs.shift()!)
        }

        if (partialOutputsSum > 0) {
            const newTxBodyDetails: TxBodyDetails = {
                txInputs: currentUTXOsBatch,
                txOutputs: currentOutputsBatch,
                fee: "0",
                txOutputSum: partialOutputsSum
            }

            let fees = await calculateFeesAsync(newTxBodyDetails);
            if (fees == null) continue;

            newTxBodyDetails.fee = fees;

            if (newTxBodyDetails != null && newTxBodyDetails !== undefined)
            {
                txBodyDetailsArray.push(newTxBodyDetails);
            }

            currentUTXOsBatch = _txBodyInputs.splice(0, 249);
            currentOutputsBatch = _txBodyOutputs.splice(0, 249);
        } else break;
    }

    txBodyDetailsArray = deductFees(txBodyDetailsArray);

    return txBodyDetailsArray;
}

const calculateFeesAsync = async (newTxBodyDetails: TxBodyDetails):
    Promise<string | null> => {
    let _txOutputs: Array<OutputAccount> = [];

    const _newTxBodyDetails: TxBodyDetails = {
        txInputs: newTxBodyDetails.txInputs,
        txOutputs: [],
        fee: "0",
        txOutputSum: newTxBodyDetails.txOutputSum
    }

    newTxBodyDetails.txOutputs.forEach(e => {
        const _asset: CardanoAssetResponse = {
            quantity: "1000000",
            unit: "Lovelace"
        }
        const _newTxOutput: OutputAccount = {
            account: e.account,
            asset: _asset,
            airdropStatus: "Pending"
        }

        _txOutputs.push(_newTxOutput);
    });

    _newTxBodyDetails.txOutputs = _txOutputs;

    let _result = await createTxBodyAsync(_newTxBodyDetails);
    if (_result == null) return null;

    return _result.txBody.fee().to_str();
}

const deductFees = (txBodyDetailsArray: Array<TxBodyDetails>): Array<TxBodyDetails> => {
    txBodyDetailsArray.forEach(element => {
        element.txOutputs.forEach(e => {
            e.asset.quantity = (parseInt(e.asset.quantity) - (((parseInt(element.fee) + 200) / element.txOutputSum) * (parseInt(e.asset.quantity)))).toFixed().toString();
        });
    });

    return txBodyDetailsArray;
}

const setTTLAsync = async (): Promise<number> => {
    const latestBlock = await blockfrostAPI.blocksLatest();
    const currentSlot = latestBlock.slot;

    return currentSlot! + 7200;
}

const createTxBodyAsync = async (txBodyDetails: TxBodyDetails):
    Promise<{ txHash: CardanoWasm.TransactionHash, txBody: CardanoWasm.TransactionBody } | null> => {
    try {
        let txBuilder = await setTxBodyDetailsAsync(txBodyDetails);
        let ttl = await setTTLAsync();

        txBuilder.set_ttl(ttl);
        txBuilder.add_change_if_needed(shelleyChangeAddress);

        const txBody = txBuilder.build();
        const txHash = CardanoWasm.hash_transaction(txBody);

        return { txHash, txBody };
    } catch (error) {
        console.log("Error Creating Tx Body " + error);
        return null;
    }
}

const setTxBodyDetailsAsync = async (txBodyDetails: TxBodyDetails):
    Promise<CardanoWasm.TransactionBuilder> => {
    let protocolParameter = await getLatestProtocolParametersAsync(blockfrostAPI);
    let txBuilder = getTransactionBuilder(protocolParameter);

    txBodyDetails.txInputs.forEach((txInput: TxBodyInput) => {
        txBuilder.add_key_input(
            privKey.to_public().hash(),
            CardanoWasm.TransactionInput.new(
                CardanoWasm.TransactionHash.from_bytes(
                    Buffer.from(txInput.txHash, "hex")
                ), // tx hash
                txInput.outputIndex, // index
            ),
            CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(txInput.asset.quantity))
        );
    })

    txBodyDetails.txOutputs.forEach((txOutput: OutputAccount) => {
        txBuilder.add_output(
            CardanoWasm.TransactionOutput.new(
                CardanoWasm.Address.from_bech32(txOutput.account),
                CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(txOutput.asset.quantity))
            ),
        );
    })
    return txBuilder;
}

const signTxBody = (
    txHash: CardanoWasm.TransactionHash,
    txBody: CardanoWasm.TransactionBody,
    signKey: CardanoWasm.PrivateKey): CardanoWasm.Transaction | null => {
    try {
        const witnesses = CardanoWasm.TransactionWitnessSet.new();
        const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
        const vkeyWitness = CardanoWasm.make_vkey_witness(txHash, signKey);
        vkeyWitnesses.add(vkeyWitness);
        witnesses.set_vkeys(vkeyWitnesses);

        const transaction = finalizeTxBody(txBody, witnesses);

        return transaction;

    } catch (error) {
        console.log("Error Signing Transaction body " + error);
        return null;
    }
}





const finalizeTxBody = (
    txBody: CardanoWasm.TransactionBody,
    witnesses: CardanoWasm.TransactionWitnessSet): CardanoWasm.Transaction | null => {
    try {
        const transaction = CardanoWasm.Transaction.new(
            txBody,
            witnesses
        );
        return transaction;
    } catch (error) {
        console.log("Error Creating Transaction body " + error);
        return null;
    }
}

const submitTransactionAsync = async (
    transaction: CardanoWasm.Transaction | null,
    txHash: CardanoWasm.TransactionHash) => {
    // let utxos  = await queryAllUTXOs("addr_test1vrhcq70gslwqchcerumm0uqu08zy68qg2mdmh95ar5t545c7avx8t");
    // console.log("Transaction Submitted successfully");
    try {
        const res = await blockfrostAPI.txSubmit(transaction!.to_bytes());
        if (res) {
            console.log(`Transaction successfully submitted for Tx ` + txHash.to_bech32("tx_test").toString());
        }
    } catch (error) {
        if (error instanceof BlockfrostServerError && error.status_code === 400) {
            console.log(`Transaction rejected for Tx ` + txHash.to_bech32("tx_test").toString());
            console.log(error.message);
        } else {
            throw error;
        }
    }
}

const getOutputAmountSum = (currentOutputBatch: Array<OutputAccount>): number => {
    if (currentOutputBatch === null || currentOutputBatch === undefined) return 0;

    let _partialSum = 0;

    currentOutputBatch.forEach(outputAccount => {
        _partialSum += parseInt(outputAccount.asset.quantity.toString());
    });

    return _partialSum;
}

const getInputUTXOSum = (currentUTXOs: Array<TxBodyInput>): number => {
    let _partialSum = 0;

    currentUTXOs.forEach(utxo => {
        _partialSum += parseInt(utxo.asset.quantity.toString());
    });

    return _partialSum;
}

const awaitChangeInUTXOAsync = async (
    txInputs: Array<TxBodyInput>,
    txHash: CardanoWasm.TransactionHash) => {
    let txHashArray: Array<string> = [];
    let randomInterval = Math.floor(Math.random() * 25000);

    txInputs.forEach(element => {
        txHashArray.push(element.txHash);
    });

    var CheckUTX0 = setInterval(async () => {
        console.log("Waiting for utxo to update after Tx " + txHash.to_bech32("tx_test").toString() + " at random Interval " + (randomInterval + 12000));
        let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
        let commonHash = utxos.filter(v => txHashArray.includes(v.tx_hash));
        randomInterval = Math.floor(Math.random() * 25000);

        if (commonHash.length === 0 || commonHash === null || commonHash === undefined) clearInterval(CheckUTX0);
    }, 12000 + randomInterval);
}

const getLargeUTXOs = (utxos: UTXO): { txInputs: Array<TxBodyInput>, txOutputs: Array<OutputAccount> } | null => {
    let txBodyInputs: Array<TxBodyInput> = [];
    let txBodyOutputs: Array<OutputAccount> = [];
    let divider;
    let remainder;

    utxos.forEach((utxo) => {
        if (parseInt(utxo.amount[0].quantity) > 1200000000) {
            const cardanoAsset: CardanoAssetResponse = {
                unit: utxo.amount[0].unit,
                quantity: utxo.amount[0].quantity
            }

            const utxoInput: TxBodyInput = {
                txHash: utxo.tx_hash,
                outputIndex: utxo.output_index,
                asset: cardanoAsset
            }

            txBodyInputs.push(utxoInput);
        }
    });

    txBodyInputs = txBodyInputs.splice(0, 249);
    let utxoSum = getInputUTXOSum(txBodyInputs);
    if (utxoSum == 0) return null;

    divider = utxoSum / 2;
    remainder = utxoSum % 2;

    for (let i = 0; i < 2; i++) {
        const cardanoAsset: CardanoAssetResponse = {
            unit: "Lovelace",
            quantity: divider.toString()
        }

        const outputAccount: OutputAccount = {
            account: shelleyChangeAddress.to_bech32().toString(),
            asset: cardanoAsset,
            airdropStatus: "pending"
        }

        txBodyOutputs.push(outputAccount);
    }

    const cardanoAsset: CardanoAssetResponse = {
        unit: "Lovelace",
        quantity: remainder.toString()
    }

    const outputAccount: OutputAccount = {
        account: shelleyChangeAddress.to_bech32().toString(),
        asset: cardanoAsset,
        airdropStatus: "pending"
    }

    txBodyOutputs.push(outputAccount);

    return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
};

const getSmallUTXOs = (utxos: UTXO): {
    txInputs: Array<TxBodyInput>,
    txOutputs: Array<OutputAccount>
} | null => {
    let txBodyInputs: Array<TxBodyInput> = [];
    let txBodyOutputs: Array<OutputAccount> = [];

    utxos.forEach((utxo) => {
        if (parseInt(utxo.amount[0].quantity) < 300000000) {
            const cardanoAsset: CardanoAssetResponse = {
                unit: utxo.amount[0].unit,
                quantity: utxo.amount[0].quantity
            }

            const utxoInput: TxBodyInput = {
                txHash: utxo.tx_hash,
                outputIndex: utxo.output_index,
                asset: cardanoAsset
            }

            txBodyInputs.push(utxoInput);
        }
    });

    txBodyInputs = txBodyInputs.splice(0, 249);

    let utxoSum = getInputUTXOSum(txBodyInputs);
    if (utxoSum === 0) return null;

    const cardanoAsset: CardanoAssetResponse = {
        unit: "Lovelace",
        quantity: utxoSum.toString()
    }

    const outputAccount: OutputAccount = {
        account: shelleyChangeAddress.to_bech32().toString(),
        asset: cardanoAsset,
        airdropStatus: "pending"
    }

    txBodyOutputs.push(outputAccount);

    return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
}

export const divideLargeUTXOsAsync = async () => {
    console.log("Dividing UTXOs");
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    
    let result = getLargeUTXOs(utxos);
    if (result?.txInputs == null || result?.txOutputs === null || result === null) return;
    let txinputoutputs = await selectTxInputOutputAsync(result.txInputs, result.txOutputs);
    if (txinputoutputs == null || txinputoutputs.length === 0 || txinputoutputs === undefined) return;

    for (let txItem of txinputoutputs) {
        let transaction = await createAndSignTxAsync(txItem);
        if (transaction == null) return;

        console.log("Combining Small UTXOs");
        console.log("Transaction " + transaction.txHash.to_bech32("tx_test").toString() + " fee " + transaction.transaction.body().fee().to_str());

        await submitTransactionAsync(transaction.transaction, transaction.txHash);

        console.log("");

        await awaitChangeInUTXOAsync(txItem.txInputs, transaction.txHash);
    }
    console.log("Finished");
}

export const combineSmallUTXOsAsync = async () => {
    console.log("Combining UTXOs");
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    
    let result = getSmallUTXOs(utxos);
    if (result?.txInputs == null || result?.txOutputs === null || result === null) return;
    let txinputoutputs = await selectTxInputOutputAsync(result.txInputs, result.txOutputs);
    if (txinputoutputs == null || txinputoutputs.length === 0 || txinputoutputs === undefined) return;

    for (let txItem of txinputoutputs) {
        let transaction = await createAndSignTxAsync(txItem);
        if (transaction == null) return;

        console.log("Combining Small UTXOs");
        console.log("Transaction " + transaction.txHash.to_bech32("tx_test").toString() + " fee " + transaction.transaction.body().fee().to_str());

        await submitTransactionAsync(transaction.transaction, transaction.txHash);

        console.log("");

        await awaitChangeInUTXOAsync(txItem.txInputs, transaction.txHash);
    }
}

const createAndSignTxAsync = async (txBodyDetails: TxBodyDetails):
    Promise<{ transaction: CardanoWasm.Transaction, txHash: CardanoWasm.TransactionHash } | null> => {
    let result = await createTxBodyAsync(txBodyDetails);
    if (result == null) return null;

    let transaction = signTxBody(result.txHash, result.txBody, privKey);
    if (transaction == null) return null;

    return { transaction: transaction, txHash: result.txHash };
}

export const handleTransactionAsync = async () => {
    let utxosInWallet = await convertRawUTXO();
    let outputAccounts = getAllTxOutput();
    let txinputoutputs = await selectTxInputOutputAsync(utxosInWallet, outputAccounts);

    if (txinputoutputs == null) {
        console.log("no transaction");
        return;
    }

    txinputoutputs?.forEach((element, index) => {
        console.log(" ");
        console.log("Transaction " + index)
        element.txInputs.forEach(e => {
            console.log("Txinput " + e.txHash + " " + e.asset.quantity);
        });

        console.log("Txinput sum" + " " + getInputUTXOSum(element.txInputs));
        console.log("Txoutput sum" + " " + getOutputAmountSum(element.txOutputs));
        console.log("TxOutput count: " + element.txOutputs.length);
    });

    console.log(" ");

    for (let txItem of txinputoutputs) {
        let transaction = await createAndSignTxAsync(txItem);
        if (transaction == null) return;

        console.log("Transaction " + transaction.txHash.to_bech32("tx_test").toString() + " fee " + transaction.transaction.body().fee().to_str());
        //Submit Transaction
        await submitTransactionAsync(transaction.transaction, transaction.txHash);

        updateAirdropStatus(txItem.txOutputs, "submitted");
        console.log(" ");
        awaitChangeInUTXOAsync(txItem.txInputs, transaction.txHash);
    }
};
