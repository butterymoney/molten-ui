import { ethers } from 'ethers';
import MOLTEN_FUNDING_CONTRACT from '@molten/core/out/MoltenFunding.sol/MoltenFunding.json';
import ERC20_ABI from '$lib/abis/erc20.json';

// 🙏 https://stackoverflow.com/a/44054159/931156
const objectZip: (keys: string[], values: any[]) => { [key: string]: any } = (keys, values) =>
	keys.reduce(
		(others, key, index) => ({
			...others,
			[key]: values[index]
		}),
		{}
	);
const objectPromise: (obj: { [key: string]: any }) => Promise<{ [key: string]: any }> = async (
	obj
) => objectZip(Object.keys(obj), await Promise.all(Object.values(obj)));

export const loadMoltenFunding = async (
	signer: ethers.providers.JsonRpcSigner,
	address: string
) => {
	const contract = new ethers.Contract(address, MOLTEN_FUNDING_CONTRACT.abi, signer);
	const contractData = (await objectPromise({
		address: address,
		candidateAddress: contract.candidateAddress(),
		totalDeposited: contract.totalDeposited(),
		depositToken: contract.depositToken(),
		daoToken: contract.daoToken(),
		mToken: contract.mToken(),
		daoTreasuryAddress: contract.daoTreasuryAddress(),
		exchangeTime: contract.exchangeTime(),
		exchangeRate: contract.exchangeRate(),
		liquidationTime: contract.liquidationTime(),
		lockingDuration: contract.lockingDuration(),
		totalVotesForLiquidation: contract.totalVotesForLiquidation(),
		_deposited: signer.getAddress().then(contract.deposited),
		_mTokensClaimed: signer.getAddress().then(contract.mTokensClaimed)
	})) as {
		address: string;
		candidateAddress: string;
		totalDeposited: ethers.BigNumber;
		depositToken: string;
		daoToken: string;
		mToken: string;
		daoTreasuryAddress: string;
		exchangeTime: ethers.BigNumber;
		exchangeRate: ethers.BigNumber;
		liquidationTime: ethers.BigNumber;
		lockingDuration: number;
		totalVotesForLiquidation: ethers.BigNumber;
		_deposited: ethers.BigNumber;
		_mTokensClaimed: boolean;
	};
	return {
		...contractData,
		totalDeposited: contractData.totalDeposited.toBigInt(),
		exchangeTime: new Date(Number(contractData.exchangeTime.toBigInt()) * 1000),
		exchangeRate: contractData.exchangeRate.toBigInt(),
		liquidationTime: new Date(Number(contractData.liquidationTime.toBigInt()) * 1000),
		totalVotesForLiquidation: contractData.totalVotesForLiquidation.toBigInt(),
		_deposited: contractData._deposited.toBigInt()
	};
};

export const loadDepositToken = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFunding: Awaited<ReturnType<typeof loadMoltenFunding>>
) => {
	const contract = new ethers.Contract(moltenFunding.depositToken, ERC20_ABI, signer);
	const contractData = (await objectPromise({
		name: contract.name(),
		symbol: contract.symbol(),
		decimals: contract.decimals(),
		_balance: signer.getAddress().then(contract.balanceOf)
	})) as { name: string; symbol: string; decimals: number; _balance: ethers.BigNumber };
	return { ...contractData, _balance: contractData._balance.toBigInt() };
};

export const loadDaoToken = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFunding: Awaited<ReturnType<typeof loadMoltenFunding>>
) => {
	const contract = new ethers.Contract(moltenFunding.daoToken, ERC20_ABI, signer);
	const contractData = (await objectPromise({
		name: contract.name(),
		symbol: contract.symbol(),
		decimals: contract.decimals(),
		_moltenBalance: contract.balanceOf(moltenFunding.address)
	})) as { name: string; symbol: string; decimals: number; _moltenBalance: ethers.BigNumber };
	return { ...contractData, _moltenBalance: contractData._moltenBalance.toBigInt() };
};

export const loadMToken = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFunding: Awaited<ReturnType<typeof loadMoltenFunding>>
) => {
	const contract = new ethers.Contract(moltenFunding.mToken, ERC20_ABI, signer);
	const contractData = (await objectPromise({
		name: contract.name(),
		symbol: contract.symbol(),
		decimals: contract.decimals(),
		totalSupply: contract.totalSupply(),
		_balance: signer.getAddress().then(contract.balanceOf)
	})) as {
		name: string;
		symbol: string;
		decimals: number;
		totalSupply: ethers.BigNumber;
		_balance: ethers.BigNumber;
	};
	return {
		...contractData,
		totalSupply: contractData.totalSupply.toBigInt(),
		_balance: contractData._balance.toBigInt()
	};
};

export type MoltenFundingData = Awaited<ReturnType<typeof loadMoltenFunding>>;
export type DepositTokenData = Awaited<ReturnType<typeof loadDepositToken>>;
export type DaoTokenData = Awaited<ReturnType<typeof loadDaoToken>>;
export type MTokenData = Awaited<ReturnType<typeof loadMToken>>;
