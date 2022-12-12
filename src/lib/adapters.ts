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

	const tx = (await depositContract.approve(
		moltenFundingData.address,
		amount
	)) as ethers.ContractTransaction;
	return tx;
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

	const tx = (await daoTokenContract.approve(
		moltenFundingData.address,
		ethers.constants.MaxUint256
	)) as ethers.ContractTransaction;
	return tx;
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
	const tx = (await moltenContract.deposit(amount)) as ethers.ContractTransaction;
	return tx;
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
	const tx = (await moltenContract.refund(amount)) as ethers.ContractTransaction;
	return tx;
};

// export const depositTokenBalance = async (
// 	moltenFundingData: MoltenFundingData,
// 	address: string
// ) => {
// 	const depositContract = new ethers.Contract(
// 		moltenFundingData.depositToken,
// 		ERC20_ABI,
// 		// ⚠️ Sepolia only for now:
// 		ethers.getDefaultProvider(11155111)
// 	);
// 	return ((await depositContract.balanceOf(address)) as ethers.BigNumber).toBigInt();
// };


export const exchange = async (
	signer: ethers.providers.JsonRpcSigner,
	moltenFundingData: MoltenFundingData
) => {
	const moltenContract = new ethers.Contract(
		moltenFundingData.address,
		MOLTEN_FUNDING_CONTRACT.abi,
		signer
	);
	const tx = (await moltenContract.exchange()) as ethers.ContractTransaction;
	return tx;
};
