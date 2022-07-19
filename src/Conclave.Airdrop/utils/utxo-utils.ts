import {
  BlockFrostAPI,
  BlockfrostServerError,
  Responses,
} from "@blockfrost/blockfrost-js";
import CardanoWasm from "@dcspark/cardano-multiplatform-lib-nodejs";
import { fromHex, toHex } from "./string-utils";
import {
  CardanoAssetResponse,
  RewardTxBodyDetails,
  TxBodyInput,
  UTXO,
} from "../types/response-types";
import { Reward } from "../types/database-types";
import { submitTransactionAsync } from "./transaction-utils";
import { getInputAssetUTXOSum } from "./sum-utils";
import { isNull, isZero } from "./boolean-utils";
import { blockfrostAPI } from "../config/network.config";
import { shelleyChangeAddress } from "../config/walletKeys.config";
import { PendingReward } from "../types/helper-types";
import { setTimeout } from "timers/promises";
import { parentPort } from "worker_threads";

export const getUtxosAsync = async (
  blockfrostApi: BlockFrostAPI,
  publicAddr: string
) => {
  const utxosResults = await blockfrostApi.addressesUtxosAll(publicAddr);

  let utxos: CardanoWasm.TransactionUnspentOutput[] = [];

  for (const utxoResult of utxosResults) {
    utxos.push(
      CardanoWasm.TransactionUnspentOutput.new(
        CardanoWasm.TransactionInput.new(
          CardanoWasm.TransactionHash.from_bytes(fromHex(utxoResult.tx_hash)),
          CardanoWasm.BigNum.from_str(utxoResult.output_index.toString())
        ),
        CardanoWasm.TransactionOutput.new(
          CardanoWasm.Address.from_bech32(publicAddr), // use own address since blockfrost does not provide
          amountToValue(utxoResult.amount)
        )
      )
    );
  }
  return utxos;
};

export const amountToValue = (amount: CardanoAssetResponse[]) => {
  var lovelaceAmt = amount.find(
    (a) => a.unit == "lovelace"
  ) as CardanoAssetResponse;
  var val = CardanoWasm.Value.new(
    CardanoWasm.BigNum.from_str(lovelaceAmt.quantity)
  );
  for (const asset of amount.filter((a) => a.unit != "lovelace")) {
    val = val.checked_add(
      assetValue(
        CardanoWasm.BigNum.from_str("0"),
        asset.unit.substring(0, 56),
        asset.unit.substring(56),
        CardanoWasm.BigNum.from_str(asset.quantity)
      ) as CardanoWasm.Value
    );
  }
  return val;
};

export const assetValue = (
  lovelaceAmt: CardanoWasm.BigNum,
  policyIdHex: string,
  assetNameHex: string,
  amount: CardanoWasm.BigNum
) => {
  const value = CardanoWasm.Value.new(lovelaceAmt);
  const ma = CardanoWasm.MultiAsset.new();
  const assets = CardanoWasm.Assets.new();

  assets.insert(CardanoWasm.AssetName.new(fromHex(assetNameHex)), amount);

  ma.insert(CardanoWasm.ScriptHash.from_bytes(fromHex(policyIdHex)), assets);

  value.set_multiasset(ma);
  return value;
};

export const queryAllUTXOsAsync = async (
  blockfrostApi: BlockFrostAPI,
  address: string
): Promise<UTXO> => {
  let utxos: UTXO = [];
  try {
    utxos = await blockfrostApi.addressesUtxosAll(address);
  } catch (error) {
    if (error instanceof BlockfrostServerError && error.status_code === 404) {
      utxos = [];
    } else {
      throw error;
    }
  }

  if (utxos.length === 0) {
    console.log();
    console.log(
      `You should send ADA to ${address} to have enough funds to sent a transaction`
    );
    console.log();
  }
  return utxos;
};

export const getUtxosWithAsset = async (
  blockfrostApi: BlockFrostAPI,
  address: string,
  unit: string
): Promise<UTXO> => {
  let utxos: UTXO = await blockfrostApi.addressesUtxosAll(address);
  let utxosWithAsset: UTXO = [];

  if (utxos.length < 0) return utxos;

  for (let utxo of utxos) {
    for (let amount of utxo.amount) {
      if (amount.unit !== unit) continue;
      utxosWithAsset.push(utxo);
      break;
    }
  }

  return utxosWithAsset;
};

