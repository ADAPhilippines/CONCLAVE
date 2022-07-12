export type DelegatorReward = {
    id: string;
    delegatorSnapshotId: string;
    rewardPercentage: number;
    rewardAmount: number;
    airdropStatus: number;
    transactionHash: string;
    walletAddress: string
}

export type Reward = {
    id: string;
    rewardType: number;
    lovelaceAmount: number;
    conclaveAmount: number;
    walletAddress: string;
}

