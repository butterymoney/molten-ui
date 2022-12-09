import { ethers } from 'ethers';

export async function getSigner(accounts: string[]) {
	if (accounts.length !== 0) {
		return new ethers.providers.Web3Provider(window.ethereum).getSigner();
	}
}

export async function setupListeners(
	handler: (signer: ethers.providers.JsonRpcSigner | undefined) => void
) {
	teardownListeners();
	window.ethereum.on('accountsChanged', async (accounts: string[]) => {
		handler(await getSigner(accounts));
	});
}

export async function teardownListeners() {
	window.ethereum.removeAllListeners();
}
