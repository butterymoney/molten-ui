import { ethers } from 'ethers';

type Handler = (signer: ethers.providers.JsonRpcSigner | null) => void;

export async function getSigner(accounts: string[]) {
	if (accounts.length === 0) {
		return null;
	} else {
		return new ethers.providers.Web3Provider(window.ethereum).getSigner();
	}
}

export async function setupListeners(handler: Handler) {
	teardownListeners();
	window.ethereum.on('accountsChanged', async (accounts: string[]) => {
		handler(await getSigner(accounts));
	});
}

export async function teardownListeners() {
	window.ethereum.removeAllListeners();
}
