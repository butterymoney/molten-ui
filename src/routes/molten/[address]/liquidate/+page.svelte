<script lang="ts">
	import type { ethers } from 'ethers';
	import { page } from '$app/stores';
	import {
		signer,
		daoTokenData,
		depositTokenData,
		moltenFundingData,
		moltenStateUpdates,
		mTokenData
	} from '$lib/stores';
	import type { SubmitData } from '$lib/components/Form.svelte';
	import { liquidate } from '$lib/adapters';
	import Form from '$lib/components/Form.svelte';
	import Error from '$lib/components/Error.svelte';
	import Notification from '$lib/components/Notification.svelte';

	let lock = false,
		error = '',
		notifications: string[] = [];

	const formMeta = {};

	const submitExchange = async (e: CustomEvent<SubmitData>) => {
		if (!$signer || !e?.detail?.valid) return;

		error = '';
		notifications = [];
		lock = true;

		let tx: ethers.ContractTransaction | undefined;

		try {
			try {
				tx = await liquidate($signer, $moltenFundingData);
			} finally {
				if (tx) {
					notifications = [...notifications, '⏱ Awaiting liquidate transaction to complete…'];
					const receipt = await tx.wait();
					notifications = [...notifications, `✅ Completed liquidation.`];
					$moltenStateUpdates = [...$moltenStateUpdates, receipt];
				}
			}
		} catch (err) {
			error = 'Transaction aborted';
			return;
		} finally {
			lock = false;
		}
	};

	// 👓 MoltenFunding.liquidate
	$: lockEnd =
		$moltenFundingData &&
		$moltenFundingData.exchangeTime.valueOf() + $moltenFundingData.lockingDuration * 1000;
	$: lockEnded = lockEnd === undefined ? undefined : new Date().valueOf() >= lockEnd;
	$: unanimousLiquidationVote =
		$moltenFundingData &&
		$moltenFundingData.totalVotesForLiquidation == $moltenFundingData.totalDeposited;
</script>

<h1>Liquidate Molten funding contract {$page.params.address.slice(0, 6)}…</h1>
{#if $moltenFundingData && $daoTokenData && $depositTokenData && $mTokenData && lockEnded !== undefined}
	{#if $moltenFundingData.liquidationTime.valueOf() > 0}
		<p class="text-xs">
			<em>Liquidation already happened. You can now <a href="./claim">claim your DAO tokens</a>.</em
			>
		</p>
	{:else if $moltenFundingData.exchangeTime.valueOf() == 0}
		<p class="text-xs"><em>Exchange not happended yet, nothing to liquidate.</em></p>
	{:else if !lockEnded && !unanimousLiquidationVote}
		<p class="text-xs">
			<em
				>Liquidation not yet applicable.
				<ul>
					<li>Time lock only ends on {new Date(lockEnd)}.</li>
					<li>
						Liquidation votes are not unanimous, only {$moltenFundingData.totalVotesForLiquidation} on
						{$moltenFundingData.totalDeposited / 10n ** BigInt($depositTokenData.decimals)} voted for
						it.
					</li>
				</ul>
			</em>
		</p>
	{:else}
		<p class="text-xs">
			<em>
				Liquidation is applicable thanks to:
				<ul>
					{#if lockEnded}<li>Lock ended on {new Date(lockEnd)}.</li>{/if}
					{#if unanimousLiquidationVote}<li>Unanimous vote for liquidation.</li>{/if}
				</ul>
			</em>
		</p>
		<h2>This will liquidate the Molten funding contract</h2>
		<p>
			This will allow {$mTokenData.name} holders to burn them to claim their share of {$daoTokenData._moltenBalance /
				10n ** BigInt($daoTokenData.decimals)}
			{$daoTokenData.name}.
		</p>
		<p>Also, {$mTokenData.name} will be forever non-transferrable.</p>
		<Form {formMeta} on:submit={submitExchange}>
			<button type="submit" disabled={!$signer || lock}>Liquidate</button>
			{#if error}
				<Error message={error} />
			{/if}
			{#if notifications.length}
				<Notification messages={notifications} />
			{/if}
		</Form>
	{/if}
{/if}
