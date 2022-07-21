import { ProtocolParametersResponse } from '../types/response-types';
import CardanoWasm, { TransactionBuilder } from '@dcspark/cardano-multiplatform-lib-nodejs';

export const getTransactionBuilder = (config: ProtocolParametersResponse): TransactionBuilder => {
	const linearFee = CardanoWasm.LinearFee.new(
		CardanoWasm.BigNum.from_str(config.min_fee_a.toString()),
		CardanoWasm.BigNum.from_str(config.min_fee_b.toString())
	);

	const txBuilderConfig = CardanoWasm.TransactionBuilderConfigBuilder.new()
		.fee_algo(linearFee)
		.pool_deposit(CardanoWasm.BigNum.from_str(config.poolDeposit))
		.key_deposit(CardanoWasm.BigNum.from_str(config.keyDeposit))
		.max_value_size(config.maxValueSize)
		.max_tx_size(config.maxTxSize)
		.coins_per_utxo_word(CardanoWasm.BigNum.from_str(config.coinsPerUtxoWord))
		.build();

	return CardanoWasm.TransactionBuilder.new(txBuilderConfig);
};