export const getPureAdaUtxos = async (
  blockfrostApi: BlockFrostAPI,
  address: string
): Promise<UTXO> => {
  let utxos: UTXO = await blockfrostApi.addressesUtxosAll(address);
  if (utxos.length < 0) return utxos;

  let pureAdaUtxos: UTXO = [];

  for (let utxo of utxos) {
    var pureAda = true;
    for (let amount of utxo.amount) {
      if (amount.unit !== "lovelace") pureAda = false;
      break;
    }

    if (pureAda) pureAdaUtxos.push(utxo);
  }

  return pureAdaUtxos;
};

export const awaitChangeInUTXOAsync = async (
  blockfrostAPI: BlockFrostAPI,
  txHashString: string
): Promise<{ status: string; message: string; txHashString: string }> => {
  let maxSlot = await getMaximumSlotAsync(blockfrostAPI);
  const MAX_NUMBER_OF_RETRIES = 30;
  let retryCount = 0;

  if (maxSlot == 0) {
    return {
      status: "failed",
      message: "Maximum number of retries reached",
      txHashString,
    };
  }

  while (retryCount <= MAX_NUMBER_OF_RETRIES) {
    try {
      let latestBlock = await blockfrostAPI.blocksLatest();
      let utxos = await queryAllUTXOsAsync(
        blockfrostAPI,
        shelleyChangeAddress.to_bech32()
      );
      let commonHash = utxos.find((u) => u.tx_hash === txHashString);
      console.log("Waiting for change in UTXO for txhash: " + txHashString);
      if (
        commonHash !== undefined &&
        latestBlock.slot != null &&
        latestBlock.slot <= maxSlot
      ) {
        return {
          status: "updated",
          message: "UTXO updated",
          txHashString,
        };
      } else if (
        latestBlock.slot != null &&
        latestBlock.slot > maxSlot &&
        commonHash === undefined
      ) {
        return {
          status: "failed",
          message: "UTXO Update Failed",
          txHashString,
        };
      }
      const interval = parseInt((20000 * Math.random()).toFixed());
      await setTimeout(interval + 20000);
    } catch (error) {
      const interval = parseInt((3000 * Math.random()).toFixed());
      console.log(
          `Server error, retrying in ${
          5000 + interval
          } ms...\nNumber of retries: ${retryCount}`
      );
      await setTimeout(interval + 5000);
      retryCount++;
    }
  } 

  return {
    status: "failed",
    message: "Maximum number of retries reached",
    txHashString,
  };
};

export const getMaximumSlotAsync = async (
  blockfrostAPI: BlockFrostAPI
): Promise<number> => {
  const MAX_NUMBER_OF_RETRIES = 30;
  let retryCount = 0;

  while (retryCount <= MAX_NUMBER_OF_RETRIES) {
    try {
      let latestBlock = await blockfrostAPI.blocksLatest();
      if (!isNull(latestBlock) && !isNull(latestBlock.slot))
        return latestBlock.slot! + 20 * 20;
    } catch (error) {
      const interval = parseInt((3000 * Math.random()).toFixed());
      await setTimeout(500 + interval);
    }
  }
  return 0;
};

export const partitionUTXOs = (
  utxos: UTXO
): {
  txInputs: Array<TxBodyInput>;
  txOutputs: Array<PendingReward>;
} | null => {
  let txBodyInputs: Array<TxBodyInput> = [];
  let txBodyOutputs: Array<PendingReward> = [];
  let utxoDivider: number = 1;

  utxos.forEach((utxo) => {
    if (
      utxo.amount.length == 1 &&
      utxo.amount[0].unit == "lovelace" &&
      parseInt(utxo.amount.find((f) => f.unit == "lovelace")!.quantity) >
        500000000
    ) {
      let assetArray: Array<CardanoAssetResponse> = [];
      utxo.amount.forEach((asset) => {
        const cardanoAsset: CardanoAssetResponse = {
          unit: asset.unit,
          quantity: asset.quantity,
        };

        assetArray.push(cardanoAsset);
      });

      const utxoInput: TxBodyInput = {
        txHash: utxo.tx_hash,
        outputIndex: utxo.output_index.toString(),
        asset: assetArray,
      };

      txBodyInputs.push(utxoInput);
    }
  });
  txBodyInputs = txBodyInputs.splice(0, 10);

  let utxoSum = getInputAssetUTXOSum(txBodyInputs);
  if (isZero(utxoSum)) return null;

  utxoDivider = parseInt((utxoSum / 251000000).toFixed());

  for (let i: number = 0; i < utxoDivider; i++) {
    const reward: Reward = {
      id: i.toString(),
      rewardType: 3,
      rewardAmount: 251000000,
      walletAddress: shelleyChangeAddress.to_bech32(),
      stakeAddress: " ",
    };

    const pendingReward: PendingReward = {
      stakeAddress: " ",
      rewards: [reward],
    };

    txBodyOutputs.push(pendingReward);
  }
  return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
};

