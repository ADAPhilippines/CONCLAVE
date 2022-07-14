import { Reward } from "../../types/database-types";
import { RewardTxBodyDetails, TxBodyInput } from "../../types/response-types";
import { isNull } from "../boolean-utils";
import { calculateRewardFeesAsync } from "../fees-utils";
import { initRewardTxBodyDetails } from "../type-utils";
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { setTTLAsync } from "../transaction-utils";
import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import { setTxInputs } from "./txInput-utils";
import { setRewardTxOutputs } from "./txOutput-utils";
import { shelleyChangeAddress } from "../../config/walletKeys.config";
import { getLatestProtocolParametersAsync } from "../../config/network.config";
import { getTransactionBuilder } from "../../config/transaction.config";
import { PendingReward } from "../../types/helper-types";

const blockfrostAPI = new BlockFrostAPI({
    projectId: "testnet4Zo3x6oMtftyJH0X0uutC1RflLn8JtWR",
    isTestnet: true,
});

export const createRewardTxBodywithFee = async (
    inputs: Array<TxBodyInput>,
    outputs: Array<PendingReward>,
    outputSum: number): Promise<RewardTxBodyDetails | null> => {
    const newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(inputs, outputSum, "0", outputs);

    let fees = await calculateRewardFeesAsync(newTxBodyDetails);
    if (isNull(fees)) return null;

    newTxBodyDetails.fee = fees!;

    return newTxBodyDetails;
};

export const createRewardTxBodyAsync = async (
    txBodyDetails: RewardTxBodyDetails
): Promise<{ txHash: CardanoWasm.TransactionHash; txBody: CardanoWasm.TransactionBody } | null> => {
    try {
        let txBuilder = await setRewardTxBodyDetailsAsync(txBodyDetails);
        let ttl = await setTTLAsync();
        txBuilder.set_ttl(CardanoWasm.BigNum.from_str(ttl.toString()));
        txBuilder.add_change_if_needed(shelleyChangeAddress);
        const txBody = txBuilder.build();
        const txHash = CardanoWasm.hash_transaction(txBody);
        
        return { txHash, txBody };
    } catch (error) {
        console.log('Error Creating TxBody ' + error);
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