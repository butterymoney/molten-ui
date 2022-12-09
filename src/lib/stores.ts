import { ethers } from 'ethers';
import { readable, derived } from 'svelte/store';
import { page } from '$app/stores';
import { loadDepositToken, loadMoltenFunding, type DepositTokenData, type MoltenFundingData } from './contractsData';
import { getSigner, setupListeners, teardownListeners } from './metamask';

export const signer = readable<ethers.providers.JsonRpcSigner>(undefined, (set) => {
	const safeSet = (signer: ethers.providers.JsonRpcSigner | undefined) => signer && set(signer);
	new ethers.providers.Web3Provider(window.ethereum)
		.send('eth_requestAccounts', [])
		.then(getSigner)
		.then(safeSet);
	setupListeners(safeSet);
	return teardownListeners;
});

export const moltenFundingData = derived<
	typeof page,
	MoltenFundingData
>(page, ($page, set) => {
	loadMoltenFunding($page.params.address).then(set);
});

export const depositTokenData = derived<
	typeof moltenFundingData,
	DepositTokenData
>(moltenFundingData, ($moltenFundingData, set) => {
	$moltenFundingData && loadDepositToken($moltenFundingData).then(set);
});
