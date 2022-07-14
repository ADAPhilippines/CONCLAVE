import { fromHex } from "../utils/string-utils";
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import cbor from 'cbor';
import { mnemonicToEntropy } from 'bip39';

const cbor_hex_key = '582007e4fc2151ff929ff906a48815d4707c715dbdd227bef6f8e0818407e59fd583';
const unhex = fromHex(cbor_hex_key);
const decode = cbor.decode(unhex);
export const privKey = CardanoWasm.PrivateKey.from_normal_bytes(decode);

export const shelleyChangeAddress = CardanoWasm.Address.from_bech32('addr_test1vrhcq70gslwqchcerumm0uqu08zy68qg2mdmh95ar5t545c7avx8t');
export const shelleyOutputAddress = CardanoWasm.Address.from_bech32('addr_test1qryzkhzv3zuurkqz02cyvqq279yr2flk0fwfth2zhgs3ytp7g5cr0jtxf5u065efh4lgqrap7ceh0w85zs2zczvaswgqewwgrf');
export const policyId = "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca18"
export const assetName = "53616d706c65546f6b656e4a0a"
export const policyStr = "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a";

function harden(num: number): number {
    return 0x80000000 + num;
  }

const entropy = mnemonicToEntropy(
[ "science", "shaft", "can", "cram", "odor", "abuse", "dose", "load", "sponsor", "silk", "woman", "extra", "base", "sort", "guard", "reduce", "grape", "roof", "volume", "rally", "normal", "sister", "level", "bullet" ].join(' ')
);
export const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
    Buffer.from(entropy, 'hex'),
    Buffer.from(''),
  );

export const accountKey = rootKey
.derive(harden(1852)) // purpose
.derive(harden(1815)) // coin type
.derive(harden(0)); // account #0

export const utxoPubKey = accountKey
.derive(0) // external
.derive(0)
.to_public();

export const utxoPrvKey = accountKey // key for signing transactions
.derive(harden(0)) // account #0
.derive(harden(0)); // account #0

export const stakeKey = accountKey
.derive(2) // chimeric
.derive(0)
.to_public();

const address = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.testnet().protocol_magic(),
    CardanoWasm.StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash()),
    CardanoWasm.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
 );
 
export const addressBech32 = address.to_address().to_bech32(); // wallet address