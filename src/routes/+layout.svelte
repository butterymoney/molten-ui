<script lang="ts">
	import { ethers } from 'ethers';
	import { signer } from '$lib/stores';

	import '../app.css';

	const getCurrentAddress = async () => ($signer ? await $signer.getAddress() : undefined);

	const connect = async () => {
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		await provider.send('eth_requestAccounts', []);
		$signer = provider.getSigner();
	};
</script>

<header class="p-4">
	{#key $signer}
		{#await getCurrentAddress() then addr}
			{#if addr}
				<span>👋 hi <code>{addr.slice(0, 6)}</code>!</span>
			{:else}
				<button
					class="rounded px-2 py-1 bg-gray-300 hover:bg-gray-200 focus:bg-gray-200 active:bg-gray-400"
					on:click={connect}>connect with Metamask</button
				>
			{/if}
		{/await}
	{/key}
</header>

<div class="relative min-h-screen md:flex">
	<slot />
</div>
