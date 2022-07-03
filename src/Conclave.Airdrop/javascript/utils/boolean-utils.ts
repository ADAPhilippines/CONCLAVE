export const isNull = (item: any | null): boolean => {
    if (item === null) return true;
    else return false;
};

export const isUndefined = (item: any | undefined): boolean => {
    if (item === undefined) return true;
    else return false;
};

export const isEmpty = (batch: Array<any>): boolean => {
    if (batch.length <= 0) return true;
    else return false;
};

export const isWithinTxLimit = (array1: Array<any>, array2: Array<any>, maxTxSize: number): boolean => array1.length + array2.length <= maxTxSize;

export const isOutputSumLarger = (outputSum: number, inputSum: number): boolean => inputSum < outputSum;

export const isZero = (number: number): boolean => {
    if (number <= 0) return true;
    else return false;
};

export const isInputSumLarger = (inputSum: number, outputSum: number): boolean => outputSum <= inputSum;