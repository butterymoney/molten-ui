<script lang="ts">
	import { ethers } from 'ethers';
	import MOLTEN_FUNDING_CONTRACT from '@molten/core/out/MoltenFunding.sol/MoltenFunding.json';
	import { page } from '$app/stores';
	import { signer } from '$lib/stores';

	let contractData: { [name: string]: string } = {};

	// [XXX] Can be moved to page load
	async function fetchData(_signer: ethers.Signer) {
		const moltenContract = new ethers.Contract(
			$page.params.address,
			MOLTEN_FUNDING_CONTRACT.abi,
			_signer
		);
		// moltenContract.connect($signer);
		contractData.candidate = await moltenContract.candidateAddress();
		contractData.dao = await moltenContract.daoTreasuryAddress();
		contractData.totalDeposited = await moltenContract.totalDeposited();
		contractData = contractData;
	}

	$: {
		$signer !== null && fetchData($signer);
	}
</script>

<h1>Molten funding contract at {$page.params.address.slice(0, 6)}…</h1>

<main>
	{#if contractData.candidate && contractData.dao && contractData.totalDeposited}
		<ul>
			<li>Candidate: {contractData.candidate}</li>
			<li>DAO: {contractData.dao}</li>
			<li>Total deposited: {contractData.totalDeposited}</li>
		</ul>
	{/if}
</main>
