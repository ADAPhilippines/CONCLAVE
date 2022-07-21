import { BigNum, LinearFee } from '@dcspark/cardano-multiplatform-lib-nodejs';
import { Responses } from '@blockfrost/blockfrost-js';
import { ConclaveAmount, Reward } from './database-types';
import { PendingReward } from './helper-types';
import AirdropTransactionStatus from '../enums/airdrop-transaction-status';

export type UTXO = Responses['address_utxo_content'];

export type CardanoAssetResponse = {
	unit: string;
	quantity: string;
};

export type ProtocolParametersResponse = {
	min_fee_a: string;
	min_fee_b: string;
	poolDeposit: string;
	keyDeposit: string;
	maxValueSize: number;
	maxTxSize: number;
	coinsPerUtxoWord: string;
};

export type TxBodyInput = {
	txHash: string;
	outputIndex: string;
	asset: Array<CardanoAssetResponse>;
};

export type RewardTxBodyDetails = {
	txInputs: Array<TxBodyInput>;
	txOutputs: Array<PendingReward>;
	fee: string;
	txOutputSum: number;
};

export type AirdropBatch = {
	isProcessing: boolean;
	index: number;
	txInputs: Array<TxBodyInput>;
	txOutputs: Array<PendingReward>;
};

export type AirdropWorkerResponse = {
	status: number;
	txHashString: string;
	batch: AirdropBatch;
};

export type AirdropWorkerParameter = {
	batch: AirdropBatch;
	protocolParameter: ProtocolParametersResponse;
};
// const txBuilderCfg = CardanoWasm.TransactionBuilderConfigBuilder.new()
//     .fee_algo(linearFee)
//     .pool_deposit(CardanoWasm.BigNum.from_str('500000000'))
//     .key_deposit(CardanoWasm.BigNum.from_str('2000000'))
//     .max_value_size(4000)
//     .max_tx_size(8000)
//     .coins_per_utxo_word(CardanoWasm.BigNum.from_str('34482'))
//     .build();
