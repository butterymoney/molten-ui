<script lang="ts">
	import { getContext } from 'svelte';
	import type { FormContext } from './Form.svelte';

	const { errors } = getContext<FormContext>('form');

	export let fieldName: string;
</script>

{#each Object.entries($errors?.[fieldName] || {}) as [errorName, message ] (errorName)}
	{#if message !== null}
		<p class="error-message errtype-{errorName}">{message}</p>
	{/if}
{/each}

<style>
	.error-message {
		color: tomato;
		flex: 0 0 100%;
		margin: 0 2px;
		font-size: 0.8em;
	}
</style>
