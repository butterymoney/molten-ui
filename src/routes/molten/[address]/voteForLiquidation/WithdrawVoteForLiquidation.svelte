<script lang="ts">
	import { ethers } from 'ethers';
	import MOLTEN_FUNDING_CONTRACT from '@buttergov/molten-core/out/MoltenFunding.sol/MoltenFunding.json';
	import { moltenFundingData, moltenStateUpdates, signer } from '$lib/stores';
	import Form, { type FormMeta, type SubmitData } from '$lib/components/Form.svelte';
	import Error from '$lib/components/Error.svelte';
	import Notification from '$lib/components/Notification.svelte';
	import { isAddress, required, type ValidatorFn } from '$lib/validators';
	import { withdrawVoteForLiquidation } from '$lib/adapters';

	export let handleSubmitStart: () => void;
	export let handleSubmitEnd: () => void;
	export let lock = false;

	const moltenFundingInterface = new ethers.utils.Interface(MOLTEN_FUNDING_CONTRACT.abi);

	const inputs = moltenFundingInterface.getFunction('withdrawVoteForLiquidation').inputs;
	let form: Form,
		error: string,
		notifications: string[] = [];

	const formMeta: FormMeta = Object.fromEntries(
		inputs.map(
			({ name, baseType }) =>
				[
					name,
					{
						validators: [required, ...(baseType === 'address' ? [isAddress] : [])]
					}
				] as [string, { validators: ValidatorFn[] }]
		)
	);

	const submit = async (e: CustomEvent<SubmitData>) => {
		if (!$signer || !e?.detail?.valid) return;

		handleSubmitStart();

		error = '';
		notifications = [];

		let tx: ethers.ContractTransaction | undefined;
		try {
			try {
				tx = await withdrawVoteForLiquidation($signer, $moltenFundingData);
			} finally {
				if (tx) {
					notifications = [...notifications, '⏱ Awaiting withdraw vote transaction to validate…'];
					$moltenStateUpdates = [...$moltenStateUpdates, await tx.wait()];
					notifications = [...notifications, `✅ Vote withdrawn.`];
				}
			}
		} catch (err) {
			error = 'Transaction aborted';
			if (err instanceof Object) {
				const errWithReason = err as { reason?: any };
				if (typeof errWithReason.reason === 'string' && errWithReason.reason)
					error = errWithReason.reason;
			}
			return;
		} finally {
			handleSubmitEnd();
		}

		setTimeout(() => {
			form && form.reset();
			notifications = [];
			error = '';
		}, 1000);
	};
</script>

{#if $moltenFundingData && $moltenFundingData._votedForLiquidation}
	<Form {formMeta} on:submit={submit} bind:this={form}>
		<button type="submit" disabled={!$signer || lock}>Withdraw votes</button>
		{#if error}
			<Error message={error} />
		{/if}
		{#if notifications.length}
			<Notification messages={notifications} />
		{/if}
	</Form>
{/if}
