<script lang="ts">
	import { ethers } from 'ethers';
	import { signer } from '$lib/stores';

	const getCurrentAddress = async () => $signer ? await $signer.getAddress() : undefined

	const connect = async () => {
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		await provider.send('eth_requestAccounts', []);
		$signer = provider.getSigner();
	}
</script>

<header>
	{#key $signer}
		{#await getCurrentAddress() then addr}
			{#if addr}
				<span>👋 hi <code>{addr.slice(0, 6)}</code>!</span>
			{:else}
				<button on:click={connect}>connect with Metamask</button>
			{/if}
		{/await}
	{/key}
</header>

<slot />
