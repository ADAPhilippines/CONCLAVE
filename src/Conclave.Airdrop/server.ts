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

const main = async () => {
    const baseAddress = CardanoWasm.Address.from_bech32(process.env.BASE_ADDRESS as string);
    const signingKey = CardanoWasm.PrivateKey.from_bech32(process.env.PRIVATE_KEY as string);
    const policyId = process.env.CONCLAVE_POLICY_ID as string;
    const blockfrostAPI = new BlockFrostAPI({
        projectId: process.env.PROJECT_ID as string,
    });

    while (true) {
        let { newPendingRewards, inProgressPendingRewards } = await getAllPendingEligibleRewardsAsync(); // InProgress included

        console.log('PENDING REWARDS COUNT: ' + newPendingRewards.length);
        console.log('IN PROGRESS REWARDS COUNT: ' + inProgressPendingRewards.length);

        if (!isEmpty(newPendingRewards) || !isEmpty(inProgressPendingRewards))
            // Start airdropper
            await startAirdropper(blockfrostAPI, newPendingRewards, [], baseAddress, signingKey, policyId);

        const AIRDROPPER_INTERVAL = 1000 * 60 * 60 * 6;
        console.log(`Airdropper will rerun in ${AIRDROPPER_INTERVAL / 24.0} hours `);
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

    // Divide UTXOs
    await divideUTXOsAsync(
        blockfrostAPI,
        protocolParameter,
        2 * 1_000_000,
        1,
        conclavePolicyId,
        process.env.ASSET_NAME as string,
        baseAddress,
        signingKey
    );

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
            process.env.ASSET_NAME as string,
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
