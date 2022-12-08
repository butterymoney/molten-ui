import { ethers } from 'ethers';
import type { PageLoad } from './$types';
import MOLTEN_FUNDING_CONTRACT from '@molten/core/out/MoltenFunding.sol/MoltenFunding.json';
import ERC20_ABI from '$lib/abis/erc20.json';

const loadContractsData = async (address: string) => {
	// ⚠️ Sepolia only for now:
	const provider = ethers.getDefaultProvider(11155111);
	const moltenContract = new ethers.Contract(address, MOLTEN_FUNDING_CONTRACT.abi, provider);
	const moltenFunding = {
		address: address,
		totalDeposited: (await moltenContract.totalDeposited()) as number,
		depositToken: (await moltenContract.depositToken()) as string
	};

	const depositTokenContract = new ethers.Contract(moltenFunding.depositToken, ERC20_ABI, provider);
	const depositToken = {
		name: (await depositTokenContract.name()) as string,
		decimals: (await depositTokenContract.decimals()) as number
	};

	return {
		moltenFunding,
		depositToken
	};
};

export const load: PageLoad = async ({ params }) => await loadContractsData(params.address);

export class TxValidationError extends Error {
	name = 'TxValidationError';
}

export const updateAllowance = async (
	signer: ethers.providers.JsonRpcSigner,
	loadData: Awaited<ReturnType<typeof loadContractsData>>,
	amount: bigint
) => {
    const signerAddress = await await signer.getAddress();
	const depositContract = new ethers.Contract(
		loadData.moltenFunding.depositToken,
		ERC20_ABI,
		signer
	);
	const allowance = (
		await depositContract.allowance(signerAddress, loadData.moltenFunding.address)
	).toBigInt();

	if (amount <= allowance) {
		return;
	}

	const tx = (await depositContract.approve(
		loadData.moltenFunding.address,
		amount
	)) as ethers.ContractTransaction;
	return tx;
};

export const deposit = async (
	signer: ethers.providers.JsonRpcSigner,
	loadData: Awaited<ReturnType<typeof loadContractsData>>,
	amount: bigint
) => {
	const moltenContract = new ethers.Contract(
		loadData.moltenFunding.address,
		MOLTEN_FUNDING_CONTRACT.abi,
		signer
	);
	const tx = (await moltenContract.deposit(amount)) as ethers.ContractTransaction;
	return tx;
};
