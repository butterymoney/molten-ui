<script lang="ts">
	import { ethers } from 'ethers';
	import MOLTEN_FUNDING_CONTRACT from '@buttergov/molten-core/out/MoltenFunding.sol/MoltenFunding.json';
	import { page } from '$app/stores';
	import { moltenFundingData, moltenStateUpdates, depositTokenData, signer } from '$lib/stores';
	import Form, { type FormMeta, type SubmitData } from '$lib/components/Form.svelte';
	import Input from '$lib/components/Input.svelte';
	import Errors from '$lib/components/InputErrors.svelte';
	import Error from '$lib/components/Error.svelte';
	import Notification from '$lib/components/Notification.svelte';
	import { isAddress, required, type ValidatorFn } from '$lib/validators';
	import { updateDepositTokenAllowance, deposit, refund, TxValidationError } from '$lib/adapters';

	let lock = false;

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
						// [TODO] cleaners: [fromWei(data.depositToken.decimals)]
					}
				] as [string, { validators: ValidatorFn[] }]
		)
	);

	const submitDeposit = async (e: CustomEvent<SubmitData>) => {
		if (!$signer || !e?.detail?.valid || !e?.detail?.cleanedData) return;

		depositError = '';
		depositNotifications = [];
		lock = true;
		// [TODO] Use a cleaner to translate cleanedData.amount in weis (same for other forms).
		const amount = BigInt(e.detail.cleanedData.amount) * 10n ** BigInt($depositTokenData.decimals);

		let allowanceTx: ethers.ContractTransaction | undefined;
		let depositTx: ethers.ContractTransaction | undefined;
		try {
			try {
				allowanceTx = await updateDepositTokenAllowance($signer, $moltenFundingData, amount);
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
						} allowance for Molten funding contract ${$moltenFundingData.address.slice(
							0,
							6
						)} to ${BigInt(e.detail.cleanedData.amount)} ${$depositTokenData.symbol}.`
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
						`✅ Completed deposit of ${BigInt(e.detail.cleanedData.amount)} ${
							$depositTokenData.symbol
						}.`
					];
					$moltenStateUpdates = [...$moltenStateUpdates, depositReceipt];
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
					}
				] as [string, { validators: ValidatorFn[] }]
		)
	);

	const submitRefund = async (e: CustomEvent<SubmitData>) => {
		if (!$signer || !e?.detail?.valid || !e?.detail?.cleanedData) return;
		refundError = '';
		refundNotifications = [];
		lock = true;
		const amount = BigInt(e.detail.cleanedData.amount) * 10n ** BigInt($depositTokenData.decimals);

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
						`✅ Completed refund of ${BigInt(e.detail.cleanedData.amount)} ${
							$depositTokenData.symbol
						}.`
					];
					$moltenStateUpdates = [...$moltenStateUpdates, refundReceipt];
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
</script>

{#if $moltenFundingData && $depositTokenData}
	<h1>
		Deposit {$depositTokenData.name} in contract {$moltenFundingData.address.slice(0, 6)}…
	</h1>

	{#if $moltenFundingData.exchangeTime.valueOf() > 0}
		<p class="text-xs"><em>Exchange already happened.</em></p>
	{:else}
		<Form formMeta={depositFormMeta} on:submit={submitDeposit} bind:this={depositForm}>
			<h2>Deposit</h2>
			<p>
				{$depositTokenData._balance / 10n ** BigInt($depositTokenData.decimals)}
				{$depositTokenData.symbol} available.
			</p>
			<div>
				<Input
					label="Amount"
					name="amount"
					type="number"
					min="0"
					max={$depositTokenData._balance}
				/>
				<Errors fieldName="amount" />
			</div>
			<button type="submit" disabled={!$signer || lock}>Deposit</button>
			{#if depositError}
				<Error message={depositError} />
			{/if}
			{#if depositNotifications.length}
				<Notification messages={depositNotifications} />
			{/if}
		</Form>

		<Form formMeta={refundFormMeta} on:submit={submitRefund} bind:this={refundForm}>
			<h2>Withdraw</h2>
			<p>
				{$moltenFundingData._deposited / 10n ** BigInt($depositTokenData.decimals)}
				{$depositTokenData.symbol} currently deposited.
			</p>
			<div>
				<Input
					label="Amount"
					name="amount"
					type="number"
					min="0"
					max={$moltenFundingData._deposited}
				/>
				<Errors fieldName="amount" />
			</div>
			<button type="submit" disabled={!$signer || lock}>Withdraw</button>
			{#if refundError}
				<Error message={refundError} />
			{/if}
			{#if refundNotifications.length}
				<Notification messages={refundNotifications} />
			{/if}
		</Form>
	{/if}
{:else}
	<h1>Deposit in contract {$page.params.address.slice(0, 6)}…</h1>
{/if}
