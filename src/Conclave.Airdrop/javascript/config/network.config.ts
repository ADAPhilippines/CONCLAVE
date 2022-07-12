import { ProtocolParametersResponse } from "../types/response-types";
import { getCurrentEpochsAsync, getProtocolParametersAsync } from "../utils/epoch-utils";
import CardanoWasm, { TransactionBuilder } from '@dcspark/cardano-multiplatform-lib-nodejs';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

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
}

export const blockfrostAPI = new BlockFrostAPI({
    projectId: "testnet1fVIuBg2VhkRVBtDsAZkudFVwSfBNDtc",
    isTestnet: true
})