import { BlockFrostAPI, BlockfrostServerError } from '@blockfrost/blockfrost-js';
import {
    CardanoAssetResponse,
    ConclaveTxBodyDetails,
    OutputAccount,
    ProtocolParametersResponse,
    RewardTxBodyDetails,
    TxBodyInput,
    TxBodyOutput,
    UTXO,
} from '../types/response-types';
import { getCurrentEpochsAsync, getProtocolParametersAsync } from './epoch-utils';

import CardanoWasm, { AssetName, Assets, BigNum, MultiAsset, ScriptHash, TransactionBuilder, TransactionOutputBuilder } from '@emurgo/cardano-serialization-lib-nodejs';
import cbor from 'cbor';
import { fromHex } from './string-utils';
import { queryAllUTXOsAsync } from './utxo-utils';
import { ConclaveAmount, Reward } from '../types/database-types';
import { updateRewardListStatusAsync } from './reward-utils';

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
const blockfrostAPI = new BlockFrostAPI({
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
const privKey = CardanoWasm.PrivateKey.from_normal_bytes(decode);

const shelleyChangeAddress = CardanoWasm.Address.from_bech32('addr_test1vrhcq70gslwqchcerumm0uqu08zy68qg2mdmh95ar5t545c7avx8t');
const shelleyOutputAddress = CardanoWasm.Address.from_bech32('addr_test1qrzx30tju0gvsmcvnn48zc3pe5qc49npydky6qd2huh4640h7m58dq0yf0uule4fq0cun04cxgh9n8nuk6dwdxnahmhs8dxnz8');

const convertRawUTXO = async (): Promise<Array<TxBodyInput>> => {
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let txBodyInputs: Array<TxBodyInput> = [];
    utxos = utxos.filter(utxo => utxo.amount.length == 1 && utxo.amount[0].unit == "lovelace");
    
    utxos.forEach((utxo) => {
        let assetArray: Array<CardanoAssetResponse> = [];
        utxo.amount.forEach(asset => {
            const cardanoAsset: CardanoAssetResponse = {
                unit: asset.unit,
                quantity: asset.quantity,
            };

            assetArray.push(cardanoAsset);
        });
        
        const utxoInput: TxBodyInput = {
            txHash: utxo.tx_hash,
            outputIndex: utxo.output_index,
            asset: assetArray,
        };

        txBodyInputs.push(utxoInput);
    });

    // return txBodyInputs;
    // for (let i = 0; i < 2; i++) {
    //     const cardanoAsset: CardanoAssetResponse = {
    //         unit: "Lovelace",
    //         quantity: "20000000000",
    //     };

    //     const utxoInput: TxBodyInput = {
    //         txHash: '8561258e210352fba2ac0488afed67b3427a27ccf1d41ec030c98a8199bc22ec',
    //         outputIndex: 0,
    //         asset: cardanoAsset,
    //     };

    //     txBodyInputs.push(utxoInput);
    // }
    return txBodyInputs;
};

const convertRawUTXOAsset = async (): Promise<Array<TxBodyInput>> => {
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let txBodyInputs: Array<TxBodyInput> = [];
    utxos = utxos.filter(utxo => utxo.amount.length !== 1 && utxo.amount[1].unit == "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a");
    
    utxos.forEach((utxo) => {
        let assetArray: Array<CardanoAssetResponse> = [];
        utxo.amount.forEach(asset => {
            const cardanoAsset: CardanoAssetResponse = {
                unit: asset.unit,
                quantity: asset.quantity,
            };

            assetArray.push(cardanoAsset);
        });
        
        const utxoInput: TxBodyInput = {
            txHash: utxo.tx_hash,
            outputIndex: utxo.output_index,
            asset: assetArray,
        };

        txBodyInputs.push(utxoInput);
    });

    // return txBodyInputs;
    // for (let i = 0; i < 2; i++) {
    //     const cardanoAsset: CardanoAssetResponse = {
    //         unit: "Lovelace",
    //         quantity: "20000000000",
    //     };

    //     const utxoInput: TxBodyInput = {
    //         txHash: '8561258e210352fba2ac0488afed67b3427a27ccf1d41ec030c98a8199bc22ec',
    //         outputIndex: 0,
    //         asset: cardanoAsset,
    //     };

    //     txBodyInputs.push(utxoInput);
    // }
    return txBodyInputs;
};

const getAllRewardTxOutput = (): Array<Reward> => {
    let txBodyOutputs: Array<Reward> = [];

    //ADA Transaction
    for (let i = 0; i < 300; i++) {
        const txBodyOutput: Reward = {
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardAmount: 2000000, //20 ADA
            rewardType: 2,
            id: "sampleId",
            stakeAddress: ""
        };

        txBodyOutputs.push(txBodyOutput);
    }

    for (let i = 0; i < 100; i++) {
        const txBodyOutput: Reward = {
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardAmount: 4000000, //20 ADA
            rewardType: 2,
            id: "sampleId",
            stakeAddress: ""
        };

        txBodyOutputs.push(txBodyOutput);
    }

    // for (let i = 0; i < 10; i++) {
    //     const txBodyOutput: Reward = {
    //         walletAddress: shelleyOutputAddress.to_bech32(),
    //         rewardAmount: 2000000, //20 ADA
    //         rewardType: 2,
    //         id: "sampleId"
    //     };

    //     txBodyOutputs.push(txBodyOutput);
    // }

    // const txBodyOutput1: Reward = {
    //     walletAddress: shelleyOutputAddress.to_bech32(),
    //     rewardAmount: 200000, //2 ADA
    //     rewardType: 2,
    //     id: "sampleId"
    // };

    // txBodyOutputs.push(txBodyOutput1);
    

    // for (let i = 0; i < 1000; i++) {
    //     const txBodyOutput: Reward = {
    //         walletAddress: shelleyOutputAddress.to_bech32(),
    //         rewardAmount: 500000000000,
    //         rewardType: 2,
    //         id: "sampleId"
    //     };

    //     txBodyOutputs.push(txBodyOutput);
    // }

    // for (let i = 0; i < 1000; i++) {
    //     const asset1: CardanoAssetResponse = {
    //         unit: "Lovelace",
    //         quantity: "5000000"
    //     }

    //     const txBodyOutput1: TxBodyOutput = {
    //         account: "addr_test1qrzx30tju0gvsmcvnn48zc3pe5qc49npydky6qd2huh4640h7m58dq0yf0uule4fq0cun04cxgh9n8nuk6dwdxnahmhs8dxnz8",
    //         asset: asset1
    //     };
    //     txBodyOutputs.push(txBodyOutput1);
    // }

    // for (let i = 0; i < 10; i++) {
    //     const asset2: CardanoAssetResponse = {
    //         unit: "Lovelace",
    //         quantity: "5000000000"
    //     }

    //     const txBodyOutput2: TxBodyOutput = {
    //         account: "addr_test1qrzx30tju0gvsmcvnn48zc3pe5qc49npydky6qd2huh4640h7m58dq0yf0uule4fq0cun04cxgh9n8nuk6dwdxnahmhs8dxnz8",
    //         asset: asset2
    //     };
    //     txBodyOutputs.push(txBodyOutput2);
    // }

    return txBodyOutputs;
};

const getAllConclaveAmountOutput = (): Array<ConclaveAmount> => {
    let txBodyOutputs: Array<ConclaveAmount> = [];

    //ADA Transaction
    for (let i = 0; i < 2; i++) {
        const txBodyOutput: ConclaveAmount = {
            walletAddress: shelleyOutputAddress.to_bech32(),
            collateralAmount: 2000000,
            conclaveAmount: 2, //2 Tokens
            id: "sampleId"
        };

        txBodyOutputs.push(txBodyOutput);
    }

    // for (let i = 0; i < 10; i++) {
    //     const txBodyOutput: Reward = {
    //         walletAddress: shelleyOutputAddress.to_bech32(),
    //         rewardAmount: 2000000, //20 ADA
    //         rewardType: 2,
    //         id: "sampleId"
    //     };

    //     txBodyOutputs.push(txBodyOutput);
    // }

    // const txBodyOutput1: Reward = {
    //     walletAddress: shelleyOutputAddress.to_bech32(),
    //     rewardAmount: 200000, //2 ADA
    //     rewardType: 2,
    //     id: "sampleId"
    // };

    // txBodyOutputs.push(txBodyOutput1);
    

    // for (let i = 0; i < 1000; i++) {
    //     const txBodyOutput: Reward = {
    //         walletAddress: shelleyOutputAddress.to_bech32(),
    //         rewardAmount: 500000000000,
    //         rewardType: 2,
    //         id: "sampleId"
    //     };

    //     txBodyOutputs.push(txBodyOutput);
    // }

    // for (let i = 0; i < 1000; i++) {
    //     const asset1: CardanoAssetResponse = {
    //         unit: "Lovelace",
    //         quantity: "5000000"
    //     }

    //     const txBodyOutput1: TxBodyOutput = {
    //         account: "addr_test1qrzx30tju0gvsmcvnn48zc3pe5qc49npydky6qd2huh4640h7m58dq0yf0uule4fq0cun04cxgh9n8nuk6dwdxnahmhs8dxnz8",
    //         asset: asset1
    //     };
    //     txBodyOutputs.push(txBodyOutput1);
    // }

    // for (let i = 0; i < 10; i++) {
    //     const asset2: CardanoAssetResponse = {
    //         unit: "Lovelace",
    //         quantity: "5000000000"
    //     }

    //     const txBodyOutput2: TxBodyOutput = {
    //         account: "addr_test1qrzx30tju0gvsmcvnn48zc3pe5qc49npydky6qd2huh4640h7m58dq0yf0uule4fq0cun04cxgh9n8nuk6dwdxnahmhs8dxnz8",
    //         asset: asset2
    //     };
    //     txBodyOutputs.push(txBodyOutput2);
    // }

    return txBodyOutputs;
};

const rewardCoinSelection = async (
    txBodyInputs: Array<TxBodyInput>,
    txBodyOutputs: Array<Reward>
    ): Promise<Array<RewardTxBodyDetails> | null> => {
    let _txBodyInputs = txBodyInputs.sort((m, n) => parseInt(n.asset.find(f => f.unit == "lovelace")!.quantity) - parseInt(m.asset.find(f => f.unit == "lovelace")!.quantity));
    let _txBodyOutputs = txBodyOutputs.sort((m, n) => m.rewardAmount - n.rewardAmount);
    
    let maxUTXO = 249;
    let txBodyDetailsArray: Array<RewardTxBodyDetails> = [];
    let currentUTXOsBatch: Array<TxBodyInput> = _txBodyInputs.splice(0, maxUTXO - 1);
    let currentOutputsBatch: Array<Reward> = _txBodyOutputs.splice(0, maxUTXO - 1);

    let partialUTXOSum = getInputAssetUTXOSum(currentUTXOsBatch);
    let partialOutputsSum = getOutputAmountSum(currentOutputsBatch);

    while (currentOutputsBatch.length > 0 && currentUTXOsBatch.length > 0) {
        while (currentUTXOsBatch.length + currentOutputsBatch.length > maxUTXO) {
            if (partialOutputsSum > partialUTXOSum) {
                if (currentOutputsBatch.length > 0) _txBodyOutputs.unshift(currentOutputsBatch.pop()!);
            } else {
                if (currentUTXOsBatch.length > 0) _txBodyInputs.unshift(currentUTXOsBatch.pop()!);
            }
            partialOutputsSum = getOutputAmountSum(currentOutputsBatch);
            partialUTXOSum = getInputAssetUTXOSum(currentUTXOsBatch);
        }
        
        while (partialUTXOSum < partialOutputsSum) {
            if (currentOutputsBatch.length > 0) _txBodyOutputs.unshift(currentOutputsBatch.pop()!);
            partialOutputsSum = getOutputAmountSum(currentOutputsBatch);
        }
        if (partialOutputsSum == 0) break;

        while (partialUTXOSum >= partialOutputsSum) {
            if (currentUTXOsBatch.length > 0) _txBodyInputs.unshift(currentUTXOsBatch.pop()!);
            partialUTXOSum = getInputAssetUTXOSum(currentUTXOsBatch);
        }
        if (_txBodyInputs.length > 0) currentUTXOsBatch.push(_txBodyInputs.shift()!);
        partialUTXOSum = getInputAssetUTXOSum(currentUTXOsBatch);

        if (partialOutputsSum > 0 && (partialUTXOSum >= partialOutputsSum)) {
            const newTxBodyDetails: RewardTxBodyDetails = {
                txInputs: currentUTXOsBatch,
                txOutputs: currentOutputsBatch,
                fee: '0',
                txOutputSum: partialOutputsSum,
            };

            let fees = await calculateRewardFeesAsync(newTxBodyDetails);
            if (fees == null) {
                currentUTXOsBatch = _txBodyInputs.splice(0, maxUTXO-1);
                currentOutputsBatch = _txBodyOutputs.splice(0, maxUTXO-1);
                continue
            };

            newTxBodyDetails.fee = fees;

            if (
                newTxBodyDetails != null && 
                newTxBodyDetails !== undefined) {
                txBodyDetailsArray.push(newTxBodyDetails);
            }

            currentUTXOsBatch = _txBodyInputs.splice(0, 248);
            currentOutputsBatch = _txBodyOutputs.splice(0, 248);
        } else break;
    }

    txBodyDetailsArray = deductRewardFees(txBodyDetailsArray);

    return txBodyDetailsArray;
};

const conclaveCoinSelection = async (
    conclaveUTXOInputs: Array<TxBodyInput>,
    conclaveBodyOutputs: Array<ConclaveAmount>,
    rawAdaUTXOBodyInputs: Array<TxBodyInput>
    ) => {
    let _collateralTxBodyInputs = rawAdaUTXOBodyInputs.sort((m, n) => parseInt(m.asset.find(f => f.unit == "lovelace")!.quantity) - parseInt(n.asset.find(f => f.unit == "lovelace")!.quantity));
    let _conclaveTxBodyOutputs = conclaveBodyOutputs.sort((m, n) => m.conclaveAmount - n.conclaveAmount);
    let _conclaveTxBodyInputs = conclaveUTXOInputs.sort((m, n) => parseInt(n.asset.find(f => f.unit == "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a")!.quantity) - parseInt(m.asset.find(f => f.unit == "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a")!.quantity));
    
    let maxUTXO = 141;
    let conclaveTxBodyDetailsArray: Array<ConclaveTxBodyDetails> = [];
    let currentConclaveInputsBatch: Array<TxBodyInput> = _conclaveTxBodyInputs.splice(0, maxUTXO - 1); //2
    let currentConclaveOutputsBatch: Array<ConclaveAmount> = _conclaveTxBodyOutputs.splice(0, maxUTXO - 1); //3
    
    let partialConclaveInputSum = getInputAssetUTXOSum(currentConclaveInputsBatch, "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a");
    let partialLovelaceInputSum = getInputAssetUTXOSum(currentConclaveInputsBatch); 

    let partialConclaveOutputsSum = getConclaveOutputAmountSum(currentConclaveOutputsBatch);
    let partialLovelaceOutputsSum = getLovelaceOutputAmountSum(currentConclaveOutputsBatch);

    while (currentConclaveInputsBatch.length > 0 && currentConclaveOutputsBatch.length > 0)
    {
        //get 249
        while (currentConclaveInputsBatch.length + currentConclaveOutputsBatch.length > maxUTXO) 
        {
            if (partialConclaveInputSum >= partialConclaveOutputsSum) {
                if (currentConclaveInputsBatch.length > 0) _conclaveTxBodyInputs.unshift(currentConclaveInputsBatch.pop()!);
                partialConclaveInputSum = getInputAssetUTXOSum(currentConclaveInputsBatch, "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a"); //2CONCLAVE
                partialLovelaceInputSum = getInputAssetUTXOSum(currentConclaveInputsBatch);
            } else if (partialConclaveOutputsSum > partialConclaveInputSum)
            {
                if (currentConclaveOutputsBatch.length > 0) _conclaveTxBodyOutputs.unshift(currentConclaveOutputsBatch.pop()!);
                partialConclaveOutputsSum = getConclaveOutputAmountSum(currentConclaveOutputsBatch);
                partialLovelaceOutputsSum = getLovelaceOutputAmountSum(currentConclaveOutputsBatch);
            }
        }
        if (partialConclaveOutputsSum == 0) break;

        //get maximum number of collateral inputs possible
        let currentCollateralBatch: Array<TxBodyInput> = _collateralTxBodyInputs.splice(0, maxUTXO - (currentConclaveInputsBatch.length + currentConclaveOutputsBatch.length));
        let partialCollateralLovelaceSum = getInputAssetUTXOSum(currentCollateralBatch); //1ADA

        //deduct Conclave Outputs until less than maximum Collateral AND ConclaveAmount
        while ((partialConclaveOutputsSum > partialConclaveInputSum) || (partialLovelaceOutputsSum > partialCollateralLovelaceSum + partialLovelaceInputSum)) 
        {
            if (currentConclaveOutputsBatch.length > 0) 
            {
                _conclaveTxBodyOutputs.unshift(currentConclaveOutputsBatch.pop()!);
                //update Output Sums
                partialConclaveOutputsSum = getConclaveOutputAmountSum(currentConclaveOutputsBatch);
                partialLovelaceOutputsSum = getLovelaceOutputAmountSum(currentConclaveOutputsBatch);
                //update collateral details
                if (_collateralTxBodyInputs.length > 0) currentCollateralBatch.push(_collateralTxBodyInputs.shift()!);
                partialCollateralLovelaceSum = getInputAssetUTXOSum(currentCollateralBatch);
            }
        }
        if (partialConclaveOutputsSum == 0) break;

        //get minimum number of Conclave UTXOs to be used
        while ((partialConclaveInputSum >= partialConclaveOutputsSum) && (partialCollateralLovelaceSum + partialLovelaceInputSum >= partialLovelaceOutputsSum))
        {
            if (currentConclaveInputsBatch.length > 0) 
            {
                _conclaveTxBodyInputs.unshift(currentConclaveInputsBatch.pop()!);
                //update Input Sums
                partialConclaveInputSum = getInputAssetUTXOSum(currentConclaveInputsBatch, "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a"); //2CONCLAVE
                partialLovelaceInputSum = getInputAssetUTXOSum(currentConclaveInputsBatch);
                //update collateral details
                if (_collateralTxBodyInputs.length > 0) currentCollateralBatch.push(_collateralTxBodyInputs.shift()!);
                partialCollateralLovelaceSum = getInputAssetUTXOSum(currentCollateralBatch);
            }
        }
        if (_conclaveTxBodyInputs.length > 0) currentConclaveInputsBatch.push(_conclaveTxBodyInputs.shift()!);
        partialConclaveInputSum = getInputAssetUTXOSum(currentConclaveInputsBatch, "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a"); //2CONCLAVE
        partialLovelaceInputSum = getInputAssetUTXOSum(currentConclaveInputsBatch);

        if (currentCollateralBatch.length > 0) _collateralTxBodyInputs.unshift(currentCollateralBatch.pop()!);
        partialCollateralLovelaceSum = getInputAssetUTXOSum(currentCollateralBatch);

        //add Collateral until greater than LoveLace outputs
        while (partialLovelaceInputSum < partialLovelaceOutputsSum)
        {
            if (currentCollateralBatch.length > 0) 
            {
                currentConclaveInputsBatch.push(currentCollateralBatch.shift()!);
                partialLovelaceInputSum = getInputAssetUTXOSum(currentConclaveInputsBatch);
            } else break;
        }

        if (
            partialConclaveOutputsSum > 0 && 
            (partialConclaveInputSum >= partialConclaveOutputsSum) && 
            (partialLovelaceInputSum >= partialLovelaceOutputsSum)) {
            const newTxBodyDetails: ConclaveTxBodyDetails = {
                txInputs: currentConclaveInputsBatch,
                txOutputs: currentConclaveOutputsBatch,
                fee: '0',
                collateralOutputSum: partialLovelaceOutputsSum,
                conclaveOutputSum: partialConclaveOutputsSum,
            };

            let fees = await calculateConclaveFeesAsync(newTxBodyDetails);
            if (fees == null) {
                currentConclaveInputsBatch = _conclaveTxBodyInputs.splice(0, maxUTXO-1);
                currentConclaveOutputsBatch = _conclaveTxBodyOutputs.splice(0, maxUTXO-1);
                currentCollateralBatch = [];
                continue
            };

            newTxBodyDetails.fee = fees;
            if (
                newTxBodyDetails != null && 
                newTxBodyDetails !== undefined) {
                conclaveTxBodyDetailsArray.push(newTxBodyDetails);
            }

            currentConclaveInputsBatch = _conclaveTxBodyInputs.splice(0, maxUTXO-1);
            currentConclaveOutputsBatch = _conclaveTxBodyOutputs.splice(0, maxUTXO-1);
            currentCollateralBatch = [];
        } else break;
    }

    conclaveTxBodyDetailsArray = deductConclaveFees(conclaveTxBodyDetailsArray);

    return conclaveTxBodyDetailsArray;
};

const calculateRewardFeesAsync = async (newTxBodyDetails: RewardTxBodyDetails): Promise<string | null> => {
    let _txOutputs: Array<Reward> = [];

    const _newTxBodyDetails: RewardTxBodyDetails = {
        txInputs: newTxBodyDetails.txInputs,
        txOutputs: [],
        fee: '0',
        txOutputSum: newTxBodyDetails.txOutputSum,
    };

    newTxBodyDetails.txOutputs.forEach((e) => {
        let _reward: Reward = {
            id: e.id,
            rewardAmount: 1000000,
            rewardType: e.rewardType,
            walletAddress: e.walletAddress,
            stakeAddress: ""
        }

        _txOutputs.push(_reward);
    });

    _newTxBodyDetails.txOutputs = _txOutputs;

    let _result = await createRewardTxBodyAsync(_newTxBodyDetails);
    if (_result == null) return null;

    return _result.txBody.fee().to_str();
};

const calculateConclaveFeesAsync = async (newTxBodyDetails: ConclaveTxBodyDetails): Promise<string | null> => {
    let _txOutputs: Array<ConclaveAmount> = [];

    const _newTxBodyDetails: ConclaveTxBodyDetails = {
        txInputs: newTxBodyDetails.txInputs,
        txOutputs: [],
        fee: '0',
        collateralOutputSum: newTxBodyDetails.collateralOutputSum,
        conclaveOutputSum: newTxBodyDetails.conclaveOutputSum,
    };

    newTxBodyDetails.txOutputs.forEach((e) => {
        let _conclaveAmount: ConclaveAmount = {
            id: e.id,
            collateralAmount: 2000000,
            conclaveAmount: e.conclaveAmount,
            walletAddress: e.walletAddress
        }

        _txOutputs.push(_conclaveAmount);
    });
    _newTxBodyDetails.txOutputs = _txOutputs;

    let _result = await createConclaveTxBodyAsync(_newTxBodyDetails);
    if (_result == null) return null;

    return _result.txBody.fee().to_str();
};

const deductRewardFees = (txBodyDetailsArray: Array<RewardTxBodyDetails>): Array<RewardTxBodyDetails> => {
    txBodyDetailsArray.forEach((element) => {
        let newFee = parseInt(element.fee) + 200;
        element.txOutputs.forEach((e) => {
            e.rewardAmount = parseInt((e.rewardAmount - (newFee / element.txOutputSum) * e.rewardAmount).toFixed());
        });
    });

    return txBodyDetailsArray;
};

const deductConclaveFees = (txBodyDetailsArray: Array<ConclaveTxBodyDetails>): Array<ConclaveTxBodyDetails> => {
    txBodyDetailsArray.forEach((element) => {
        let newFee = parseInt(element.fee) + 200;
        element.txOutputs.forEach((e) => {
            e.collateralAmount = parseInt((e.collateralAmount - (newFee / element.collateralOutputSum) * e.collateralAmount).toFixed());
        });
    });

    return txBodyDetailsArray;
};

const setTTLAsync = async (): Promise<number> => {
    const latestBlock = await blockfrostAPI.blocksLatest();
    const currentSlot = latestBlock.slot;

    return currentSlot! + 7200;
};

const createRewardTxBodyAsync = async (
    txBodyDetails: RewardTxBodyDetails
): Promise<{ txHash: CardanoWasm.TransactionHash; txBody: CardanoWasm.TransactionBody } | null> => {
    try {
        let txBuilder = await setRewardTxBodyDetailsAsync(txBodyDetails);
        let ttl = await setTTLAsync();

        txBuilder.set_ttl(ttl);
        txBuilder.add_change_if_needed(shelleyChangeAddress);

        const txBody = txBuilder.build();
        const txHash = CardanoWasm.hash_transaction(txBody);

        return { txHash, txBody };
    } catch (error) {
        console.log('Error Creating Tx Body ' + error);
        return null;
    }
};

const createConclaveTxBodyAsync = async (
    txBodyDetails: ConclaveTxBodyDetails
): Promise<{ txHash: CardanoWasm.TransactionHash; txBody: CardanoWasm.TransactionBody } | null> => {
    try {
        let txBuilder = await setConclaveTxBodyDetailsAsync(txBodyDetails);
        let ttl = await setTTLAsync();

        txBuilder.set_ttl(ttl);
        txBuilder.add_change_if_needed(shelleyChangeAddress);

        const txBody = txBuilder.build();
        const txHash = CardanoWasm.hash_transaction(txBody);

        return { txHash, txBody };
    } catch (error) {
        console.log('Error Creating Tx Body ' + error);
        return null;
    }
};

const setRewardTxBodyDetailsAsync = async (txBodyDetails: RewardTxBodyDetails): Promise<CardanoWasm.TransactionBuilder> => {
    let protocolParameter = await getLatestProtocolParametersAsync(blockfrostAPI);
    let txBuilder = getTransactionBuilder(protocolParameter);

    txBodyDetails.txInputs.forEach((txInput: TxBodyInput) => {
        txBuilder.add_key_input(
            privKey.to_public().hash(),
            CardanoWasm.TransactionInput.new(
                CardanoWasm.TransactionHash.from_bytes(Buffer.from(txInput.txHash, 'hex')), // tx hash
                txInput.outputIndex // index
            ),
            CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(txInput.asset.find(f => f.unit == "lovelace")!.quantity))
        );
    });

    txBodyDetails.txOutputs.forEach((txOutput: Reward) => {
        txBuilder.add_output(
            CardanoWasm.TransactionOutput.new(
                CardanoWasm.Address.from_bech32(txOutput.walletAddress),
                CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(txOutput.rewardAmount.toString()))
            )
        );
    });

    return txBuilder;
};

