import { LinearFee } from '@emurgo/cardano-serialization-lib-nodejs';

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

// const txBuilderCfg = CardanoWasm.TransactionBuilderConfigBuilder.new()
//     .fee_algo(linearFee)
//     .pool_deposit(CardanoWasm.BigNum.from_str('500000000'))
//     .key_deposit(CardanoWasm.BigNum.from_str('2000000'))
//     .max_value_size(4000)
//     .max_tx_size(8000)
//     .coins_per_utxo_word(CardanoWasm.BigNum.from_str('34482'))
//     .build();
