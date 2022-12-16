<script lang="ts">
	import { page } from '$app/stores';
	import { moltenFundingData, depositTokenData, mTokenData, daoTokenData } from '$lib/stores';
</script>

<h1>Molten funding contract at {$page.params.address.slice(0, 6)}…</h1>

<main>
	{#if $moltenFundingData && $depositTokenData && $daoTokenData && $mTokenData}
		<ul>
			<li>candidate: <code>{$moltenFundingData.candidateAddress}</code></li>
			<li>DAO: <code>{$moltenFundingData.daoTreasuryAddress}</code></li>
			<li>
				total deposited: <code
					>{$moltenFundingData.totalDeposited / 10n ** BigInt($depositTokenData.decimals)}
					${$depositTokenData.symbol}</code
				>
			</li>
			<li>
				lock duration: <code>{$moltenFundingData.lockingDuration / 24 / 60 / 60} days</code>
			</li>
			<li>
				{#if $moltenFundingData.exchangeTime.valueOf() > 0}
					exchange happened on {$moltenFundingData.exchangeTime}
					{#if $moltenFundingData.liquidationTime.valueOf() == 0}
						<ul>
							<li>
								{$daoTokenData.name} held in contract:
								<code
									>{$daoTokenData._moltenBalance / 10n ** BigInt($daoTokenData.decimals)}
									${$daoTokenData.symbol}</code
								>
							</li>
							<li>
								{$mTokenData.name} total:
								<code
									>{$mTokenData.totalSupply / 10n ** BigInt($mTokenData.decimals)}
									${$mTokenData.symbol}</code
								>
							</li>
							<li>
								locked until {new Date(
									$moltenFundingData.exchangeTime.valueOf() +
										$moltenFundingData.lockingDuration * 1000
								)}
							</li>
							<li>
								{#if $moltenFundingData.totalVotesForLiquidation == $moltenFundingData.totalDeposited}
									unanimous votes for liquidation
								{:else if $moltenFundingData.totalVotesForLiquidation > 0}
									{+(
										(Number($moltenFundingData.totalVotesForLiquidation) /
											Number($moltenFundingData.totalDeposited)) *
										100
									).toFixed(2)}% votes for liquidation
								{:else}no votes for liquidation
								{/if}
							</li>
						</ul>
					{/if}
				{:else}
					not exchanged yet
				{/if}
			</li>
			{#if $moltenFundingData.liquidationTime.valueOf() > 0}
				<li>
					liquidation happened on {$moltenFundingData.liquidationTime}
					<ul>
						<li>
							{$daoTokenData.name} not claimed yet:
							<code
								>{$daoTokenData._moltenBalance / 10n ** BigInt($daoTokenData.decimals)}
								${$daoTokenData.symbol}</code
							>
						</li>
						<li>
							{$mTokenData.name} not redeemed yet:
							<code
								>{$mTokenData.totalSupply / 10n ** BigInt($mTokenData.decimals)}
								${$mTokenData.symbol}</code
							>
						</li>
						{#if $moltenFundingData.totalVotesForLiquidation == $moltenFundingData.totalDeposited}
							<li>this was an unanimous vote for early liquidation</li>
						{/if}
					</ul>
				</li>
			{/if}
		</ul>
	{/if}
</main>
