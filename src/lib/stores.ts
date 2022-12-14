import { ethers } from 'ethers';
import { readable, derived, writable } from 'svelte/store';
import { page } from '$app/stores';
import {
	loadDaoToken,
	loadDepositToken,
	loadMoltenFunding,
	loadMToken,
	type DaoTokenData,
	type DepositTokenData,
	type MoltenFundingData,
	type MTokenData
} from './contractsData';
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

// UX/consistency improvement: listen to contract events and lazily or automatically update this.
export const moltenStateUpdates = writable<ethers.providers.TransactionReceipt[]>([]);

export const moltenFundingData = derived<
	[typeof page, typeof signer, typeof moltenStateUpdates],
	MoltenFundingData
>([page, signer, moltenStateUpdates], ([$page, $signer], set) => {
	$signer && loadMoltenFunding($signer, $page.params.address).then(set);
});
export const depositTokenData = derived<
	[typeof signer, typeof moltenFundingData, typeof moltenStateUpdates],
	DepositTokenData
>([signer, moltenFundingData, moltenStateUpdates], ([$signer, $moltenFundingData], set) => {
	$signer && $moltenFundingData && loadDepositToken($signer, $moltenFundingData).then(set);
});
export const daoTokenData = derived<[typeof signer, typeof moltenFundingData, typeof moltenStateUpdates], DaoTokenData>(
	[signer, moltenFundingData, moltenStateUpdates],
	([$signer, $moltenFundingData], set) => {
		$signer && $moltenFundingData && loadDaoToken($signer, $moltenFundingData).then(set);
	}
);
export const mTokenData = derived<[typeof signer, typeof moltenFundingData, typeof moltenStateUpdates], MTokenData> (
	[signer, moltenFundingData, moltenStateUpdates],
	([$signer, $moltenFundingData], set) => {
		$signer && $moltenFundingData && loadMToken($signer, $moltenFundingData).then(set);
	}
)