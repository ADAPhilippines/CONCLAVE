export const fromHex = (hex: string) => Buffer.from(hex, 'hex');

export const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex');

export const asciiToHex = (ascii: string) => toHex(Buffer.from(ascii, 'ascii'));
