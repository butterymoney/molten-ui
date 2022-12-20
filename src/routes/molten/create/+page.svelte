<script lang="ts">
	import { ethers } from 'ethers';
	import MOLTEN_FUNDING_CONTRACT from '@molten/core/out/MoltenFunding.sol/MoltenFunding.json';
	import { signer, moltenStateUpdates } from '$lib/stores';
	import { required, isAddress, type ValidatorFn } from '$lib/validators';
	import { daysToSeconds, type CleanerFn } from '$lib/cleaners';
	import Form, { type FormMeta, type SubmitData } from '$lib/components/Form.svelte';
	import Input from '$lib/components/Input.svelte';
	import InputErrors from '$lib/components/InputErrors.svelte';
	import Error from '$lib/components/Error.svelte';
	import Notification from '$lib/components/Notification.svelte';

	const unsignedMoltenFactory = ethers.ContractFactory.fromSolidity(MOLTEN_FUNDING_CONTRACT);
	const constructorInputs = unsignedMoltenFactory.interface.deploy.inputs;
	const defaultValues: { [fieldName: string]: string | string[] } = {
		_uniswapV3OraclePools: ['0x4242424242424242424242424242424242424242'],
		_uniswapV3OracleTokens: [
			'0x4242424242424242424242424242424242424242',
			'0x4242424242424242424242424242424242424242'
		],
		_uniswapV3OraclePeriod: '7'
	};
	const formMeta: FormMeta = Object.fromEntries(
		constructorInputs.map(
			({ name, baseType }) =>
				[
					name,
					{
						validators: [required, ...(baseType === 'address' ? [isAddress] : [])],
						cleaners: [...(name == '_lockingDuration' ? [daysToSeconds] : [])]
					}
				] as [string, { validators: ValidatorFn[]; cleaners: CleanerFn[] }]
		)
	);

	let lock = false,
		error = '',
		notifications: string[] = [];

	const submitCreation = async (e: CustomEvent<SubmitData>) => {
		const cleanedData = e?.detail?.cleanedData;

		if (!$signer || !e?.detail?.valid || !cleanedData) return;

		error = '';
		notifications = [];
		lock = true;

		let contract: ethers.Contract | undefined, receipt: ethers.providers.TransactionReceipt;

		const moltenFactory = unsignedMoltenFactory.connect($signer);
		const args = constructorInputs.map(({ name }) => cleanedData[name] || defaultValues[name]);

		try {
			try {
				contract = await moltenFactory.deploy(...args);
			} finally {
				if (contract) {
					notifications = [...notifications, '⏱ Awaiting deploy transaction to validate…'];
					receipt = await contract.deployTransaction.wait();
					notifications = [
						...notifications,
						`✅ Created Molten funding contract at ${contract.address} ` +
							`(<a href="https://sepolia.etherscan.io/tx/${receipt.transactionHash}">tx</a>).`
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
</script>

<div class="flex-1 p-4">
	<h1>Create a Molten funding contract</h1>

	<Form {formMeta} on:submit={submitCreation}>
		<div>
			<Input
				class="code min-w-[26em]"
				label="DAO token address"
				name="daoTokenAddress"
				value="0x49E30Ae70C314A5b6f95cAF9E891eD20485195E4"
			/>
			<InputErrors fieldName="daoTokenAddress" />
		</div>
		<div>
			<Input label="Locking duration (in days)" name="_lockingDuration" placeholder="365" />
			<InputErrors fieldName="_lockingDuration" />
		</div>
		<div>
			<Input
				class="code min-w-[26em]"
				label="Deposit token address"
				name="depositTokenAddress"
				value="0xb9d450a832785b66d4f99849ad664bcf9eaeacd5"
			/>
			<InputErrors fieldName="depositTokenAddress" />
		</div>
		<div>
			<Input
				class="code min-w-[26em]"
				label="DAO treasury address"
				name="_daoTreasuryAddress"
				value="0x35495dc87c7a569b097932ab0ffaccec9e1309e0"
			/>
			<InputErrors fieldName="_daoTreasuryAddress" />
		</div>
		<div>
			<Input
				class="code min-w-[26em]"
				label="Uniswap v3 oracle address"
				name="uniswapV3OracleAddress"
				value="0x7849342c3ef5ac4292b39de4dca7e76fe94732eb"
			/>
			<InputErrors fieldName="uniswapV3OracleAddress" />
		</div>
		<div class="text-gray-300">
			<Input
				class="code min-w-[26em]"
				label="Uniswap pool"
				name="_uniswapV3OraclePools"
				placeholder="0x4242…"
				disabled
			/>
			<InputErrors fieldName="_uniswapV3OraclePools" />
		</div>
		<div class="text-gray-300">
			<label for="_uniswapV3OracleTokens">Uniswap token path</label>
			<Input
				class="code min-w-[26em]"
				label=""
				name="_uniswapV3OracleTokens"
				placeholder="0x4242…"
				disabled
			/>
			<Input
				class="code min-w-[26em]"
				label=""
				name="_uniswapV3OracleTokens"
				placeholder="0x4242…"
				disabled
			/>
			<InputErrors fieldName="_uniswapV3OracleTokens" />
		</div>
		<div class="text-gray-300">
			<Input
				label="Uniswap oracle period (in days)"
				name="_uniswapV3OraclePeriod"
				placeholder="7"
				disabled
			/>
			<InputErrors fieldName="_uniswapV3OraclePeriod" />
		</div>
		<button type="submit" disabled={!$signer || lock}>Create</button>
		{#if error}
			<Error message={error} />
		{/if}
		{#if notifications.length}
			<Notification messages={notifications} />
		{/if}
	</Form>
</div>
