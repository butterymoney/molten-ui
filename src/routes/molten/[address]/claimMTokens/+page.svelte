<script lang="ts">
	import type { ethers } from 'ethers';
	import { page } from '$app/stores';
	import {
		moltenFundingData,
		moltenStateUpdates,
		depositTokenData,
		mTokenData,
		signer
	} from '$lib/stores';
	import Form, { type SubmitData } from '$lib/components/Form.svelte';
	import Error from '$lib/components/Error.svelte';
	import Notification from '$lib/components/Notification.svelte';
	import { claimMTokens } from '$lib/adapters';

	let lock = false,
		error = '',
		notifications: string[] = [];

	const formMeta = {};

	const submitClaimMTokens = async (e: CustomEvent<SubmitData>) => {
		if ($signer === null || !e?.detail?.valid) return;

		error = '';
		notifications = [];
		lock = true;

		let tx: ethers.ContractTransaction | undefined;

		try {
			try {
				tx = await claimMTokens($signer, $moltenFundingData);
			} finally {
				if (tx) {
					notifications = [...notifications, '⏱ Awaiting transaction to validate…'];
					const receipt = await tx.wait();
					notifications = [...notifications, `✅ All mTokens claimed.`];
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
</script>

{#if $moltenFundingData && $depositTokenData && $mTokenData}
	{#if $moltenFundingData.exchangeTime.valueOf() == 0}]
		<h1>{$mTokenData.name} not claimable</h1>
		<em>Exchange not yet happened.</em>
	{:else if $moltenFundingData._mTokensClaimed}
		<h1>{$mTokenData.name}</h1>
		<em>You've already claimed your mTokens.</em>
	{:else}
		<h1>Claim {$mTokenData.name}</h1>
		{#if $moltenFundingData.exchangeTime.valueOf() == 0}
			<em>Exchange not yet happened.</em>
		{:else}
			<Form {formMeta} on:submit={submitClaimMTokens}>
				<h2>Claim</h2>
				<p>
					<!-- [FIXME] Hardcoded exchange rate -->
					{$moltenFundingData._deposited / 10n ** BigInt($depositTokenData.decimals) / 20n}
					{$mTokenData.symbol} to claim.
				</p>
				<button type="submit" disabled={$signer === null || lock}>Claim</button>
				{#if error}
					<Error message={error} />
				{/if}
				{#if notifications.length}
					<Notification messages={notifications} />
				{/if}
			</Form>
		{/if}
	{/if}
{:else}
	<h1>Claim mTokens in Molten funding contract {$page.params.address.slice(0, 6)}…</h1>
{/if}
