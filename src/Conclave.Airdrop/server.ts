import { TxBodyInput, AirdropBatch, ProtocolParametersResponse } from './types/response-types';
import { displayUTXOs, getAllUTXOsAsync, queryAllUTXOsAsync } from './utils/utxo-utils';
import { PendingReward } from './types/helper-types';
import { isEmpty, isNull } from './utils/boolean-utils';
import { getAllPendingEligibleRewardsAsync } from './utils/reward-utils';
import { setTimeout } from 'timers/promises';
import ConclaveAirdropper from './models/ConclaveAirdropper';
import AirdropWorker from './models/AirdropWorker';
import { getTotalQuantity, getTotalRewardQuantity, lovelaceInputSum, lovelaceOutputSum } from './utils/sum-utils';
import { generateWorkerBatchesWithThreshold } from './utils/worker-utils';
import { dummyDataOutput, dummyInProgress } from './utils/txBody-utils';
import { getLatestProtocolParametersAsync } from './utils/transaction-utils';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { divideUTXOsAsync } from './utils/conclave-utils';
import CardanoUtils from '@adaph/cardano-utils';

const main = async () => {
    const entropy = CardanoUtils.Wallet.generateEntropy(process.env.MNEMONIC as string);
    const rootKey = CardanoUtils.Wallet.getRootKeyFromEntropy(entropy);
    const wallet = CardanoUtils.Wallet.getWalletFromRootKey(rootKey);
    const utxoKeys = CardanoUtils.Wallet.getUtxoPubKeyFromAccountKey(wallet);
    const stakeKey = CardanoUtils.Wallet.getStakeKeyFromAccountKey(wallet);
    const baseAddress = CardanoUtils.Wallet.getBaseAddress(
        utxoKeys.utxoPubkey,
        stakeKey,
        (process.env.NODE_ENV as string) === 'test'
            ? CardanoWasm.NetworkInfo.testnet()
            : CardanoWasm.NetworkInfo.mainnet()
    );

    console.log(baseAddress.to_address().to_bech32());

    const blockfrostAPI = new BlockFrostAPI({
        projectId: process.env.PROJECT_ID as string,
    });

    const PENIDNG_REWARD_THRESHHOLD = 50;

    while (true) {
        let { newPendingRewards, inProgressPendingRewards } = await getAllPendingEligibleRewardsAsync(); // InProgress included

        console.log('PENDING REWARDS COUNT: ' + newPendingRewards.length);
        console.log('IN PROGRESS REWARDS COUNT: ' + inProgressPendingRewards.length);

        if (!(isEmpty(inProgressPendingRewards) && newPendingRewards.length < PENIDNG_REWARD_THRESHHOLD)) {
            if (!isEmpty(newPendingRewards) || !isEmpty(inProgressPendingRewards)) {
                // Start airdropper
                await startAirdropper(
                    blockfrostAPI,
                    newPendingRewards,
                    [],
                    CardanoWasm.Address.from_bech32(baseAddress.to_address().to_bech32()),
                    CardanoWasm.PrivateKey.from_bech32(utxoKeys.utxoPrivKey.to_raw_key().to_bech32()),
                    process.env.CONCLAVE_POLICY_ID as string
                );
            }
        } else {
            console.log('No pending rewards to process');
        }

        const AIRDROPPER_INTERVAL = 1000 * 60 * 60 * 6;
        const COUNTDOWN_INTERVAL = 1000 * 30;
        let remainingTime = AIRDROPPER_INTERVAL;

        const interval = setInterval(() => {
            console.log(`Airdropper will rerun in ${remainingTime / 1000 / 60 / 60} hours `);
            remainingTime -= COUNTDOWN_INTERVAL;
            if (remainingTime <= 0) {
                clearInterval(interval);
            }
        }, 1000 * 30);

        await setTimeout(AIRDROPPER_INTERVAL); // Check every 6 hourse
    }
};

const startAirdropper = async (
    blockfrostAPI: BlockFrostAPI,
    newPendingRewards: PendingReward[],
    inProgressPendingRewards: PendingReward[],
    baseAddress: CardanoWasm.Address,
    signingKey: CardanoWasm.PrivateKey,
    conclavePolicyId: string
): Promise<void> => {
    let protocolParameter = await getLatestProtocolParametersAsync(blockfrostAPI);

    const asset = await blockfrostAPI.assetsById(process.env.ASSET_ID as string);
    console.log(asset);

    // Divide UTXOs
    // await divideUTXOsAsync(
    //     blockfrostAPI,
    //     protocolParameter,
    //     2 * 1_000_000,
    //     1,
    //     conclavePolicyId,
    //     asset.asset_name as string,
    //     baseAddress,
    //     signingKey
    // );

    // Display UTXOs
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, baseAddress.to_bech32());
    await displayUTXOs(utxos!);

    let utxosInWallet: Array<TxBodyInput> = await getAllUTXOsAsync(blockfrostAPI, baseAddress.to_bech32());
    console.log('UTXOs in wallet: ' + utxosInWallet.length);
    // Divide pending rewards into batches
    let airdropBatches: Array<AirdropBatch> = await generateWorkerBatchesWithThreshold(
        utxosInWallet,
        newPendingRewards,
        inProgressPendingRewards,
        20,
        undefined,
        undefined,
        conclavePolicyId
    );

    //initialize workers
    const conclaveAirdropper = new ConclaveAirdropper(10);

    let index = 0;
    for (let airdropBatch of airdropBatches) {
        airdropBatch.index = ++index;
        await executeAirdropWorkerAsync(
            conclaveAirdropper,
            airdropBatch,
            protocolParameter,
            conclavePolicyId,
            asset.asset_name as string,
            baseAddress,
            signingKey,
            process.env.PROJECT_ID as string
        );
    }
};

// helpers
const executeAirdropWorkerAsync = async (
    conclaveAirdropper: ConclaveAirdropper,
    batch: AirdropBatch,
    protocolParameter: ProtocolParametersResponse,
    policyId: string,
    assetName: string,
    baseAddress: CardanoWasm.Address,
    signingKey: CardanoWasm.PrivateKey,
    blockfrostProjectId: string
): Promise<void> => {
    let airdropWorker: AirdropWorker | null = null;

    while (airdropWorker === null) {
        airdropWorker = conclaveAirdropper.getFirstAvailableWorker();

        if (isNull(airdropWorker)) {
            console.log('waiting available worker');
            await setTimeout(1000 * 60 * 2); // wait 2 minutes
            continue;
        }
        airdropWorker!.execute(
            batch,
            protocolParameter,
            policyId,
            assetName,
            baseAddress,
            signingKey,
            blockfrostProjectId
        );
        break;
    }
};

main();
