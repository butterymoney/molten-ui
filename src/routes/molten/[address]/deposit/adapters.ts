import { ethers } from 'ethers';
import MOLTEN_FUNDING_CONTRACT from '@molten/core/out/MoltenFunding.sol/MoltenFunding.json';
import ERC20_ABI from '$lib/abis/erc20.json';
import type { LoadData } from './+page';

export class TxValidationError extends Error {
	name = 'TxValidationError';
}

export const updateAllowance = async (
	signer: ethers.providers.JsonRpcSigner,
	loadData: LoadData,
	amount: bigint
) => {
	const signerAddress = await signer.getAddress();
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
	loadData: LoadData,
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

export const refund = async (
	signer: ethers.providers.JsonRpcSigner,
	loadData: LoadData,
	amount: bigint
) => {
	const moltenContract = new ethers.Contract(
		loadData.moltenFunding.address,
		MOLTEN_FUNDING_CONTRACT.abi,
		signer
	);
	const tx = (await moltenContract.refund(amount)) as ethers.ContractTransaction;
	return tx;
};

export const depositTokenBalance = async (loadData: LoadData, address: string) => {
	const depositContract = new ethers.Contract(
		loadData.moltenFunding.depositToken,
		ERC20_ABI,
		// ⚠️ Sepolia only for now:
		ethers.getDefaultProvider(11155111)
	);
	return ((await depositContract.balanceOf(address)) as ethers.BigNumber).toBigInt();
};

export const deposited = async (loadData: LoadData, address: string) => {
	const moltenContract = new ethers.Contract(
		loadData.moltenFunding.address,
		MOLTEN_FUNDING_CONTRACT.abi,
		// ⚠️ Sepolia only for now:
		ethers.getDefaultProvider(11155111)
	);
	return ((await moltenContract.deposited(address)) as ethers.BigNumber).toBigInt();
};
