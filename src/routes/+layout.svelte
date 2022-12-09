<script lang="ts">
	import { ethers } from 'ethers';
	import { signer } from '$lib/stores';


	async function getCurrentAddress() {
		if ($signer) {
			const addr = await $signer.getAddress();
			return addr;
		}
	}

	async function connect() {
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		await provider.send('eth_requestAccounts', []);
		$signer = provider.getSigner();
		return $signer.getAddress();
	}

</script>

<header>
	{#key $signer}
		{#await getCurrentAddress() then addr}
			{#if addr}
				<span>{addr.slice(0, 6)}…</span>
			{:else}
				<button on:click={connect}>Connect with Metamask</button>
			{/if}
		{/await}
	{/key}
</header>

<slot />
