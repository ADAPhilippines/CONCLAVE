import { BlockFrostAPI, BlockfrostServerError } from '@blockfrost/blockfrost-js';
import CardanoWasm, { BigInt, BigNum } from "@emurgo/cardano-serialization-lib-nodejs";
import axios from "axios";
import fetch from "node-fetch";
import { fromHex } from "./utils/string_utils";
import {
    OutputAccounts,
    TxBodyDetails,
    UTXO,
    TxBodyOutput,
    TxBodyInput,
    CardanoAssetResponse
} from './types/response_types';
import cbor from 'cbor';
import { combineSmallUTXOsAsync, divideLargeUTXOsAsync, handleTransactionAsync } from './utils/transaction_utils';

function harden(num: number): number {
    return 0x80000000 + num;
}

const blockfrostAPI = new BlockFrostAPI({
    projectId: process.env.PROJECT_ID as string,
    isTestnet: true
});

// instantiate the tx builder with the Cardano protocol parameters - these may change later on
const linearFee = CardanoWasm.LinearFee.new(CardanoWasm.BigNum.from_str('44'), CardanoWasm.BigNum.from_str('155381'));

const setTxBuilderConfig = () => {
    const txBuilderCfg = CardanoWasm.TransactionBuilderConfigBuilder.new()
        .fee_algo(linearFee)
        .pool_deposit(CardanoWasm.BigNum.from_str('500000000'))
        .key_deposit(CardanoWasm.BigNum.from_str('2000000'))
        .max_value_size(4000)
        .max_tx_size(16384)
        .coins_per_utxo_word(CardanoWasm.BigNum.from_str('34482'))
        .build();

    const txBuilder = CardanoWasm.TransactionBuilder.new(txBuilderCfg);

    return txBuilder;
}

const someFunction = async () => {
    await divideLargeUTXOsAsync();
    await combineSmallUTXOsAsync();
    await handleTransactionAsync();
};

someFunction();