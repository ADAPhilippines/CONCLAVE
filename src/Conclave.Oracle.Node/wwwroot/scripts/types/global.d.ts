export { }
declare global {
    interface Window {
        csharp: () => void;
        ListenToRequestCreatedEventAsync: (contractAddress: string, rpc: string) => Promise<void>;
        InitializeEthWallet: (privateKey: string, network: string) => Wallet;
        GetSlotFromUnixTimeMilliSeconds: (unixTime: string) => Promise<string>;
        abi: object[];
        IsDelegatedAsync: (privateKey: string, contractAddress: string, rpc: string) => Promise<boolean>;
        GetBlockHashFromSlotAsync: (slotNumber: number) => Promise<BigInt>;
        GetPendingRequestsAsync: (privateKey: string, contractAddress: string, rpc: string) => Promise<BigInt[]>;
        SubmitResultAsync: (privateKey: string, contractAddress: string, requestId: string, decimalsString: string[], nonce: number, rpc: string) => Promise<void>;
        ListenToContractEventAsync: (privateKey: string, contractAddress: string, eventName: string) => void;
        requestnumbers: (requestId: string, timestamp: string, numberOfdecimals: string) => RequestModel;
        GetPublicAddress: (privateKey: string, rpc: string) => Promise<string>;
        Delay: (ms: number) => Promise<void>;
        initWebsocket: () => Promise<void>;
        GetTransactionCount: (privateKey: string, rpc: string) => Promise<number>;
        GetBalance: (privateKey: string, rpc: string) => Promise<string>
    }
}

declare global {
    type RequestModel = {
        requestId: string;
        timeslot: BigInt;
        numberOfdecimals: number;
    }
}