const setConclaveTxBodyDetailsAsync = async (txBodyDetails: ConclaveTxBodyDetails): Promise<CardanoWasm.TransactionBuilder> => {
    let protocolParameter = await getLatestProtocolParametersAsync(blockfrostAPI);
    let txBuilder = getTransactionBuilder(protocolParameter);

    //edit below
    txBodyDetails.txInputs.forEach((txInput: TxBodyInput) => {
        const inputValue = CardanoWasm.Value.new(
            CardanoWasm.BigNum.from_str(txInput.asset.find(e => e.unit == "lovelace")!.quantity)
        );

        if (txInput.asset.find(e => e.unit == "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a"))
        {
            let multiAssetInput = CardanoWasm.MultiAsset.new();
            let assetsInput = CardanoWasm.Assets.new();

            assetsInput.insert(
                CardanoWasm.AssetName.new(Buffer.from(assetName, 'hex')),
                CardanoWasm.BigNum.from_str(txInput.asset.find(e => e.unit == "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a")!.quantity)
            );
            multiAssetInput.insert(
                CardanoWasm.ScriptHash.from_bytes(Buffer.from(policyId, 'hex')),
                assetsInput
            );

            inputValue.set_multiasset(multiAssetInput);
        }

        txBuilder.add_key_input(
            privKey.to_public().hash(),
            CardanoWasm.TransactionInput.new(
                CardanoWasm.TransactionHash.from_bytes(Buffer.from(txInput.txHash, 'hex')), // tx hash
                txInput.outputIndex // index
            ),
            inputValue
        );
    });

    txBodyDetails.txOutputs.forEach((txOutput: ConclaveAmount) => {
        const outputValue = CardanoWasm.Value.new(
            CardanoWasm.BigNum.from_str(txOutput.collateralAmount.toString())
        );
        let multiAssetOutput = CardanoWasm.MultiAsset.new();
        let assetsOutput = CardanoWasm.Assets.new();

        assetsOutput.insert(
            CardanoWasm.AssetName.new(Buffer.from(assetName, 'hex')),
            CardanoWasm.BigNum.from_str(txOutput.conclaveAmount.toString())
        );
        multiAssetOutput.insert(
            CardanoWasm.ScriptHash.from_bytes(Buffer.from(policyId, 'hex')),
            assetsOutput
        );
        
        outputValue.set_multiasset(multiAssetOutput);
        
        txBuilder.add_output(
            CardanoWasm.TransactionOutput.new(
                CardanoWasm.Address.from_bech32(txOutput.walletAddress),
                outputValue
            )
        );
    });

    return txBuilder;
};

