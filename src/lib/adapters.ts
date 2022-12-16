import { ethers } from 'ethers';
import MOLTEN_FUNDING_CONTRACT from '@molten/core/out/MoltenFunding.sol/MoltenFunding.json';
import ERC20_ABI from '$lib/abis/erc20.json';
import type { MoltenFundingData } from '$lib/contractsData';

export class TxValidationError extends Error {
	name = 'TxValidationError';
}

export const updateDepositTokenAllowance = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFundingData: MoltenFundingData,
	amount: bigint
) => {
	const signerAddress = await signer.getAddress();
	const depositContract = new ethers.Contract(moltenFundingData.depositToken, ERC20_ABI, signer);
	const allowance = (
		await depositContract.allowance(signerAddress, moltenFundingData.address)
	).toBigInt();

	if (amount <= allowance) {
		return;
	}

	return (await depositContract.approve(
		moltenFundingData.address,
		amount
	)) as ethers.ContractTransaction;
};

export const setInfiniteDaoTokenAllowance = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFundingData: MoltenFundingData
) => {
	const signerAddress = await signer.getAddress();
	const daoTokenContract = new ethers.Contract(moltenFundingData.daoToken, ERC20_ABI, signer);
	const allowance = (
		await daoTokenContract.allowance(signerAddress, moltenFundingData.address)
	).toBigInt();

	if (allowance == ethers.constants.MaxUint256) {
		return;
	}

	return (await daoTokenContract.approve(
		moltenFundingData.address,
		ethers.constants.MaxUint256
	)) as ethers.ContractTransaction;
};

export const deposit = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFundingData: MoltenFundingData,
	amount: bigint
) => {
	const moltenContract = new ethers.Contract(
		moltenFundingData.address,
		MOLTEN_FUNDING_CONTRACT.abi,
		signer
	);
	return (await moltenContract.deposit(amount)) as ethers.ContractTransaction;
};

export const refund = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFundingData: MoltenFundingData,
	amount: bigint
) => {
	const moltenContract = new ethers.Contract(
		moltenFundingData.address,
		MOLTEN_FUNDING_CONTRACT.abi,
		signer
	);
	return (await moltenContract.refund(amount)) as ethers.ContractTransaction;
};

export const exchange = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFundingData: MoltenFundingData
) => {
	const moltenContract = new ethers.Contract(
		moltenFundingData.address,
		MOLTEN_FUNDING_CONTRACT.abi,
		signer
	);
	return (await moltenContract.exchange()) as ethers.ContractTransaction;
};

export const claimMTokens = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFundingData: MoltenFundingData
) => {
	const moltenContract = new ethers.Contract(
		moltenFundingData.address,
		MOLTEN_FUNDING_CONTRACT.abi,
		signer
	);
	return (await moltenContract.claimMTokens()) as ethers.ContractTransaction;
};

export const claim = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFundingData: MoltenFundingData
) => {
	const moltenContract = new ethers.Contract(
		moltenFundingData.address,
		MOLTEN_FUNDING_CONTRACT.abi,
		signer
	);
	return (await moltenContract.claim()) as ethers.ContractTransaction;
};

export const liquidate = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFundingData: MoltenFundingData
) => {
	const moltenContract = new ethers.Contract(
		moltenFundingData.address,
		MOLTEN_FUNDING_CONTRACT.abi,
		signer
	);
	return (await moltenContract.liquidate()) as ethers.ContractTransaction;
};

export const voteForLiquidation = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFundingData: MoltenFundingData
) => {
	const moltenContract = new ethers.Contract(
		moltenFundingData.address,
		MOLTEN_FUNDING_CONTRACT.abi,
		signer
	);
	return (await moltenContract.voteForLiquidation()) as ethers.ContractTransaction;
};

export const withdrawVoteForLiquidation = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFundingData: MoltenFundingData
) => {
	const moltenContract = new ethers.Contract(
		moltenFundingData.address,
		MOLTEN_FUNDING_CONTRACT.abi,
		signer
	);
	return (await moltenContract.withdrawVoteForLiquidation()) as ethers.ContractTransaction;
};

// [TODO] Generate all the simple functions from the ABI.