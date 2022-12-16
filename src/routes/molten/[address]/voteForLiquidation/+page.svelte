<script lang="ts">
	import { ethers } from 'ethers';
	import MOLTEN_FUNDING_CONTRACT from '@molten/core/out/MoltenFunding.sol/MoltenFunding.json';
	import { page } from '$app/stores';
	import { moltenFundingData, moltenStateUpdates, depositTokenData, signer } from '$lib/stores';
	import { isAddress, required, type ValidatorFn } from '$lib/validators';
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
		<em>Liquidation already happened.</em>
	{:else if $moltenFundingData.exchangeTime.valueOf() == 0}
		<em>Exchange not yet happened</em>
	{:else if new Date().valueOf() >= $moltenFundingData.exchangeTime.valueOf() + $moltenFundingData.lockingDuration * 1000}
		<em>Lock expired. Liquidation is <a href="./liquidate">already accessible</a>.</em>
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
		<VoteForLiquidation {handleSubmitStart} {handleSubmitEnd} />
		<WithdrawVoteForLiquidation {handleSubmitStart} {handleSubmitEnd} />
	{/if}
{:else}
	<h1>Vote for liquidating contract {$page.params.address.slice(0, 6)}…</h1>
{/if}
