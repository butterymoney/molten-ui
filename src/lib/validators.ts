import { ethers } from 'ethers';

export type ValidatorResult = {
	[validatorName: string]: string | null;
};

export type ValidatorFn = (value: string) => ValidatorResult;

export const required: ValidatorFn = (value) => ({
	required: value ? null : 'Field is required'
});

export const isAddress: ValidatorFn = (value) => ({
	isAddress: ethers.utils.isAddress(value.toLowerCase()) ? null : 'Not an address'
});
