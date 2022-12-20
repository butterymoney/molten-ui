<script lang="ts">
	import { getContext } from 'svelte';

	import type { FormContext } from './Form.svelte';

	export let type = 'text';
	export let label: string;
	export let name: string;

	const { onBlur } = getContext<FormContext>('form');
</script>

<label for={name}>{label}</label>
<input {name} {type} on:blur={onBlur} {...$$restProps} />
