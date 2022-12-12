<script lang="ts">
	import { page } from '$app/stores';
	import { moltenFundingData, depositTokenData } from '$lib/stores';
</script>

<h1>Molten funding contract at {$page.params.address.slice(0, 6)}…</h1>

<main>
	{#if $moltenFundingData && $depositTokenData}
		<ul>
			<li>Candidate: {$moltenFundingData.candidateAddress}</li>
			<li>DAO: {$moltenFundingData.daoTreasuryAddress}</li>
			<li>Total deposited: {$moltenFundingData.totalDeposited / 10n ** BigInt($depositTokenData.decimals)} {$depositTokenData.symbol}</li>
		</ul>
	{/if}
</main>
