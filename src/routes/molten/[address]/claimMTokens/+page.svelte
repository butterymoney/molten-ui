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
		if (!$signer || !e?.detail?.valid) return;

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

	// 👓 MoltenFunding.claimMTokens
	$: claimableMTokensBalance =
		$moltenFundingData &&
		$mTokenData &&
		($moltenFundingData._deposited * 10n ** BigInt($mTokenData.decimals)) /
			$moltenFundingData.exchangeRate;
</script>

{#if $moltenFundingData && $depositTokenData && $mTokenData && claimableMTokensBalance !== undefined}
	<h1>Claim {$mTokenData.name}</h1>
	{#if $moltenFundingData.exchangeTime.valueOf() == 0}]
		<p class="text-xs"><em>{$mTokenData.name} not claimable: exchange not yet happened.</em></p>
	{:else if $moltenFundingData.liquidationTime.valueOf() > 0}
		<p class="text-xs">
			<em
				>{$mTokenData.name} not claimable: liquidation already happened. You can now
				<a href="../claim">claim your DAO tokens</a>.</em
			>
		</p>
	{:else if $moltenFundingData._mTokensClaimed}
		<p class="text-xs"><em>{$mTokenData.name} already claimed.</em></p>
	{:else}
		<Form {formMeta} on:submit={submitClaimMTokens}>
			<h2>Claim mTokens</h2>
			<p>
				{claimableMTokensBalance / 10n ** BigInt($mTokenData.decimals)}
				{$mTokenData.symbol} to claim.
			</p>
			<button type="submit" disabled={!$signer || lock}>Claim</button>
			{#if error}
				<Error message={error} />
			{/if}
			{#if notifications.length}
				<Notification messages={notifications} />
			{/if}
		</Form>
	{/if}
{:else}
	<h1>Claim mTokens in Molten funding contract {$page.params.address.slice(0, 6)}…</h1>
{/if}
