export type DelegatorReward = {
	id: string;
	delegatorSnapshotId: string;
	rewardPercentage: number;
	rewardAmount: number;
	airdropStatus: number;
	transactionHash: string;
	walletAddress: string;
};

export type Reward = {
	Id: string;
	RewardType: number;
	RewardAmount: number;
	WalletAddress: string;
	StakeAddress: string;
	TransactionHash: string | null;
};

export type RawReward = {
	id: string;
	rewardType: number;
	rewardAmount: number;
	walletAddress: string;
	stakeAddress: string;
	transactionHash: string | null;
};

export type ConclaveAmount = {
	id: string;
	collateralAmount: number;
	conclaveAmount: number;
	walletAddress: string;
};