const signTxBody = (
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

const finalizeTxBody = (
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

const submitRewardTransactionAsync = async (
    transaction: CardanoWasm.Transaction,
    txHash: CardanoWasm.TransactionHash,
    txItem: RewardTxBodyDetails): Promise<RewardTxBodyDetails | null> => {

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

const submitConclaveTransactionAsync = async (
    transaction: CardanoWasm.Transaction,
    txHash: CardanoWasm.TransactionHash,
    txItem: ConclaveTxBodyDetails): Promise<ConclaveTxBodyDetails | null> => {

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

const getOutputAmountSum = (currentOutputBatch: Array<Reward>): number => {
    if (currentOutputBatch === null || currentOutputBatch === undefined) return 0;

    let _partialSum = 0;

    currentOutputBatch.forEach((reward) => {
        _partialSum += reward.rewardAmount;
    });

    return _partialSum;
};

const getConclaveOutputAmountSum = (currentConclaveOutputBatch: Array<ConclaveAmount>): number => {
    if (currentConclaveOutputBatch === null || currentConclaveOutputBatch === undefined) return 0;

    let _partialSum = 0;

    currentConclaveOutputBatch.forEach((conclaveAmount) => {
        _partialSum += conclaveAmount.conclaveAmount;
    });

    return _partialSum;
};

const getCollateralOutputAmountSum = (currentConclaveOutputBatch: Array<ConclaveAmount>): number => {
    if (currentConclaveOutputBatch === null || currentConclaveOutputBatch === undefined || currentConclaveOutputBatch.length === 0) return 0;

    let _partialSum = 0;

    currentConclaveOutputBatch.forEach((collateral) => {
        _partialSum += collateral.collateralAmount;
    });

    return _partialSum;
};

const getLovelaceOutputAmountSum = (currentConclaveOutputBatch: Array<ConclaveAmount>): number => {
    if (currentConclaveOutputBatch === null || currentConclaveOutputBatch === undefined || currentConclaveOutputBatch.length === 0) return 0;
    
    let _partialSum = 0;

    currentConclaveOutputBatch.forEach((conclaveOutput) => {
        _partialSum += conclaveOutput.collateralAmount;
    });

    return _partialSum;
};

const getInputAssetUTXOSum = (currentUTXOs: Array<TxBodyInput>, unit: string = "lovelace"): number => {
    if (currentUTXOs === null || currentUTXOs === undefined || currentUTXOs.length === 0) return 0;
    let _partialSum = 0;

    currentUTXOs.forEach((utxo) => {
        if (
            utxo.asset.find(f => f.unit == unit) !== undefined &&
            utxo.asset.find(f => f.unit == unit)?.quantity !== undefined &&
            utxo.asset.find(f => f.unit == unit)?.quantity !== null) {
            _partialSum += parseInt(utxo.asset.find(f => f.unit == unit)!.quantity);
        }
    });

    return _partialSum;
};

const awaitChangeInUTXOAsync = async (txInputs: Array<TxBodyInput>) => {
    let txHashArray: Array<string> = [];

    txInputs.forEach((element) => {
        txHashArray.push(element.txHash);
    });

    var CheckUTX0 = setInterval(async () => {
        console.log('Waiting for utxos to update after Submissions ');
        let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
        let commonHash = utxos.filter((v) => txHashArray.includes(v.tx_hash));

        if (commonHash.length === 0 || commonHash === null || commonHash === undefined) clearInterval(CheckUTX0);
    }, 10000);
};

const getLargeUTXOs = (utxos: UTXO): {
    txInputs: Array<TxBodyInput>;
    txOutputs: Array<Reward>
} | null => {
    let txBodyInputs: Array<TxBodyInput> = [];
    let txBodyOutputs: Array<Reward> = [];
    let divider = 0;
    let remainder = 0;

    utxos.forEach((utxo) => {
        if (parseInt(utxo.amount.find(f => f.unit == "lovelace")!.quantity) > 1200000000) {
            let assetArray: Array<CardanoAssetResponse> = [];
            utxo.amount.forEach(asset => {
                const cardanoAsset: CardanoAssetResponse = {
                    unit: asset.unit,
                    quantity: asset.quantity,
                };

                assetArray.push(cardanoAsset);
            });
            
            const utxoInput: TxBodyInput = {
                txHash: utxo.tx_hash,
                outputIndex: utxo.output_index,
                asset: assetArray,
            };

            txBodyInputs.push(utxoInput);
        }
    });

    txBodyInputs = txBodyInputs.splice(0, 248);
    let utxoSum = getInputAssetUTXOSum(txBodyInputs);
    if (utxoSum == 0) return null;

    divider = parseInt((utxoSum / 2).toFixed());
    remainder = parseInt((utxoSum % 2).toFixed());

    for (let i = 0; i < 2; i++) {
        const reward: Reward = {
            id: "string",
            rewardType: 1,
            rewardAmount: divider,
            walletAddress: shelleyChangeAddress.to_bech32.toString(),
            stakeAddress: ""
        };

        txBodyOutputs.push(reward);
    }

    const reward: Reward = {
        id: "string",
        rewardType: 1,
        rewardAmount: remainder,
        walletAddress: shelleyChangeAddress.to_bech32.toString(),
        stakeAddress: ""
    };

    txBodyOutputs.push(reward);

    return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
};

const getSmallUTXOs = (utxos: UTXO): {
    txInputs: Array<TxBodyInput>;
    txOutputs: Array<Reward>;
    } | null => {
    let txBodyInputs: Array<TxBodyInput> = [];
    let txBodyOutputs: Array<Reward> = [];

    utxos.forEach((utxo) => {
        if (parseInt(utxo.amount.find(f => f.unit == "lovelace")!.quantity) < 300000000) {
            let assetArray: Array<CardanoAssetResponse> = [];
        utxo.amount.forEach(asset => {
            const cardanoAsset: CardanoAssetResponse = {
                unit: asset.unit,
                quantity: asset.quantity,
            };

            assetArray.push(cardanoAsset);
        });
        
        const utxoInput: TxBodyInput = {
            txHash: utxo.tx_hash,
            outputIndex: utxo.output_index,
            asset: assetArray,
        };
        txBodyInputs.push(utxoInput);
        }
    });

    txBodyInputs = txBodyInputs.splice(0, 248);

    let utxoSum = getInputAssetUTXOSum(txBodyInputs);
    if (utxoSum === 0) return null;

    const reward: Reward = {
        id: "string",
        rewardType: 1,
        rewardAmount: utxoSum,
        walletAddress: shelleyChangeAddress.to_bech32.toString(),
        stakeAddress: ""
    };

    txBodyOutputs.push(reward);

    return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
};

export const divideLargeUTXOsAsync = async () => {
    console.log('Dividing UTXOs');
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let txInputsSent: Array<TxBodyInput> = [];

    let rewards = getLargeUTXOs(utxos);
    if (rewards?.txInputs === null || rewards?.txOutputs === null || rewards === null) return;

    let txinputoutputs = await rewardCoinSelection(rewards.txInputs, rewards.txOutputs);
    if (txinputoutputs == null || txinputoutputs.length == 0 || txinputoutputs === undefined) return;

    if (rewards === null) return;

    for (let txItem of txinputoutputs) {
        let transaction = await createAndSignTxAsync(txItem);
        if (transaction == null) return;

        console.log('Dividing Large UTXOs');
        console.log(
            'Transaction ' + transaction.txHash.to_bech32('tx_test').toString() + ' fee ' + transaction.transaction.body().fee().to_str()
        );

        //Submit Transaction
        // let txResult = await submitTransactionAsync(transaction.transaction, transaction.txHash, txItem);
        // if (txResult !== null) {
        //     txInputsSent = txInputsSent.concat(txInputsSent, txResult.txInputs);
        //     txOutputSent = txOutputSent.concat(txOutputSent, txResult.txOutputs);
        //     console.log("Update Status to Completed");
        // }

        console.log(' ');
    }
    await awaitChangeInUTXOAsync(txInputsSent);
};

export const combineSmallUTXOsAsync = async () => {
    console.log('Combining UTXOs');
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let txInputsSent: Array<TxBodyInput> = [];

    let rewards = getSmallUTXOs(utxos);
    if (rewards?.txInputs === null || rewards?.txOutputs === null || rewards === null) return;

    let txinputoutputs = await rewardCoinSelection(rewards.txInputs, rewards.txOutputs);
    if (txinputoutputs == null || txinputoutputs.length == 0 || txinputoutputs === undefined) return;

    if (rewards === null) return;
    
    for (let txItem of txinputoutputs) {
        let transaction = await createAndSignTxAsync(txItem);
        if (transaction == null) return;

        console.log('Combining Small UTXOs');
        console.log(
            'Transaction ' + transaction.txHash.to_bech32('tx_test').toString() + ' fee ' + transaction.transaction.body().fee().to_str()
        );

        //Submit Transaction
        // let txResult = await submitTransactionAsync(transaction.transaction, transaction.txHash, txItem);
        // if (txResult !== null) {
        //     txInputsSent = txInputsSent.concat(txInputsSent, txResult.txInputs);
        //     txOutputSent = txOutputSent.concat(txOutputSent, txResult.txOutputs);
        // }

        console.log(' ');
    }
    await awaitChangeInUTXOAsync(txInputsSent);
};

const createAndSignTxAsync = async (
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

const createAndSignTxConclaveAsync = async (
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

let dummyRewards = getAllRewardTxOutput();
let dummyConclave = getAllConclaveAmountOutput();

export const sendRewardTransactionAsync = async (rewards: Array<Reward> = dummyRewards) => {
    let utxosInWallet = await convertRawUTXO();

    if (rewards.length == 0 || utxosInWallet.length == 0) {
        console.log('no transaction');
        return;
    }

    let txinputoutputs = await rewardCoinSelection(utxosInWallet, rewards);

    if (txinputoutputs == null || txinputoutputs.length == 0) {
        console.log('no transaction');
        return;
    }

    txinputoutputs?.forEach((element, index) => {
        console.log(' ');
        console.log('Transaction ' + index);
        element.txInputs.forEach((e) => {
            console.log('Txinput ' + e.txHash + ' ' + e.asset.find(f => f.unit == "lovelace")!.quantity + " " + e.asset.find(f => f.unit == "lovelace")!.unit);
        });

        console.log('Txinput sum ' + getInputAssetUTXOSum(element.txInputs));
        console.log('Txoutput sum ' + getOutputAmountSum(element.txOutputs));
        console.log('TxOutput count: ' + element.txOutputs.length);
    });

    console.log(' ');

    for (let txItem of txinputoutputs) {
        let transaction = await createAndSignTxAsync(txItem);
        if (transaction == null) continue; 
        
        // await updateRewardListStatusAsync(txItem.txOutputs,2,transaction.txHash.to_bech32("_"));

        console.log('Transaction ' + transaction.txHash.to_bech32('tx_test').toString() + ' fee ' + transaction.transaction.body().fee().to_str());

        // Submit Transaction
        // let txResult = await submitRewardTransactionAsync(transaction.transaction, transaction.txHash, txItem);
        // if (txResult == null) {
        //     console.log("Updating Status to Failed");
        //     // await updateRewardListStatusAsync(txItem.txOutputs,3,transaction.txHash.to_bech32("_"));
        // }
        // console.log(' ');
    }
};


let policyId = "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca18"
let assetName = "53616d706c65546f6b656e4a0a"

export const sendTokenTransactionAsync = async (conclaveOutputs: Array<ConclaveAmount> = dummyConclave) => {
    let conclaveAssets = await convertRawUTXOAsset();
    if (conclaveOutputs.length == 0 || conclaveOutputs == null) {
        console.log('no conclaveAssets');
        return;
    }
    let utxosInWallet = await convertRawUTXO();

    let conclaveCoinIO = await conclaveCoinSelection(conclaveAssets, conclaveOutputs, utxosInWallet);
    if (conclaveCoinIO == null || conclaveCoinIO.length == 0) {
        console.log('no transaction');
        return;
    }

    conclaveCoinIO?.forEach((element, index) => {
        console.log(' ');
        console.log('Transaction ' + index);
        element.txInputs.forEach((e) => {
            console.log('Txinput ' + e.txHash + ' ' + e.asset.find(f => f.unit == "lovelace")!.quantity + " " + e.asset.find(f => f.unit == "lovelace")!.unit + " " + e.asset.find(f => f.unit == "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a")?.quantity);
        });

        console.log('TxinputCollateral sum ' + getInputAssetUTXOSum(element.txInputs));
        console.log('TxConclave sum ' + getInputAssetUTXOSum(element.txInputs, "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a"))
        console.log('ConclaveOutput sum ' + getConclaveOutputAmountSum(element.txOutputs));
        console.log('CollateralOutput sum ' + getCollateralOutputAmountSum(element.txOutputs));
        console.log('TxOutput count: ' + element.txOutputs.length);
    })

    console.log(' ');

    for (let txItem of conclaveCoinIO) {
        let transaction = await createAndSignTxConclaveAsync(txItem);
        if (transaction == null) continue; 
        
        // await updateRewardListStatusAsync(txItem.txOutputs,2,transaction.txHash.to_bech32("_"));

        console.log('Transaction ' + transaction.txHash.to_bech32('tx_test').toString() + ' fee ' + transaction.transaction.body().fee().to_str());

        //Submit Transaction
        // let txResult = await submitConclaveTransactionAsync(transaction.transaction, transaction.txHash, txItem);
        // if (txResult == null) {
        //     console.log("Updating Status to Failed");
        //     // await updateRewardListStatusAsync(txItem.txOutputs,3,transaction.txHash.to_bech32("_"));
        // }

        // console.log(' ');
    }
}