export const combineUTXOs = (
  utxos: UTXO
): {
  txInputs: Array<TxBodyInput>;
  txOutputs: Array<PendingReward>;
} | null => {
  let txBodyInputs: Array<TxBodyInput> = [];
  let txBodyOutputs: Array<PendingReward> = [];
  let utxoDivider: number = 1;

  utxos.forEach((utxo) => {
    if (
      utxo.amount.length == 1 &&
      utxo.amount[0].unit == "lovelace" &&
      parseInt(utxo.amount.find((f) => f.unit == "lovelace")!.quantity) <=
        122000000
    ) {
      let assetArray: Array<CardanoAssetResponse> = [];
      utxo.amount.forEach((asset) => {
        const cardanoAsset: CardanoAssetResponse = {
          unit: asset.unit,
          quantity: asset.quantity,
        };

        assetArray.push(cardanoAsset);
      });

      const utxoInput: TxBodyInput = {
        txHash: utxo.tx_hash,
        outputIndex: utxo.output_index.toString(),
        asset: assetArray,
      };

      txBodyInputs.push(utxoInput);
    }
  });
  txBodyInputs = txBodyInputs.splice(0, 10);

  let utxoSum = getInputAssetUTXOSum(txBodyInputs);
  if (isZero(utxoSum)) return null;

  utxoDivider = parseInt((utxoSum / 251000000).toFixed());

  for (let i: number = 0; i < utxoDivider; i++) {
    const reward: Reward = {
      id: i.toString(),
      rewardType: 3,
      rewardAmount: 251000000,
      walletAddress: shelleyChangeAddress.to_bech32(),
      stakeAddress: " ",
    };

    const pendingReward: PendingReward = {
      stakeAddress: " ",
      rewards: [reward],
    };

    txBodyOutputs.push(pendingReward);
  }
  return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
};
// export const getSmallUTXOs = (utxos: UTXO): {
//     txInputs: Array<TxBodyInput>;
//     txOutputs: Array<PendingReward>;
//     } | null => {
//     let txBodyInputs: Array<TxBodyInput> = [];
//     let txBodyOutputs: Array<PendingReward> = [];

//     utxos.forEach((utxo) => {
//         if (parseInt(utxo.amount.find(f => f.unit == "lovelace")!.quantity) < 300000000) {
//             let assetArray: Array<CardanoAssetResponse> = [];
//             utxo.amount.forEach(asset => {
//                 const cardanoAsset: CardanoAssetResponse = {
//                     unit: asset.unit,
//                     quantity: asset.quantity,
//                 };

//                 assetArray.push(cardanoAsset);
//             });

//             const utxoInput: TxBodyInput = {
//                 txHash: utxo.tx_hash,
//                 outputIndex: utxo.output_index.toString(),
//                 asset: assetArray,
//             };
//             txBodyInputs.push(utxoInput);
//         }
//     });

//     txBodyInputs = txBodyInputs.splice(0, 248);

//     let utxoSum = getInputAssetUTXOSum(txBodyInputs);
//     if (utxoSum === 0) return null;

//     const reward: Reward = {
//         id: "string",
//         rewardType: 3,
//         rewardAmount: utxoSum,
//         walletAddress: shelleyChangeAddress.to_bech32.toString(),
//         stakeAddress: ""
//     };

//     const pendingReward : PendingReward = {
//         stakeAddress: "string",
//         rewards: [reward]
//     };
//     txBodyOutputs.push(pendingReward);

//     return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
// }
