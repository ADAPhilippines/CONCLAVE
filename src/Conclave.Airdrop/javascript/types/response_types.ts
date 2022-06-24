import { BigNum, LinearFee } from '@emurgo/cardano-serialization-lib-nodejs';
import { Responses } from '@blockfrost/blockfrost-js';

export type UTXO = Responses['address_utxo_content'];

export type CardanoAssetResponse = {
    unit: string;
    quantity: string;
};

export type ProtocolParametersResponse = {
    linearFee: LinearFee;
    poolDeposit: string;
    keyDeposit: string;
    maxValueSize: number;
    maxTxSize: number;
    coinsPerUtxoWord: string;
};

export type TxBodyInput = {
    txHash: string,
    outputIndex: number,
    asset: CardanoAssetResponse
}

export type TxBodyOutput = {
    account: string,
    asset: CardanoAssetResponse
}

export type OutputAccount = {
    account: string,
    asset: CardanoAssetResponse,
    airdropStatus: string
}

export type TxBodyDetails = {
    txInputs: Array<TxBodyInput>,
    txOutputs: Array<OutputAccount>
    fee: string,
    txOutputSum: number
}
// const txBuilderCfg = CardanoWasm.TransactionBuilderConfigBuilder.new()
//     .fee_algo(linearFee)
//     .pool_deposit(CardanoWasm.BigNum.from_str('500000000'))
//     .key_deposit(CardanoWasm.BigNum.from_str('2000000'))
//     .max_value_size(4000)
//     .max_tx_size(8000)
//     .coins_per_utxo_word(CardanoWasm.BigNum.from_str('34482'))
//     .build();
