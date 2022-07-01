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

const getRawUTXOAsset = async (unit: string = "lovelace"): Promise<Array<TxBodyInput>> => {
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let txBodyInputs: Array<TxBodyInput> = [];
    utxos = utxos.filter(utxo => utxo.amount.find(asset => asset.unit == unit));

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
    for (let i = 0; i < 100; i++) {
        const txBodyOutput: Reward = {
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardAmount: 500000000, //20 ADA
            rewardType: 2,
            id: "sampleId"
        };

        txBodyOutputs.push(txBodyOutput);
    }

    for (let i = 0; i < 100; i++) {
        const txBodyOutput: Reward = {
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardAmount: 40000000, //20 ADA
            rewardType: 2,
            id: "sampleId"
        };

        txBodyOutputs.push(txBodyOutput);
    }

    for (let i = 0; i < 500; i++) {
        const txBodyOutput: Reward = {
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardAmount: 2000000, //20 ADA
            rewardType: 2,
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

const getAllConclaveAmountOutput = (): Array<ConclaveAmount> => {
    let txBodyOutputs: Array<ConclaveAmount> = [];

    //ADA Transaction
    for (let i = 0; i < 200; i++) {
        const txBodyOutput: ConclaveAmount = {
            walletAddress: shelleyOutputAddress.to_bech32(),
            collateralAmount: 5000000000, //10 ADA
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

const removeLastItemFromCurrentBatch = (batchArray: Array<any>, reserveArray: Array<any>) => {
    if (batchArray.length > 0) reserveArray.unshift(batchArray.pop()!);
};

const addFirstItemFromReserveBatch = (batchArray: Array<any>, reserveArray: Array<any>) => {
    if (reserveArray.length > 0) batchArray.push(reserveArray.shift()!);
}

const sortRewardAscending = (array: Array<Reward>): Array<Reward> => {
    return array.sort((a, b) => {
        return a.rewardAmount - b.rewardAmount;
    });
}

const sortInputDescending = (array: Array<TxBodyInput>, unit: string = "lovelace"): Array<TxBodyInput> => {
    let _array = array.filter(f => (unit == "lovelace" ? f.asset.length == 1 : f.asset.length != 1) && (f.asset.find(f => f.unit == unit)!.unit == unit))!;
    return _array.sort((a, b) => {
        return parseInt(b.asset.find(f => f.unit == unit)!.quantity) - parseInt(a.asset.find(f => f.unit == unit)!.quantity);
    });
}

const sortInputAscending = (array: Array<TxBodyInput>, unit: string = "lovelace"): Array<TxBodyInput> => {
    let _array = array.filter(f => (unit == "lovelace" ? f.asset.length == 1 : f.asset.length != 1) && (f.asset.find(f => f.unit == unit)!.unit == unit))!;
    return _array.sort((a, b) => {
        return parseInt(a.asset.find(f => f.unit == unit)!.quantity) - parseInt(b.asset.find(f => f.unit == unit)!.quantity);
    });
}

const sortConclaveAmountAscending = (array: Array<ConclaveAmount>): Array<ConclaveAmount> => {
    return array.sort((a, b) => {
        return a.conclaveAmount - b.conclaveAmount;
    });
}

const getArrayBatch = (batchSize: number, array: Array<any>): Array<any> => array.splice(0, batchSize - 1);

const isWithinTxLimit = (array1: Array<any>, array2: Array<any>, maxTxSize: number): boolean => array1.length + array2.length <= maxTxSize;

const isOutputSumLarger = (outputSum: number, inputSum: number): boolean => inputSum < outputSum;

const isZero = (number: number): boolean => {
    if (number <= 0) return true;
    else return false;
}

const isInputSumLarger = (inputSum: number, outputSum: number): boolean => outputSum <= inputSum;

const initRewardTxBodyDetails = (
    inputs: Array<TxBodyInput>,
    outputSum: number,
    fee: string = "0",
    outputs: Array<Reward> = []): RewardTxBodyDetails => {
    const newTxBodyDetails: RewardTxBodyDetails = {
        txInputs: inputs,
        txOutputs: outputs,
        fee: fee,
        txOutputSum: outputSum,
    };

    return newTxBodyDetails;
}

const initReward = (id: string, rewardAmount: number, rewardType: number, walletAddress: string) => {
    let _reward: Reward = {
        id: id,
        rewardAmount: rewardAmount,
        rewardType: rewardType,
        walletAddress: walletAddress
    }
    return _reward;
}

const initConclaveAmount = (
    id: string, 
    conclaveAmount: number, 
    collateralAmount: number,
    walletAddress: string ) => {
    let _conclaveAmount: ConclaveAmount = {
        id: id,
        collateralAmount: collateralAmount,
        conclaveAmount: conclaveAmount,
        walletAddress: walletAddress
    }
    return _conclaveAmount;
}

const initConclaveTxBodyDetails = (
    inputs: Array<TxBodyInput>,
    collateraSum: number,
    conclaveSum: number,
    fee: string = "0",
    outputs: Array<ConclaveAmount> = []): ConclaveTxBodyDetails => {
    const newTxBodyDetails: ConclaveTxBodyDetails = {
        txInputs: inputs,
        txOutputs: outputs,
        fee: fee,
        collateralOutputSum: collateraSum,
        conclaveOutputSum: conclaveSum
    }
    return newTxBodyDetails;
}

const createConclaveTxBodyWithFee = async (
    inputs: Array<TxBodyInput>, 
    outputs: Array<ConclaveAmount>, 
    conclaveSum: number, 
    collateralSum: number) : Promise<ConclaveTxBodyDetails | null> => {
    const newTxBodyDetails: ConclaveTxBodyDetails = initConclaveTxBodyDetails(inputs, collateralSum, conclaveSum, "0", outputs);
    let fees = await calculateConclaveFeesAsync(newTxBodyDetails);

    if (isNull(fees)) {
        return null;
    };
    newTxBodyDetails.fee = fees!;

    return newTxBodyDetails;
};

const createRewardTxBodywithFee = async (
    inputs: Array<TxBodyInput>, 
    outputs: Array<Reward>, 
    outputSum: number): Promise<RewardTxBodyDetails | null> => {
    const newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(inputs, outputSum, "0", outputs);
    let fees = await calculateRewardFeesAsync(newTxBodyDetails);

    if (isNull(fees)) {
        return null
    };
    newTxBodyDetails.fee = fees!;

    return newTxBodyDetails;
};

const isNull = (item: any | null): boolean => {
    if (item === null) return true;
    else return false;
};

const isUndefined = (item: any | undefined): boolean => {
    if (item === undefined) return true;
    else return false;
};

const isEmpty = (batch: Array<any>): boolean => {
    if (batch.length <= 0) return true;
    else return false;
};

const rewardCoinSelection = async (
    txBodyInputs: Array<TxBodyInput>,
    txBodyOutputs: Array<Reward>
    ): Promise<Array<RewardTxBodyDetails> | null> => {
    let reservedBodyInputs = sortInputDescending(txBodyInputs);
    let reservedBodyOutputs = sortRewardAscending(txBodyOutputs);
    let maxtxItems = 249;
    let txBodyDetailsArray: Array<RewardTxBodyDetails> = [];
    
    let currentUTXOsBatch: Array<TxBodyInput> = getArrayBatch(maxtxItems, reservedBodyInputs);
    let currentOutputsBatch: Array<Reward> = getArrayBatch(maxtxItems, reservedBodyOutputs);

    while (!isEmpty(currentOutputsBatch) && !isEmpty(currentUTXOsBatch)) {
        while (!isWithinTxLimit(currentUTXOsBatch, currentOutputsBatch, maxtxItems)) {
            if (isInputSumLarger(lovelaceInputSum(currentUTXOsBatch), lovelaceRewardOutputSum(currentOutputsBatch))) {
                removeLastItemFromCurrentBatch(currentUTXOsBatch, reservedBodyInputs);
                continue;}
            removeLastItemFromCurrentBatch(currentOutputsBatch, reservedBodyOutputs);
        }
        while (isOutputSumLarger(lovelaceRewardOutputSum(currentOutputsBatch), lovelaceInputSum(currentUTXOsBatch))) {
            removeLastItemFromCurrentBatch(currentOutputsBatch, reservedBodyOutputs);
        }
        if (isZero(lovelaceRewardOutputSum(currentOutputsBatch))) break;
        console.log(currentOutputsBatch.length);

        while (isInputSumLarger(lovelaceInputSum(currentUTXOsBatch), lovelaceRewardOutputSum(currentOutputsBatch))) {
            removeLastItemFromCurrentBatch(currentUTXOsBatch, reservedBodyInputs);
        }
        addFirstItemFromReserveBatch(currentUTXOsBatch, reservedBodyInputs);

        if (
            isZero(lovelaceRewardOutputSum(currentOutputsBatch)) || 
            !isInputSumLarger(lovelaceInputSum(currentUTXOsBatch), lovelaceRewardOutputSum(currentOutputsBatch)))
            break;
            
        let newTxBodyDetails = await createRewardTxBodywithFee(currentUTXOsBatch, currentOutputsBatch, lovelaceRewardOutputSum(currentOutputsBatch));
        if (!isNull(newTxBodyDetails) && !isUndefined(newTxBodyDetails)) txBodyDetailsArray.push(newTxBodyDetails!);

        currentUTXOsBatch = getArrayBatch(maxtxItems, reservedBodyInputs);
        currentOutputsBatch = getArrayBatch(maxtxItems, reservedBodyOutputs);
    }

    deductRewardFees(txBodyDetailsArray);
    return txBodyDetailsArray;
};

const maxCollateralPossible = (maxUTXO: number, inputBatch: Array<any>, outputBatch: Array<any>): number => {
    return maxUTXO - (inputBatch.length + outputBatch.length);
}

const conclaveInputSum = (inputs: Array<TxBodyInput>): number => {
    return getInputAssetUTXOSum(inputs, policyStr);
};

const lovelaceInputSum = (inputs: Array<TxBodyInput>): number => {
    return getInputAssetUTXOSum(inputs);
};

const lovelaceRewardOutputSum = (inputs: Array<Reward>): number => {
    return getOutputAmountSum(inputs);
};

const lovelaceCollateralOutputSum = (outputs: Array<ConclaveAmount>): number => {
    return getCollateralOutputAmountSum(outputs);
}

const reserveLovelaceSum = (reservedInputs: Array<TxBodyInput>): number => {
    return getInputAssetUTXOSum(reservedInputs);
}

const conclaveCoinSelection = async (
    conclaveUTXOInputs: Array<TxBodyInput>,
    conclaveBodyOutputs: Array<ConclaveAmount>,
    rawAdaUTXOBodyInputs: Array<TxBodyInput>
) => {
    let _pureAdaTxBodyInputs = sortInputAscending(rawAdaUTXOBodyInputs);
    let _conclaveTxBodyOutputs = sortConclaveAmountAscending(conclaveBodyOutputs);
    let _conclaveTxBodyInputs = sortInputDescending(conclaveUTXOInputs, policyStr);
    let maxUTXO = 141;
    let conclaveTxBodyDetailsArray: Array<ConclaveTxBodyDetails> = [];

    let currentConclaveInputsBatch: Array<TxBodyInput> = getArrayBatch(maxUTXO, _conclaveTxBodyInputs)
    let currentConclaveOutputsBatch: Array<ConclaveAmount> = getArrayBatch(maxUTXO, _conclaveTxBodyOutputs)

    //change name
    while (!isEmpty(currentConclaveInputsBatch) && !isEmpty(currentConclaveOutputsBatch)) {
        while (!isWithinTxLimit(currentConclaveInputsBatch, currentConclaveOutputsBatch, maxUTXO)) {

            if (isInputSumLarger(conclaveInputSum(currentConclaveInputsBatch), conclaveOutputSum(currentConclaveOutputsBatch))) {
                removeLastItemFromCurrentBatch(currentConclaveInputsBatch, _conclaveTxBodyInputs);
                continue;
            }
            removeLastItemFromCurrentBatch(currentConclaveOutputsBatch, _conclaveTxBodyOutputs);
        }
        if (isZero(conclaveOutputSum(currentConclaveOutputsBatch))) break;

        let maxCollateral = maxCollateralPossible(maxUTXO, currentConclaveInputsBatch, currentConclaveOutputsBatch);
        let collateralReserveBatch: Array<TxBodyInput> = getArrayBatch(maxCollateral, _pureAdaTxBodyInputs);

        while (
            isOutputSumLarger(conclaveOutputSum(currentConclaveOutputsBatch), conclaveInputSum(currentConclaveInputsBatch)) ||
            isOutputSumLarger(lovelaceCollateralOutputSum(currentConclaveOutputsBatch), reserveLovelaceSum(collateralReserveBatch) + lovelaceInputSum(currentConclaveInputsBatch))) {

            if (isEmpty(currentConclaveOutputsBatch)) break;
            removeLastItemFromCurrentBatch(currentConclaveOutputsBatch, _conclaveTxBodyOutputs);
            addFirstItemFromReserveBatch(collateralReserveBatch, _pureAdaTxBodyInputs);
        }
        if (isZero(conclaveOutputSum(currentConclaveOutputsBatch))) break;

        while (
            isInputSumLarger(conclaveInputSum(currentConclaveInputsBatch), conclaveOutputSum(currentConclaveOutputsBatch)) &&
            isInputSumLarger(reserveLovelaceSum(collateralReserveBatch) + lovelaceInputSum(currentConclaveInputsBatch), conclaveOutputSum(currentConclaveOutputsBatch))) {

            if (isEmpty(currentConclaveInputsBatch)) break;
            removeLastItemFromCurrentBatch(currentConclaveInputsBatch, _conclaveTxBodyInputs);
            addFirstItemFromReserveBatch(collateralReserveBatch, _pureAdaTxBodyInputs);
        }
        addFirstItemFromReserveBatch(currentConclaveInputsBatch, _conclaveTxBodyInputs);
        removeLastItemFromCurrentBatch(collateralReserveBatch, _pureAdaTxBodyInputs);

        while (isOutputSumLarger(lovelaceCollateralOutputSum(currentConclaveOutputsBatch), lovelaceInputSum(currentConclaveInputsBatch))) {
            if (isEmpty(collateralReserveBatch)) break;
            addFirstItemFromReserveBatch(currentConclaveInputsBatch, collateralReserveBatch);
        }

        if (
            isZero(conclaveOutputSum(currentConclaveOutputsBatch)) ||
            !isInputSumLarger(conclaveInputSum(currentConclaveInputsBatch), conclaveOutputSum(currentConclaveOutputsBatch)) ||
            !isInputSumLarger(lovelaceInputSum(currentConclaveInputsBatch), lovelaceCollateralOutputSum(currentConclaveOutputsBatch)))
            break; 

        let newTxBodyDetails: ConclaveTxBodyDetails | null = await createConclaveTxBodyWithFee(
            currentConclaveInputsBatch, 
            currentConclaveOutputsBatch, 
            conclaveOutputSum(currentConclaveOutputsBatch), 
            lovelaceCollateralOutputSum(currentConclaveOutputsBatch));

        if (
            newTxBodyDetails != null &&
            newTxBodyDetails !== undefined) {
            conclaveTxBodyDetailsArray.push(newTxBodyDetails);}

        currentConclaveInputsBatch = getArrayBatch(maxUTXO, _conclaveTxBodyInputs);
        currentConclaveOutputsBatch = getArrayBatch(maxUTXO, _conclaveTxBodyOutputs);
        collateralReserveBatch = [];
    }
    conclaveTxBodyDetailsArray = deductConclaveFees(conclaveTxBodyDetailsArray);
    return conclaveTxBodyDetailsArray;
};

const calculateRewardFeesAsync = async (newTxBodyDetails: RewardTxBodyDetails): Promise<string | null> => {
    let _txOutputs: Array<Reward> = [];

    const _newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(newTxBodyDetails.txInputs, newTxBodyDetails.txOutputSum);

    newTxBodyDetails.txOutputs.forEach((e) => {
        let _reward: Reward = initReward(e.id, 1000000, e.rewardType, e.walletAddress)
        _txOutputs.push(_reward);
    });
    _newTxBodyDetails.txOutputs = _txOutputs;

    let _result = await createRewardTxBodyAsync(_newTxBodyDetails);
    if (isNull(_result)) return null;

    return _result!.txBody.fee().to_str();
};

const calculateConclaveFeesAsync = async (newTxBodyDetails: ConclaveTxBodyDetails): Promise<string | null> => {
    let _txOutputs: Array<ConclaveAmount> = [];

    const _newTxBodyDetails: ConclaveTxBodyDetails = initConclaveTxBodyDetails(
        newTxBodyDetails.txInputs, 
        newTxBodyDetails.collateralOutputSum, 
        newTxBodyDetails.conclaveOutputSum, 
        "0", 
        []);

    newTxBodyDetails.txOutputs.forEach((e) => {
        let _conclaveAmount: ConclaveAmount = initConclaveAmount(
            e.id, 
            e.conclaveAmount,
            2000000,
            e.walletAddress)

        _txOutputs.push(_conclaveAmount);
    });
    _newTxBodyDetails.txOutputs = _txOutputs;

    let _result = await createConclaveTxBodyAsync(_newTxBodyDetails);
    if (_result == null) return null;

    return _result.txBody.fee().to_str();
};

const deductRewardFees = (txBodyDetailsArray: Array<RewardTxBodyDetails>) => {
    txBodyDetailsArray.forEach((element) => {
        let newFee = parseInt(element.fee) + 200;
        element.txOutputs.forEach((e) => {
            e.rewardAmount = parseInt((e.rewardAmount - (newFee / element.txOutputSum) * e.rewardAmount).toFixed());
        });
    });
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

const setTxInputs = (txBuilder: CardanoWasm.TransactionBuilder, txInputs: Array<TxBodyInput>) => {
    txInputs.forEach((txInput) => {
        const inputValue = CardanoWasm.Value.new(
            CardanoWasm.BigNum.from_str(txInput.asset.find(e => e.unit == "lovelace")!.quantity)
        );

        if (txInput.asset.find(e => e.unit == policyStr)) {
            console.log("Conclave token found" + txInput.asset.find(e => e.unit == policyStr)!.quantity);
            let multiAssetInput = CardanoWasm.MultiAsset.new();
            let assetsInput = CardanoWasm.Assets.new();

            assetsInput.insert(
                CardanoWasm.AssetName.new(Buffer.from(assetName, 'hex')),
                CardanoWasm.BigNum.from_str(txInput.asset.find(e => e.unit == policyStr)!.quantity)
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
}

const setRewardTxOutputs = (txBuilder: CardanoWasm.TransactionBuilder, txOutputs: Array<Reward>) => {
    txOutputs.forEach((txOutput: Reward) => {
        txBuilder.add_output(
            CardanoWasm.TransactionOutput.new(
                CardanoWasm.Address.from_bech32(txOutput.walletAddress),
                CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(txOutput.rewardAmount.toString()))
            )
        );
    });
}

const setConclaveTxOutputs = (txBuilder: CardanoWasm.TransactionBuilder, txOutputs: Array<ConclaveAmount>) => {
    txOutputs.forEach((txOutput: ConclaveAmount) => {
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
};


const setRewardTxBodyDetailsAsync = async (txBodyDetails: RewardTxBodyDetails): Promise<CardanoWasm.TransactionBuilder> => {
    let protocolParameter = await getLatestProtocolParametersAsync(blockfrostAPI);
    let txBuilder = getTransactionBuilder(protocolParameter);

    setTxInputs(txBuilder, txBodyDetails.txInputs);
    setRewardTxOutputs(txBuilder, txBodyDetails.txOutputs);
    return txBuilder;
};

const policyStr = "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a";

const setConclaveTxBodyDetailsAsync = async (txBodyDetails: ConclaveTxBodyDetails): Promise<CardanoWasm.TransactionBuilder> => {
    let protocolParameter = await getLatestProtocolParametersAsync(blockfrostAPI);
    let txBuilder = getTransactionBuilder(protocolParameter);

    setTxInputs(txBuilder, txBodyDetails.txInputs);
    setConclaveTxOutputs(txBuilder, txBodyDetails.txOutputs);

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

const submitTransactionAsync = async (
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

const getOutputAmountSum = (currentOutputBatch: Array<Reward>): number => {
    if (currentOutputBatch === null || currentOutputBatch === undefined) return 0;

    let _partialSum = 0;
    currentOutputBatch.forEach((reward) => {
        _partialSum += reward.rewardAmount;
    });

    return _partialSum;
};

const conclaveOutputSum = (currentConclaveOutputBatch: Array<ConclaveAmount>): number => {
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
            walletAddress: shelleyChangeAddress.to_bech32.toString()
        };

        txBodyOutputs.push(reward);
    }

    const reward: Reward = {
        id: "string",
        rewardType: 1,
        rewardAmount: remainder,
        walletAddress: shelleyChangeAddress.to_bech32.toString()
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
        walletAddress: shelleyChangeAddress.to_bech32.toString()
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
    let utxosInWallet = await getRawUTXOAsset();

    if (isEmpty(rewards) || isEmpty(utxosInWallet)) {
        console.log('no transaction');
        return;
    }

    let txinputoutputs = await rewardCoinSelection(utxosInWallet, rewards);

    if (isNull(txinputoutputs) || isEmpty(txinputoutputs!)) {
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

    for (let txItem of txinputoutputs!) {
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
    let conclaveAssets = await getRawUTXOAsset(policyStr);
    if (isEmpty(conclaveOutputs) || isNull(conclaveOutputs)) {
        console.log('no conclaveAssets');
        return;
    }

    let utxosInWallet = await getRawUTXOAsset();

    let conclaveCoinIO = await conclaveCoinSelection(conclaveAssets, conclaveOutputs, utxosInWallet);
    if (isNull(conclaveCoinIO) || isEmpty(conclaveCoinIO)) {
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
        console.log('TxConclave sum ' + getInputAssetUTXOSum(element.txInputs, policyStr))
        console.log('ConclaveOutput sum ' + conclaveOutputSum(element.txOutputs));
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