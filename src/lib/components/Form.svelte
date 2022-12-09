<script context="module" lang="ts">
	export type FormMeta = { [fieldName: string]: { validators: ValidatorFn[] } };
	export type FormErrors = { [fieldName: string]: ValidatorResult };
	export type FormContext = { errors: Writable<FormErrors>; onBlur: (event: Event) => void };
	export type SubmitData = {
		valid: boolean;
		data: { [fieldName: string]: string };
	};
</script>

<script lang="ts">
	import { setContext, createEventDispatcher } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import type { ValidatorFn, ValidatorResult } from '$lib/validators';

	let formEl: HTMLFormElement;

	export let formMeta: FormMeta;
	export function reset() {
		formEl.reset();
	}

	const dispatch = createEventDispatcher<{ submit: SubmitData }>();
	let errors = writable({} as FormErrors);

	function isFormValid(errors: FormErrors): boolean {
		return !Object.values(errors).some((fieldErrors) =>
			Object.values(fieldErrors).some((errorValue) => errorValue !== null)
		);
	}
	function validateField(fieldName: string, value: string): ValidatorResult {
		return {
			...formMeta[fieldName].validators.reduce(
				(inputErrorsAcc, validator) => ({
					...inputErrorsAcc,
					...validator(value)
				}),
				{} as ValidatorResult
			)
		};
	}
	function validateForm(data: { [fieldName: string]: string }): FormErrors {
		return Object.entries(data).reduce(
			(errorsAcc, [fieldName, value]) => ({
				...errorsAcc,
				[fieldName]: validateField(fieldName, value)
			}),
			{} as FormErrors
		);
	}
	function onSubmit(this: HTMLFormElement) {
		const formData = new FormData(this);

		const data = Object.fromEntries(
			Array.from(formData.entries()).filter(
				(fv): fv is [string, string] => typeof fv[1] === 'string'
			)
		);
		const _errors = validateForm(data);

		$errors = _errors;

		return dispatch('submit', { valid: isFormValid(_errors), data });
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
