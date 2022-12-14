<script lang="ts">
	import { page } from '$app/stores';
	import { moltenFundingData, depositTokenData, mTokenData } from '$lib/stores';
</script>

<h1>Molten funding contract at {$page.params.address.slice(0, 6)}…</h1>

<main>
	{#if $moltenFundingData && $depositTokenData && $mTokenData}
		<ul>
			<li>Candidate: {$moltenFundingData.candidateAddress}</li>
			<li>DAO: {$moltenFundingData.daoTreasuryAddress}</li>
			<li>
				Total deposited: {$moltenFundingData.totalDeposited /
					10n ** BigInt($depositTokenData.decimals)}
				{$depositTokenData.symbol}
			</li>
			<li>
				{#if $moltenFundingData.exchangeTime.valueOf() > 0}Exchange happened on {$moltenFundingData.exchangeTime}{:else}Not
					exchanged yet{/if}
			</li>
			<li>
				M tokens total: {$mTokenData.totalSupply / 10n**BigInt($mTokenData.decimals)}
			</li>
			<li>
				M tokens un-claimed: {$moltenFundingData.totalDeposited / $moltenFundingData.exchangeRate}
			</li>
		</ul>
	{/if}
</main>
