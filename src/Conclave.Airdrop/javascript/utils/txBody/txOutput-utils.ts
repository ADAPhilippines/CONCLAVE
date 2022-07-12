import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { assetName, policyId, shelleyOutputAddress } from '../../config/walletKeys.config';
import { Reward } from '../../types/database-types';
import { shuffleArray } from '../list-utils';

export const setRewardTxOutputs = (txBuilder: CardanoWasm.TransactionBuilder, txOutputs: Array<Reward>) => {
    txOutputs.forEach((txOutput: Reward) => {
        const outputValue = CardanoWasm.Value.new(
            CardanoWasm.BigNum.from_str(txOutput.lovelaceAmount.toString())
        );
        
        if (txOutput.conclaveAmount > 0) {
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
        }

        txBuilder.add_output(
            CardanoWasm.TransactionOutput.new(
                CardanoWasm.Address.from_bech32(txOutput.walletAddress),
                outputValue
            )
        );
    });
}

export const dummyDataOutput = (): Array<Reward> => {
    let dummyData : Array<Reward> = [];
    for ( let i = 0; i < 300 ; i++)
    {
        const reward : Reward = {
            id: 'random id1',
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardType: 2,
            lovelaceAmount: 2000000, //2ADA
            conclaveAmount: 0
        }
        dummyData.push(reward);
    }

    for ( let i = 0; i < 300 ; i++)
    {
        const reward : Reward = {
            id: 'random id2',
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardType: 2,
            lovelaceAmount: 3000000, //3ADA
            conclaveAmount: 30
        }
        dummyData.push(reward);
    }

    return dummyData;
}
export const getOutputBatch = async (batchSize : 300) : Promise<Array<Array<Reward>>> =>{
    // TODO: uncomment
    // let pendingRewards = await getAllUnpaidAdaRewardsAsync();
    // let getAllConclaveRewards = await getAllUnpaidConclaveTokenRewardsAsync();
    let pendingRewards : Array<Reward> = [];
    let dummyRewards = dummyDataOutput();
    pendingRewards = dummyRewards;
    shuffleArray(pendingRewards);
    shuffleArray(pendingRewards);
    let txOutputBatches : Array<Array<Reward>> = [];

    while(pendingRewards.length > 0){
        txOutputBatches.push(pendingRewards.splice(0,batchSize));
    }
    return txOutputBatches;
}

