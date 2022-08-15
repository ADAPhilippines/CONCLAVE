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
	txHash: string | null; // null | empty
};

export type AirdropWorkerResponse = {
	status: number;
	txHashString: string;
	batch: AirdropBatch;
	message: string;
};

export type AirdropWorkerParameter = {
	batch: AirdropBatch;
	protocolParameter: ProtocolParametersResponse;
};

export type TransactionData = {
	/** Transaction hash */
	hash: string;
	/** Block hash */
	block: string;
	/** Block number */
	block_height: number;
	/** Block creation time in UNIX time */
	block_time: number;
	/** Slot number */
	slot: number;
	/** Transaction index within the block */
	index: number;
	output_amount: {
		/** The unit of the value */
		unit: string;
		/** The quantity of the unit */
		quantity: string;
	}[];
	/** Fees of the transaction in Lovelaces */
	fees: string;
	/** Deposit within the transaction in Lovelaces */
	deposit: string;
	/** Size of the transaction in Bytes */
	size: number;
	/** Left (included) endpoint of the timelock validity intervals */
	invalid_before: string | null;
	/** Right (excluded) endpoint of the timelock validity intervals */
	invalid_hereafter: string | null;
	/** Count of UTXOs within the transaction */
	utxo_count: number;
	/** Count of the withdrawals within the transaction */
	withdrawal_count: number;
	/** Count of the MIR certificates within the transaction */
	mir_cert_count: number;
	/** Count of the delegations within the transaction */
	delegation_count: number;
	/** Count of the stake keys (de)registration within the transaction */
	stake_cert_count: number;
	/** Count of the stake pool registration and update certificates within the transaction */
	pool_update_count: number;
	/** Count of the stake pool retirement certificates within the transaction */
	pool_retire_count: number;
	/** Count of asset mints and burns within the transaction */
	asset_mint_or_burn_count: number;
	/** Count of redeemers within the transaction */
	redeemer_count: number;
	/** True if contract script passed validation */
	valid_contract: boolean;
};
// const txBuilderCfg = CardanoWasm.TransactionBuilderConfigBuilder.new()
//     .fee_algo(linearFee)
//     .pool_deposit(CardanoWasm.BigNum.from_str('500000000'))
//     .key_deposit(CardanoWasm.BigNum.from_str('2000000'))
//     .max_value_size(4000)
//     .max_tx_size(8000)
//     .coins_per_utxo_word(CardanoWasm.BigNum.from_str('34482'))
//     .build();
