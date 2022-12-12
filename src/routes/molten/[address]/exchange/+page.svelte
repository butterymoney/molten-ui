<script lang="ts">
	import type { ethers } from 'ethers';
	import {
		signer,
		daoTokenData,
		depositTokenData,
		moltenFundingData,
		moltenStateUpdates
	} from '$lib/stores';
	import type { SubmitData } from '$lib/components/Form.svelte';
	import { setInfiniteDaoTokenAllowance, exchange } from '$lib/adapters';
	import Form from '$lib/components/Form.svelte';
	import Error from '$lib/components/Error.svelte';
	import Notification from '$lib/components/Notification.svelte';

	let lock = false,
		error = '',
		notifications: string[] = [];

	const formMeta = {};

	const submitExchange = async (e: CustomEvent<SubmitData>) => {
		if ($signer === null || !e?.detail?.valid) return;

		error = '';
		notifications = [];
		lock = true;

		let allowanceTx: ethers.ContractTransaction | undefined;
		let exchangeTx: ethers.ContractTransaction | undefined;

		try {
			try {
				allowanceTx = await setInfiniteDaoTokenAllowance($signer, $moltenFundingData);
			} finally {
				if (allowanceTx) {
					notifications = [...notifications, '⏱ Awaiting allowance transaction to validate…'];
					await allowanceTx.wait();
					notifications = [
						...notifications,
						`✅ Updated ${
							$depositTokenData.name
						} allowance for Molten funding contract ${$moltenFundingData.address.slice(
							0,
							6
						)} to good ol' ∞.`
					];
					// [TODO] Query the oracle, preview the amount to exchange, reduce allowance to ~ this amount + 10%.
				}
			}

			try {
				exchangeTx = await exchange($signer, $moltenFundingData);
			} finally {
				if (exchangeTx) {
					notifications = [...notifications, '⏱ Awaiting exchange transaction to complete…'];
					const receipt = await exchangeTx.wait();
					// [FIXME] Listen to the dao token erc20 events (or molten events if such) and print amounts exchanged.
					notifications = [
						...notifications,
						`✅ Completed exchange for ${
							$moltenFundingData.totalDeposited / 10n ** BigInt($depositTokenData.decimals)
						} ${$depositTokenData.symbol}.`
					];
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

	let signerAddress = '';
	$: {
		(async () => {
			signerAddress = !$signer ? '' : await $signer.getAddress();
		})();
	}
</script>

<h1>Exchange your treasury tokens for molten deposits</h1>
{#if $moltenFundingData && $daoTokenData && $depositTokenData && signerAddress}
	{#if $moltenFundingData.exchangeTime.valueOf() > 0}
		<em>Exchange already happened.</em>
	{:else if signerAddress != $moltenFundingData.daoTreasuryAddress}
		<em
			>Exchange is only available to the DAO treasury address: {$moltenFundingData.daoTreasuryAddress.slice(
				0,
				6
			)}…</em
		>
	{:else}
		<!-- [TODO] Fetch swap details from the oracle -->
		<h2>
			This will swap your {$daoTokenData.symbol} for {$moltenFundingData.totalDeposited /
				10n ** BigInt($depositTokenData.decimals)}
			{$depositTokenData.symbol}
		</h2>
		<Form {formMeta} on:submit={submitExchange}>
			<button type="submit" disabled={$signer === null || lock}>Exchange</button>
			{#if error}
				<Error message={error} />
			{/if}
			{#if notifications.length}
				<Notification messages={notifications} />
			{/if}
		</Form>
	{/if}
{/if}
