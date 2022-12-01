import { ethers } from 'ethers';

import { signer } from '$lib/stores';

export async function updateSigner(accounts: string[]) {
	if (accounts.length === 0) {
		signer.set(null);
	} else {
		signer.set(new ethers.providers.Web3Provider(window.ethereum).getSigner());
	}
}

export async function setupListeners() {
	teardownListeners();
	window.ethereum.on('accountsChanged', updateSigner);
}

export async function teardownListeners() {
	window.ethereum.removeListener('accountsChanged', updateSigner);
}
