<script lang="ts">
	export let message: string;
</script>

<p class="error-message">{message}</p>

<style>
	.error-message {
		color: tomato;
		flex: 0 0 100%;
		margin: 0 2px;
		font-size: 0.8em;
	}
</style>
