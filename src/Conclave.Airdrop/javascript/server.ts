import { BlockFrostAPI } from "@blockfrost/blockfrost-js";
import CardanoWasm from "@emurgo/cardano-serialization-lib-nodejs";
import axios from "axios";
import fetch from "node-fetch";

function harden(num: number): number {
  return 0x80000000 + num;
}

const blockfrostAPI = new BlockFrostAPI({
  projectId: process.env.PROJECT_ID as string,
});

var mnemonic = [
  "energy",
  "crater",
  "shallow",
  "must",
  "bronze",
  "clog",
  "level",
  "velvet",
  "such",
  "trial",
  "increase",
  "liberty",
];

// instantiate the tx builder with the Cardano protocol parameters - these may change later on
const linearFee = CardanoWasm.LinearFee.new(
  CardanoWasm.BigNum.from_str("44"),
  CardanoWasm.BigNum.from_str("155381")
);

const txBuilderCfg = CardanoWasm.TransactionBuilderConfigBuilder.new()
  .fee_algo(linearFee)
  .pool_deposit(CardanoWasm.BigNum.from_str("500000000"))
  .key_deposit(CardanoWasm.BigNum.from_str("2000000"))
  .max_value_size(4000)
  .max_tx_size(8000)
  .coins_per_utxo_word(CardanoWasm.BigNum.from_str("34482"))
  .build();

const txBuilder = CardanoWasm.TransactionBuilder.new(txBuilderCfg);

console.log(process.env.BASE_ADDRESS);
console.log(process.env.PROJECT_ID);
