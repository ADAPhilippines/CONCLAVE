export { }

declare global {
    interface Window {
        connectWallet: () => void,
        interactContract: (numberToStore:number) => Promise<void>,
        ethereum: any,
        copyText: (text:string) => void
    }
}
