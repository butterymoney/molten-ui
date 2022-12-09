<script lang="ts">
	import { ethers } from 'ethers';
	import MOLTEN_FUNDING_CONTRACT from '@molten/core/out/MoltenFunding.sol/MoltenFunding.json';
	import { page } from '$app/stores';
	import { moltenFundingData, depositTokenData, signer } from '$lib/stores';
	import Form, { type FormMeta, type SubmitData } from '$lib/components/Form.svelte';
	import Input from '$lib/components/Input.svelte';
	import Errors from '$lib/components/InputErrors.svelte';
	import Error from '$lib/components/Error.svelte';
	import Notification from '$lib/components/Notification.svelte';
	import { isAddress, required, type ValidatorFn } from '$lib/validators';
	import {
		updateAllowance,
		deposit,
		refund,
		deposited,
		depositTokenBalance,
		TxValidationError
	} from './adapters';

	let lock = false;
	let tokensBalance: bigint, tokensDeposited: bigint;

	const moltenFundingInterface = new ethers.utils.Interface(MOLTEN_FUNDING_CONTRACT.abi);

	const depositInputs = moltenFundingInterface.getFunction('deposit').inputs;
	let depositForm: Form,
		depositError: string,
		depositNotifications: string[] = [],
		depositReceipt: ethers.ContractReceipt;

	const depositFormMeta: FormMeta = Object.fromEntries(
		depositInputs.map(
			({ name, baseType }) =>
				[
					name,
					{
						validators: [required, ...(baseType === 'address' ? [isAddress] : [])]
						// [XXX] cleaners: [fromWei(data.depositToken.decimals)]
					}
				] as [string, { validators: ValidatorFn[] }]
		)
	);

	const submitDeposit = async (e: CustomEvent<SubmitData>) => {
		if ($signer === null || !e?.detail?.valid) return;

		depositError = '';
		depositNotifications = [];
		lock = true;
		const amount = BigInt(e.detail.data.amount) * 10n ** BigInt($depositTokenData.decimals);

		let allowanceTx: ethers.ContractTransaction | undefined;
		let depositTx: ethers.ContractTransaction | undefined;
		try {
			try {
				allowanceTx = await updateAllowance($signer, $moltenFundingData, amount);
			} finally {
				if (allowanceTx) {
					depositNotifications = [
						...depositNotifications,
						'⏱ Awaiting allowance transaction to validate…'
					];
					await allowanceTx.wait();
					depositNotifications = [
						...depositNotifications,
						`✅ Updated ${
							$depositTokenData.name
						} allowance for Molten funding contract ${$page.params.address.slice(0, 6)} to ${BigInt(
							e.detail.data.amount
						)}…`
					];
				}
			}

			try {
				depositTx = await deposit($signer, $moltenFundingData, amount);
			} finally {
				if (depositTx) {
					depositNotifications = [
						...depositNotifications,
						'⏱ Awaiting desposit transaction to complete…'
					];
					depositReceipt = await depositTx.wait();
					depositNotifications = [
						...depositNotifications,
						`✅ Completed deposit of ${BigInt(e.detail.data.amount)} ${$depositTokenData.symbol}`
					];
				}
			}
		} catch (err) {
			if (err instanceof TxValidationError) {
				depositError = err.message;
			} else {
				depositError = 'Transaction aborted';
			}
			return;
		} finally {
			lock = false;
		}

		setTimeout(() => depositForm.reset && depositForm.reset(), 1000);
	};

	$: {
		($signer &&
			$moltenFundingData &&
			$depositTokenData &&
			(async () => {
				tokensBalance =
					(await depositTokenBalance($moltenFundingData, await $signer.getAddress())) /
					10n ** BigInt($depositTokenData.decimals);
			})()) ||
			depositReceipt ||
			refundReceipt; // [XXX] Could be more simply managed by sub-components and {#key}
	}

	const refundInputs = moltenFundingInterface.getFunction('refund').inputs;
	let refundForm: Form,
		refundError: string,
		refundNotifications: string[] = [],
		refundReceipt: ethers.ContractReceipt;

	const refundFormMeta: FormMeta = Object.fromEntries(
		refundInputs.map(
			({ name, baseType }) =>
				[
					name,
					{
						validators: [required, ...(baseType === 'address' ? [isAddress] : [])]
						// [XXX] cleaners: [fromWei(data.depositToken.decimals)]
					}
				] as [string, { validators: ValidatorFn[] }]
		)
	);

	const submitRefund = async (e: CustomEvent<SubmitData>) => {
		if ($signer === null || !e?.detail?.valid) return;
		refundError = '';
		refundNotifications = [];
		lock = true;
		const amount = BigInt(e.detail.data.amount) * 10n ** BigInt($depositTokenData.decimals);

		let refundTx: ethers.ContractTransaction | undefined;
		try {
			try {
				refundTx = await refund($signer, $moltenFundingData, amount);
			} finally {
				if (refundTx) {
					refundNotifications = [
						...refundNotifications,
						'⏱ Awaiting refund transaction to complete…'
					];
					refundReceipt = await refundTx.wait();
					refundNotifications = [
						...refundNotifications,
						`✅ Completed refund of ${BigInt(e.detail.data.amount)} ${$depositTokenData.symbol}`
					];
				}
			}
		} catch (err) {
			if (err instanceof TxValidationError) {
				refundError = err.message;
			} else {
				refundError = 'Transaction aborted';
			}
			return;
		} finally {
			lock = false;
		}

		setTimeout(() => refundForm.reset && refundForm.reset(), 1000);
	};

	$: {
		($signer &&
			$moltenFundingData &&
			$depositTokenData &&
			(async () => {
				tokensDeposited =
					(await deposited($moltenFundingData, await $signer.getAddress())) /
					10n ** BigInt($depositTokenData.decimals);
			})()) ||
			depositReceipt ||
			refundReceipt;
	}
</script>

{#if $depositTokenData}
	<h1>
		Deposit {$depositTokenData.name} in contract {$page.params.address.slice(0, 6)}…
	</h1>

	<Form formMeta={depositFormMeta} on:submit={submitDeposit} bind:this={depositForm}>
		<h2>Deposit</h2>
		{#if tokensBalance}
			<p>{tokensBalance} {$depositTokenData.symbol} available.</p>
		{/if}
		<div>
			<Input label="Amount" name="amount" type="number" min="0" max={tokensBalance} />
			<Errors fieldName="amount" />
		</div>
		<button type="submit" disabled={$signer === null || lock}>Deposit</button>
		{#if depositError}
			<Error message={depositError} />
		{/if}
		{#if depositNotifications.length}
			<Notification messages={depositNotifications} />
		{/if}
	</Form>

	<Form formMeta={refundFormMeta} on:submit={submitRefund} bind:this={refundForm}>
		<h2>Withdraw</h2>
		{#if tokensDeposited}
			<p>{tokensDeposited} {$depositTokenData.symbol} currently deposited.</p>
		{/if}
		<div>
			<Input label="Amount" name="amount" type="number" min="0" max={tokensDeposited} />
			<Errors fieldName="amount" />
		</div>
		<button type="submit" disabled={$signer === null || lock}>Withdraw</button>
		{#if refundError}
			<Error message={refundError} />
		{/if}
		{#if refundNotifications.length}
			<Notification messages={refundNotifications} />
		{/if}
	</Form>
{:else}
	<h1>Deposit in contract {$page.params.address.slice(0, 6)}…</h1>
{/if}
