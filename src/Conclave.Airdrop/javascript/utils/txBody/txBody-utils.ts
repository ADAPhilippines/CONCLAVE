import { ConclaveAmount, Reward } from "../../types/database-types";
import { ConclaveTxBodyDetails, RewardTxBodyDetails, TxBodyInput } from "../../types/response-types";
import { isNull } from "../boolean-utils";
import { calculateConclaveFeesAsync, calculateRewardFeesAsync } from "../fees-utils";
import { initConclaveTxBodyDetails, initRewardTxBodyDetails } from "../type-utils";
import CardanoWasm, { AssetName, Assets, BigNum, MultiAsset, ScriptHash, TransactionBuilder, TransactionOutputBuilder } from '@emurgo/cardano-serialization-lib-nodejs';
import { getLatestProtocolParametersAsync, getTransactionBuilder, setTTLAsync, shelleyChangeAddress } from "../transaction-utils";
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import { setTxInputs } from "./txInput-utils";
import { setConclaveTxOutputs, setRewardTxOutputs } from "./txOutput-utils";

export const createConclaveTxBodyWithFee = async (
    inputs: Array<TxBodyInput>,
    outputs: Array<ConclaveAmount>,
    conclaveSum: number,
    collateralSum: number): Promise<ConclaveTxBodyDetails | null> => {
    const newTxBodyDetails: ConclaveTxBodyDetails = initConclaveTxBodyDetails(inputs, collateralSum, conclaveSum, "0", outputs);
    let fees = await calculateConclaveFeesAsync(newTxBodyDetails);

    if (isNull(fees)) {
        return null;
    };
    newTxBodyDetails.fee = fees!;

    return newTxBodyDetails;
};

const blockfrostAPI = new BlockFrostAPI({
    projectId: "testnet4Zo3x6oMtftyJH0X0uutC1RflLn8JtWR",
    isTestnet: true,
});

export const createRewardTxBodywithFee = async (
    inputs: Array<TxBodyInput>,
    outputs: Array<Reward>,
    outputSum: number): Promise<RewardTxBodyDetails | null> => {
    const newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(inputs, outputSum, "0", outputs);
    let fees = await calculateRewardFeesAsync(newTxBodyDetails);

    if (isNull(fees)) {
        return null
    };
    newTxBodyDetails.fee = fees!;

    return newTxBodyDetails;
};

export const createRewardTxBodyAsync = async (
    txBodyDetails: RewardTxBodyDetails
): Promise<{ txHash: CardanoWasm.TransactionHash; txBody: CardanoWasm.TransactionBody } | null> => {
    try {
        let txBuilder = await setRewardTxBodyDetailsAsync(txBodyDetails);
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

export const createConclaveTxBodyAsync = async (
    txBodyDetails: ConclaveTxBodyDetails
): Promise<{ txHash: CardanoWasm.TransactionHash; txBody: CardanoWasm.TransactionBody } | null> => {
    try {
        let txBuilder = await setConclaveTxBodyDetailsAsync(txBodyDetails);
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

export const setRewardTxBodyDetailsAsync = async (txBodyDetails: RewardTxBodyDetails): Promise<CardanoWasm.TransactionBuilder> => {
    let protocolParameter = await getLatestProtocolParametersAsync(blockfrostAPI);
    let txBuilder = getTransactionBuilder(protocolParameter);

    setTxInputs(txBuilder, txBodyDetails.txInputs);
    setRewardTxOutputs(txBuilder, txBodyDetails.txOutputs);
    return txBuilder;
};

export const setConclaveTxBodyDetailsAsync = async (txBodyDetails: ConclaveTxBodyDetails): Promise<CardanoWasm.TransactionBuilder> => {
    let protocolParameter = await getLatestProtocolParametersAsync(blockfrostAPI);
    let txBuilder = getTransactionBuilder(protocolParameter);

    setTxInputs(txBuilder, txBodyDetails.txInputs);
    setConclaveTxOutputs(txBuilder, txBodyDetails.txOutputs);

    return txBuilder;
};