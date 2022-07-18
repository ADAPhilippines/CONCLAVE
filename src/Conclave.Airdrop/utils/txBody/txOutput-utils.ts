import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { assetName, policyId, shelleyOutputAddress } from '../../config/walletKeys.config';
import { Reward } from '../../types/database-types';
import { PendingReward } from '../../types/helper-types';
import { shuffleArray } from '../list-utils';

export const setRewardTxOutputs = (txBuilder: CardanoWasm.TransactionBuilder, txOutputs: Array<PendingReward>) => {
    txOutputs.forEach((txOutput: PendingReward) => {
        const outputValue = CardanoWasm.Value.new(
            CardanoWasm.BigNum.from_str(txOutput.rewards.find(e => e.rewardType == 3)!.rewardAmount.toString())
        );
        
        if (txOutput.rewards.find(e => e.rewardType != 3)) {
            let conclaveSum = "";
            let sum = 0;
            txOutput.rewards.filter(e => e.rewardType != 3).forEach((outputReward: Reward) => {
                sum += outputReward.rewardAmount; 
            })
            conclaveSum = sum.toString();

            let multiAssetOutput = CardanoWasm.MultiAsset.new();
            let assetsOutput = CardanoWasm.Assets.new();

            assetsOutput.insert(
                CardanoWasm.AssetName.new(Buffer.from(assetName, 'hex')),
                CardanoWasm.BigNum.from_str(conclaveSum)
            );
            multiAssetOutput.insert(
                CardanoWasm.ScriptHash.from_bytes(Buffer.from(policyId, 'hex')),
                assetsOutput
            );

            outputValue.set_multiasset(multiAssetOutput);
        }

        txBuilder.add_output(
            CardanoWasm.TransactionOutput.new(
                CardanoWasm.Address.from_bech32(txOutput.rewards[0].walletAddress),
                outputValue
            )
        );
    });
}

export const dummyDataOutput = (): Array<PendingReward> => {
    let dummyData : Array<PendingReward> = [];

    for ( let i = 0; i < 300 ; i++)
    {
        const reward : Reward = {
            id: 'random id1',
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardType: 3,
            rewardAmount: 2000000, //2ADA
            stakeAddress: 'random stake address' + i,
        }

        const pendingReward : PendingReward = {
            stakeAddress: 'random id1' + i,
            rewards: [reward],
        }
        dummyData.push(pendingReward);
    }

    for ( let i = 0; i < 300 ; i++)
    {
        const reward : Reward = {
            id: 'random id1',
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardType: 3,
            rewardAmount: 2000000, //2ADA
            stakeAddress: 'random stake address 0' + i + "r",
        }

        const reward1 : Reward = {
            id: 'random id2',
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardType: 1,
            rewardAmount: 5, //5CONCLAVE
            stakeAddress: 'random stake address 1' + i + "r",
        }

        const reward3 : Reward = {
            id: 'random id3',
            walletAddress: shelleyOutputAddress.to_bech32(),
            rewardType: 2,
            rewardAmount: 2, //2CONCLAVE
            stakeAddress: 'random stake address 2' + i + "r",
        }

        const pendingReward : PendingReward = {
            stakeAddress: 'random id1',
            rewards: [reward , reward1, reward3],
        }
        dummyData.push(pendingReward);
    }

    return dummyData;
}
export const getOutputBatch = async (pendingRewards: Array<PendingReward> = [], batchSize : number = 300) : Promise<Array<Array<PendingReward>>> =>{
    // TODO: uncomment
    // let pendingRewards = await getAllUnpaidAdaRewardsAsync();
    // let getAllConclaveRewards = await getAllUnpaidConclaveTokenRewardsAsync();
    let dummyRewards = dummyDataOutput();
    pendingRewards = dummyRewards;
    shuffleArray(pendingRewards);
    shuffleArray(pendingRewards);
    let txOutputBatches : Array<Array<PendingReward>> = [];

    while(pendingRewards.length > 0){
        txOutputBatches.push(pendingRewards.splice(0,batchSize));
    }
    return txOutputBatches;
}

