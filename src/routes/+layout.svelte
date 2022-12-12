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
				<span>👋 hi {addr.slice(0, 6)}!</span>
			{:else}
				<button on:click={connect}>Connect with Metamask</button>
			{/if}
		{/await}
	{/key}
</header>

<slot />
