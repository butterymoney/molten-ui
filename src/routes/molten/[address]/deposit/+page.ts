import { ethers } from 'ethers';
import type { PageLoad } from './$types';
import MOLTEN_FUNDING_CONTRACT from '@molten/core/out/MoltenFunding.sol/MoltenFunding.json';
import ERC20_ABI from '$lib/abis/erc20.json';
import type { xlink_attr } from 'svelte/internal';

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

const loadContractsData = async (address: string) => {
	// ⚠️ Sepolia only for now:
	const provider = ethers.getDefaultProvider(11155111);
	const moltenContract = new ethers.Contract(address, MOLTEN_FUNDING_CONTRACT.abi, provider);
	const moltenFunding = (await objectPromise({
		address: address,
		totalDeposited: moltenContract.totalDeposited(),
		depositToken: moltenContract.depositToken()
	})) as { address: string; totalDeposited: ethers.BigNumber; depositToken: string };

	const depositTokenContract = new ethers.Contract(moltenFunding.depositToken, ERC20_ABI, provider);
	const depositToken = (await objectPromise({
		name: depositTokenContract.name(),
		symbol: depositTokenContract.symbol(),
		decimals: depositTokenContract.decimals()
	})) as { name: string; symbol: string; decimals: number };

	return {
		moltenFunding: {
            ...moltenFunding,
            totalDeposited: moltenFunding.totalDeposited.toBigInt()
        },
		depositToken
	};
};

export type LoadData = Awaited<ReturnType<typeof loadContractsData>>;

export const load: PageLoad = async ({ params }) => await loadContractsData(params.address);
