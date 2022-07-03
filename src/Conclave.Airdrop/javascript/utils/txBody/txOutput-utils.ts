import CardanoWasm, { AssetName, Assets, BigNum, MultiAsset, ScriptHash, TransactionBuilder, TransactionOutputBuilder } from '@emurgo/cardano-serialization-lib-nodejs';
import { ConclaveAmount, Reward } from '../../types/database-types';
import { assetName, policyId } from '../transaction-utils';

export const setRewardTxOutputs = (txBuilder: CardanoWasm.TransactionBuilder, txOutputs: Array<Reward>) => {
    txOutputs.forEach((txOutput: Reward) => {
        txBuilder.add_output(
            CardanoWasm.TransactionOutput.new(
                CardanoWasm.Address.from_bech32(txOutput.walletAddress),
                CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(txOutput.rewardAmount.toString()))
            )
        );
    });
}

export const setConclaveTxOutputs = (txBuilder: CardanoWasm.TransactionBuilder, txOutputs: Array<ConclaveAmount>) => {
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