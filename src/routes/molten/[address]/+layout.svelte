<script lang="ts">
	import { page } from '$app/stores';
	import { moltenFundingData } from '$lib/stores';

	$: summary =
		$moltenFundingData &&
		($moltenFundingData.exchangeTime.valueOf() == 0
			? 'deposits ongoing'
			: $moltenFundingData.liquidationTime.valueOf() == 0
			? 'governance tokens locked'
			: 'liquidated');

	$: urlBase = `/molten/${$page.params.address}`;
</script>

<aside class="w-64 p-4 absolute inset-y-0 left-0 md:relative">
	<nav>
		<section>
			<header>
				<h2>
					<a href={`${urlBase}`}>Molten funding contract {$page.params.address.slice(0, 6)}…</a>
				</h2>
				<p class="text-xs">
					Current phase:<br />{#if summary}<em>{summary}.</em>{/if}
				</p>
			</header>
			{#if $moltenFundingData}
				<ul class="mt-2">
					{#if $moltenFundingData.exchangeTime.valueOf() == 0}
						<li><a href={`${urlBase}/deposit`}>Deposit</a></li>
						<li><a href={`${urlBase}/exchange`}>Exchange</a></li>
					{:else if $moltenFundingData.liquidationTime.valueOf() == 0}
						<li><a href={`${urlBase}/claimMTokens`}>Claim mTokens</a></li>
						<li><a href={`${urlBase}/voteForLiquidation`}>Vote for liquidation</a></li>
						<li><a href={`${urlBase}/liquidate`}>Liquidate</a></li>
					{:else}
						<li><a href={`${urlBase}/claim`}>Claim gov tokens</a></li>
					{/if}
				</ul>
			{/if}
		</section>
	</nav>
</aside>

<div class="flex-1 p-4">
	<slot />
</div>
