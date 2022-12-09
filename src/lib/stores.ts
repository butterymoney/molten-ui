import { ethers } from 'ethers';
import { readable, derived } from 'svelte/store';
import { page } from '$app/stores';
import { loadContractsData, type ContractsData } from './loadContractsData';
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

export const contractsData = derived<typeof page, ContractsData>(page, ($page, set) => {
	loadContractsData($page.params.address).then(set);
});
