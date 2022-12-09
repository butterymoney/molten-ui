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

export const loadMoltenFunding = async (address: string) => {
	// ⚠️ Sepolia only for now:
	const provider = ethers.getDefaultProvider(11155111);
	const moltenContract = new ethers.Contract(address, MOLTEN_FUNDING_CONTRACT.abi, provider);
	const contractData = (await objectPromise({
		address: address,
		totalDeposited: moltenContract.totalDeposited(),
		depositToken: moltenContract.depositToken()
	})) as { address: string; totalDeposited: ethers.BigNumber; depositToken: string };
	return {
		...contractData,
		totalDeposited: contractData.totalDeposited.toBigInt()
	};
};

export const loadDepositToken = async (
	moltenFunding: Awaited<ReturnType<typeof loadMoltenFunding>>
) => {
	// ⚠️ Sepolia only for now:
	const provider = ethers.getDefaultProvider(11155111);
	const depositTokenContract = new ethers.Contract(moltenFunding.depositToken, ERC20_ABI, provider);
	const contractData = (await objectPromise({
		name: depositTokenContract.name(),
		symbol: depositTokenContract.symbol(),
		decimals: depositTokenContract.decimals()
	})) as { name: string; symbol: string; decimals: number };
	return contractData;
};

export type MoltenFundingData = Awaited<ReturnType<typeof loadMoltenFunding>>
export type DepositTokenData = Awaited<ReturnType<typeof loadDepositToken>>