<script lang="ts">
	import { page } from '$app/stores';
	import { moltenFundingData, depositTokenData } from '$lib/stores';
	import VoteForLiquidation from './VoteForLiquidation.svelte';
	import WithdrawVoteForLiquidation from './WithdrawVoteForLiquidation.svelte';

	let lock = false;
	const handleSubmitStart = () => {
			lock = true;
		},
		handleSubmitEnd = () => {
			lock = false;
		};
</script>

{#if $moltenFundingData && $depositTokenData}
	<h1>
		Vote for liquidating contract {$moltenFundingData.address.slice(0, 6)}…
	</h1>

	{#if $moltenFundingData.liquidationTime.valueOf() > 0}
		<p class="text-xs"><em>Liquidation already happened.</em></p>
	{:else if $moltenFundingData.exchangeTime.valueOf() == 0}
		<p class="text-xs"><em>Exchange not yet happened</em></p>
	{:else if new Date().valueOf() >= $moltenFundingData.exchangeTime.valueOf() + $moltenFundingData.lockingDuration * 1000}
		<p class="text-xs">
			<em>Lock expired. Liquidation is <a href="./liquidate">already accessible</a>.</em>
		</p>
	{:else}
		<p>
			There are {$moltenFundingData.totalVotesForLiquidation /
				10n ** BigInt($depositTokenData.decimals)} votes casted on a total of {$moltenFundingData.totalDeposited /
				10n ** BigInt($depositTokenData.decimals)}.
		</p>
		<p>
			You have a voting power of {$moltenFundingData._deposited /
				10n ** BigInt($depositTokenData.decimals)}.
		</p>
		<p>
			{#if $moltenFundingData._votedForLiquidation}You have voted{:else}You haven't voted{/if}.
		</p>
		<VoteForLiquidation {handleSubmitStart} {handleSubmitEnd} {lock} />
		<WithdrawVoteForLiquidation {handleSubmitStart} {handleSubmitEnd} {lock} />
	{/if}
{:else}
	<h1>Vote for liquidating contract {$page.params.address.slice(0, 6)}…</h1>
{/if}
