import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { ProtocolParametersResponse } from '../types/response_types';
import { getCurrentEpochsAsync, getProtocolParametersAsync } from './epoch_utils';
import CardanoWasm, { TransactionBuilder } from '@emurgo/cardano-serialization-lib-nodejs';

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
