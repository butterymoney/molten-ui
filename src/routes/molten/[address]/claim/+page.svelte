<script lang="ts">
	import type { ethers } from 'ethers';
	import { page } from '$app/stores';
	import {
		moltenFundingData,
		moltenStateUpdates,
		depositTokenData,
		daoTokenData,
		mTokenData,
		signer
	} from '$lib/stores';
	import Form, { type SubmitData } from '$lib/components/Form.svelte';
	import Error from '$lib/components/Error.svelte';
	import Notification from '$lib/components/Notification.svelte';
	import { claim } from '$lib/adapters';

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
				tx = await claim($signer, $moltenFundingData);
			} finally {
				if (tx) {
					notifications = [...notifications, '⏱ Awaiting transaction to validate…'];
					const receipt = await tx.wait();
					notifications = [...notifications, `✅ All ${$daoTokenData.name} claimed.`];
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

	// 👓 MoltenFunding.claim
	const getClaimableMTokensBalance = () =>
		($moltenFundingData._deposited * 10n ** BigInt($mTokenData.decimals)) /
		$moltenFundingData.exchangeRate;
	const getUnclaimedMTokenBalance = () =>
		$moltenFundingData._mTokensClaimed ? 0n : getClaimableMTokensBalance();
	const getClaimableBalance = () => $mTokenData._balance + getUnclaimedMTokenBalance();
</script>

{#if $moltenFundingData && $depositTokenData && $daoTokenData}
	<h1>Claim {$daoTokenData.name}</h1>
	{#if $moltenFundingData.exchangeTime.valueOf() == 0}]
		<p class="text-xs"><em>{$daoTokenData.name} not claimable: exchange not yet happened.</em></p>
	{:else if $moltenFundingData.liquidationTime.valueOf() == 0}
		<p class="text-xs">
			<em>{$daoTokenData.name} not claimable: liquidation not yet happened.</em>
		</p>
	{:else if $mTokenData.totalSupply == 0n}
		<p class="text-xs">
			<em
				>All {$mTokenData.name} burned. No more {$daoTokenData.name} to claim in this Molten funding
				contract.</em
			>
		</p>
	{:else if $mTokenData._balance == 0n}
		<p class="text-xs">
			<em
				>You don't have any {$mTokenData.name}, so you can't claim any {$daoTokenData.name} held in this
				contract.</em
			>
		</p>
	{:else}
		<Form {formMeta} on:submit={submitClaimMTokens}>
			<h2>Claim DAO governance tokens</h2>
			<p>
				{getClaimableBalance() / 10n ** BigInt($daoTokenData.decimals)}
				{$daoTokenData.symbol} to claim.
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
	<h1>Claim DAO tokens locked in Molten funding contract {$page.params.address.slice(0, 6)}…</h1>
{/if}
