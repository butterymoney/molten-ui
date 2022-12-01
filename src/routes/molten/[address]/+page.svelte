<script lang="ts">
	import { ethers } from 'ethers';
	import MOLTEN_FUNDING_CONTRACT from '@molten/core/out/MoltenFunding.sol/MoltenFunding.json';

	import { page } from '$app/stores';
	import { signer } from '$lib/stores';

	let moltenContract: ethers.Contract;
	let data: { [name: string]: string } = {};

	async function fetchData(_signer: ethers.Signer) {
		moltenContract = new ethers.Contract(
			$page.params.address,
			MOLTEN_FUNDING_CONTRACT.abi,
			_signer
		);
		// moltenContract.connect($signer);
		data.candidate = await moltenContract.candidateAddress();
		data.dao = await moltenContract.daoTreasuryAddress();
		data.totalDeposited = await moltenContract.totalDeposited();
		data = data;
	}

	$: {
		$signer !== null && fetchData($signer);
	}
</script>

<h1>Molten funding contract at {$page.params.address.slice(0, 6)}…</h1>

<main>
	{#if data.candidate && data.dao && data.totalDeposited}
		<ul>
			<li>Candidate: {data.candidate}</li>
			<li>DAO: {data.dao}</li>
			<li>Total deposited: {data.totalDeposited}</li>
		</ul>
	{/if}
</main>
