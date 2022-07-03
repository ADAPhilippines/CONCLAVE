import { TxBodyInput } from "../../types/response-types";
import { assetName, policyId, policyStr, privKey } from "../transaction-utils";
import CardanoWasm, { AssetName, Assets, BigNum, MultiAsset, ScriptHash, TransactionBuilder, TransactionOutputBuilder } from '@emurgo/cardano-serialization-lib-nodejs';

export const setTxInputs = (txBuilder: CardanoWasm.TransactionBuilder, txInputs: Array<TxBodyInput>) => {
    txInputs.forEach((txInput) => {
        const inputValue = CardanoWasm.Value.new(
            CardanoWasm.BigNum.from_str(txInput.asset.find(e => e.unit == "lovelace")!.quantity)
        );

        if (txInput.asset.find(e => e.unit == policyStr)) {
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