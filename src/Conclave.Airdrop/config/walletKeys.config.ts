import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { fromHex } from '../utils/string-utils';
import cbor from 'cbor';
export const SIGN_KEY = CardanoWasm.PrivateKey.from_bech32(process.env.SIGN_KEY_BECH32!);
export const VERIFY_KEY = CardanoWasm.PublicKey.from_bech32(process.env.VERIFY_KEY_BECH32!);
export const SHELLEY_CHANGE_ADDRESS = CardanoWasm.Address.from_bech32(process.env.SHELLEY_CHANGE_ADDRESS!);

// const cbor_hex_key = '582007e4fc2151ff929ff906a48815d4707c715dbdd227bef6f8e0818407e59fd583';
// const unhex = fromHex(cbor_hex_key);
// const decode = cbor.decode(unhex);
// const privKey = CardanoWasm.PrivateKey.from_normal_bytes(decode);

// export const SIGN_KEY = CardanoWasm.PrivateKey.from_bech32(privKey.to_bech32());
// export const VERIFY_KEY = CardanoWasm.PublicKey.from_bech32(privKey.to_public().to_bech32());
// export const SHELLEY_CHANGE_ADDRESS = CardanoWasm.Address.from_bech32(
// 	'addr_test1vrhcq70gslwqchcerumm0uqu08zy68qg2mdmh95ar5t545c7avx8t'
// );

export const SHELLEY_OUTPUT_ADDRESS = CardanoWasm.Address.from_bech32(
	'addr_test1vrhcq70gslwqchcerumm0uqu08zy68qg2mdmh95ar5t545c7avx8t'
);

export const POLICY_ID = process.env.POLICY_ID;
export const ASSET_NAME = process.env.ASSET_NAME;
export const POLICY_STRING = process.env.POLICY_STRING;
