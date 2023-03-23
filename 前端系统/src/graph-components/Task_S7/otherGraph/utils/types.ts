const isNumber = (v: any) => typeof v === 'number';

const isString = (v: any) => typeof v === 'string';

const isNullOrUndefined = (v: any) => v === null || v === undefined;

export { isNumber, isString, isNullOrUndefined };
