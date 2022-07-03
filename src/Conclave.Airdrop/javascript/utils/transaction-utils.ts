import { BlockFrostAPI, BlockfrostServerError } from '@blockfrost/blockfrost-js';
import {
    CardanoAssetResponse,
    ConclaveTxBodyDetails,
    ProtocolParametersResponse,
    RewardTxBodyDetails,
    TxBodyInput,
    UTXO,
} from '../types/response-types';
import { getCurrentEpochsAsync, getProtocolParametersAsync } from './epoch-utils';
import CardanoWasm, { AssetName, Assets, BigNum, MultiAsset, ScriptHash, TransactionBuilder, TransactionOutputBuilder } from '@emurgo/cardano-serialization-lib-nodejs';
import cbor from 'cbor';
import { fromHex } from './string-utils';
import { createConclaveTxBodyAsync, createRewardTxBodyAsync } from './txBody/txBody-utils';

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
};

//mainnet
// const blockfrostAPI = new BlockFrostAPI({
//     projectId: process.env.PROJECT_ID as string,
//     isTestnet: false,
// });

//tesnet
export const blockfrostAPI = new BlockFrostAPI({
    projectId: "testnet4Zo3x6oMtftyJH0X0uutC1RflLn8JtWR",
    isTestnet: true,
});

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

//sample wallet address and private key
//mainnet
// const cbor_hex_key = '58204765b18346caeb1ca0533dd2c0eb90f62a9ead7b8231dbede63393acde43ef20';
// const unhex = fromHex(cbor_hex_key);
// const decode = cbor.decode(unhex);
// const privKey = CardanoWasm.PrivateKey.from_normal_bytes(decode);

// const shelleyChangeAddress = CardanoWasm.Address.from_bech32('addr1v98kgx5f3z4xc5zhvrad9s4340h3y8aevwq9w4tcapvjgvqs5twp5');
// const shelleyOutputAddress = CardanoWasm.Address.from_bech32(
//     'addr1qykazed34gqdp3sy989p2xp3qdpvs0slex7umj35xdmzvcqa6g53xrnnhkv47txfj9vf6k8s4ulktgk7mlkfpxjflf2sjhcmpt'
// );

//testnet
const cbor_hex_key = '582007e4fc2151ff929ff906a48815d4707c715dbdd227bef6f8e0818407e59fd583';
const unhex = fromHex(cbor_hex_key);
const decode = cbor.decode(unhex);
export const privKey = CardanoWasm.PrivateKey.from_normal_bytes(decode);

export const shelleyChangeAddress = CardanoWasm.Address.from_bech32('addr_test1vrhcq70gslwqchcerumm0uqu08zy68qg2mdmh95ar5t545c7avx8t');
export const shelleyOutputAddress = CardanoWasm.Address.from_bech32('addr_test1qrzx30tju0gvsmcvnn48zc3pe5qc49npydky6qd2huh4640h7m58dq0yf0uule4fq0cun04cxgh9n8nuk6dwdxnahmhs8dxnz8');
export const policyId = "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca18"
export const assetName = "53616d706c65546f6b656e4a0a"
export const policyStr = "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a";

export const setTTLAsync = async (): Promise<number> => {
    const latestBlock = await blockfrostAPI.blocksLatest();
    const currentSlot = latestBlock.slot;

    return currentSlot! + 7200;
};

export const signTxBody = (
    txHash: CardanoWasm.TransactionHash,
    txBody: CardanoWasm.TransactionBody,
    signKey: CardanoWasm.PrivateKey
): CardanoWasm.Transaction | null => {
    try {
        const witnesses = CardanoWasm.TransactionWitnessSet.new();
        const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
        const vkeyWitness = CardanoWasm.make_vkey_witness(txHash, signKey);
        vkeyWitnesses.add(vkeyWitness);
        witnesses.set_vkeys(vkeyWitnesses);

        const transaction = finalizeTxBody(txBody, witnesses);

        return transaction;
    } catch (error) {
        console.log('Error Signing Transaction body ' + error);
        return null;
    }
};

export const finalizeTxBody = (
    txBody: CardanoWasm.TransactionBody,
    witnesses: CardanoWasm.TransactionWitnessSet
): CardanoWasm.Transaction | null => {
    try {
        const transaction = CardanoWasm.Transaction.new(txBody, witnesses);
        return transaction;
    } catch (error) {
        console.log('Error Creating Transaction body ' + error);
        return null;
    }
};

export const submitTransactionAsync = async (
    transaction: CardanoWasm.Transaction,
    txHash: CardanoWasm.TransactionHash,
    txItem: ConclaveTxBodyDetails | RewardTxBodyDetails): Promise<ConclaveTxBodyDetails | RewardTxBodyDetails | null> => {
    try {
        const res = await blockfrostAPI.txSubmit(transaction!.to_bytes());
        if (res) {
            console.log(`Transaction successfully submitted for Tx ` + txHash.to_bech32('tx_test').toString());
        }
        return txItem;
    } catch (error) {
        if (error instanceof BlockfrostServerError && error.status_code === 400) {
            console.log(`Transaction rejected for Tx ` + txHash.to_bech32('tx_test').toString());
            console.log(error.message);
        }
        return null;
    }
};

export const createAndSignRewardTxAsync = async (
    txBodyDetails: RewardTxBodyDetails
): Promise<{
    transaction: CardanoWasm.Transaction;
    txHash: CardanoWasm.TransactionHash
} | null> => {
    let txBodyResult = await createRewardTxBodyAsync(txBodyDetails);
    if (txBodyResult == null) return null;

    let txSigned = signTxBody(txBodyResult.txHash, txBodyResult.txBody, privKey);
    if (txSigned == null) return null;

    return { transaction: txSigned, txHash: txBodyResult.txHash };
};

export const createAndSignConclaveTxAsync = async (
    txBodyDetails: ConclaveTxBodyDetails
): Promise<{
    transaction: CardanoWasm.Transaction;
    txHash: CardanoWasm.TransactionHash
} | null> => {
    let txBodyResult = await createConclaveTxBodyAsync(txBodyDetails);
    if (txBodyResult == null) return null;

    let txSigned = signTxBody(txBodyResult.txHash, txBodyResult.txBody, privKey);
    if (txSigned == null) return null;

    return { transaction: txSigned, txHash: txBodyResult.txHash };
};