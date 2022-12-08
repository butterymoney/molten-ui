<script lang="ts">
	import { ethers } from 'ethers';
	import MOLTEN_FUNDING_CONTRACT from '@molten/core/out/MoltenFunding.sol/MoltenFunding.json';
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { signer } from '$lib/stores';
	import Form, { type FormMeta, type SubmitData } from '$lib/components/Form.svelte';
	import Input from '$lib/components/Input.svelte';
	import Errors from '$lib/components/InputErrors.svelte';
	import Error from '$lib/components/Error.svelte';
	import Notification from '$lib/components/Notification.svelte';
	import { isAddress, required, type ValidatorFn } from '$lib/validators';
	import { updateAllowance, deposit, TxValidationError } from './+page';

	export let data: PageData;
	let error: string,
		notifications: string[] = [],
		lock = false;

	const moltenFundingInterface = new ethers.utils.Interface(MOLTEN_FUNDING_CONTRACT.abi);
	const depositInputs = moltenFundingInterface.getFunction('deposit').inputs;

	const formMeta: FormMeta = Object.fromEntries(
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
		if ($signer !== null && e?.detail?.valid) {
			error = '';
			notifications = [];
			lock = true;
			const amount = BigInt(e.detail.data.amount) * 10n ** BigInt(data.depositToken.decimals);

			let allowanceTx: ethers.ContractTransaction | undefined;
			let depositTx: ethers.ContractTransaction | undefined;
			try {
				try {
					allowanceTx = await updateAllowance($signer, data, amount);
				} finally {
					if (allowanceTx) {
						notifications = [...notifications, '⏱ Awaiting allowance transaction to validate…'];
						await allowanceTx.wait();
						notifications = [
							...notifications,
							`✅ Updated ${
								data.depositToken.name
							} allowance for Molten funding contract ${$page.params.address.slice(
								0,
								6
							)} to ${BigInt(e.detail.data.amount)}…`
						];
					} 
				}

				try {
					depositTx = await deposit($signer, data, amount);
				} finally {
					if (depositTx) {
						notifications = [...notifications, '⏱ Awaiting desposit transaction to complete…'];
						await depositTx.wait();
						notifications = [
							...notifications,
							`✅ Completed deposit of ${BigInt(e.detail.data.amount)} ${data.depositToken.name}`
						];
					}
				}
			} catch (err) {
				if (err instanceof TxValidationError) {
					error = err.message;
				} else {
					error = 'Transaction aborted';
				}
				return;
			} finally {
				lock = false;
			}
		}
	};
</script>

<h1>Deposit {data.depositToken.name} in contract {$page.params.address.slice(0, 6)}…</h1>

<Form {formMeta} on:submit={submitDeposit}>
	<div>
		<Input label="Amount" name="amount" />
		<Errors fieldName="amount" />
	</div>
	<button type="submit" disabled={$signer === null || lock}>Deposit</button>
	{#if error}
		<Error message={error} />
	{/if}
	{#if notifications.length}
		<Notification messages={notifications} />
	{/if}
</Form>
