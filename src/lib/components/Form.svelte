<script context="module" lang="ts">
	export type FormMeta = {
		[fieldName: string]: { validators: ValidatorFn[]; cleaners?: CleanerFn[] };
	};
	export type FormErrors = { [fieldName: string]: ValidatorResult };
	export type FormContext = { errors: Writable<FormErrors>; onBlur: (event: Event) => void };
	export type SubmitData = {
		valid: boolean;
		rawData: { [fieldName: string]: string };
		cleanedData?: { [fieldName: string]: any } | undefined;
	};
</script>

<script lang="ts">
	import { setContext, createEventDispatcher } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import type { ValidatorFn, ValidatorResult } from '$lib/validators';
	import type { CleanerFn } from '$lib/cleaners';

	let formEl: HTMLFormElement;

	export let formMeta: FormMeta;
	export function reset() {
		formEl.reset();
	}

	const dispatch = createEventDispatcher<{ submit: SubmitData }>();
	let errors = writable({} as FormErrors);

	const isFormValid = (errors: FormErrors) =>
		!Object.values(errors).some((fieldErrors) =>
			Object.values(fieldErrors).some((errorValue) => errorValue !== null)
		);

	const validateField = (fieldName: string, value: string): ValidatorResult =>
		formMeta[fieldName].validators.reduce(
			(inputErrorsAcc, validator) => ({
				...inputErrorsAcc,
				...validator(value)
			}),
			{} as ValidatorResult
		);
	const validateFormData = (data: { [fieldName: string]: string }): FormErrors =>
		Object.entries(data).reduce(
			(errorsAcc, [fieldName, value]) => ({
				...errorsAcc,
				[fieldName]: validateField(fieldName, value)
			}),
			{} as FormErrors
		);
	const cleanField = (fieldName: string, value: string): any => {
		const cleaners = formMeta[fieldName].cleaners;
		if (cleaners)
			return cleaners.reduce((cleanedValueAcc, cleaner) => cleaner(cleanedValueAcc), value);
		return value;
	};

	const cleanFormData = (data: { [fieldName: string]: any }): { [fieldName: string]: any } =>
		Object.entries(data).reduce(
			(cleanedDataAcc, [fieldName, value]) => ({
				...cleanedDataAcc,
				[fieldName]: cleanField(fieldName, value)
			}),
			{} as { [fieldName: string]: any }
		);
	function onSubmit(this: HTMLFormElement) {
		const formData = new FormData(this);

		const rawData = Object.fromEntries(
			Array.from(formData.entries()).filter(
				(fv): fv is [string, string] => typeof fv[1] === 'string'
			)
		);
		const _errors = validateFormData(rawData);
		const isValid = isFormValid(_errors);
		const submitData = {
			valid: isValid,
			rawData,
			...(isValid ? { cleanedData: cleanFormData(rawData) } : {})
		};

		$errors = _errors;

		return dispatch('submit', submitData);
	}
	function onBlur(this: HTMLInputElement) {
		$errors[this.name] = { ...$errors[this.name], ...validateField(this.name, this.value) };
	}

	setContext('form', { errors, onBlur } as FormContext);
</script>

<form on:submit|preventDefault={onSubmit} bind:this={formEl}>
	<slot />
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		width: 300px;
	}

	:global(form > div) {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
	}

	:global(form > div + *) {
		margin-top: 10px;
	}
</style>
