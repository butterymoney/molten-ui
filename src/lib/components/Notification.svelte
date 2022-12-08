<script lang="ts">
	export let messages: string[];
</script>

<ul>
	{#each messages as m}
		<li class="notif-message">{m}</li>
	{/each}
</ul>

<style>
	.notif-message {
		color: limegreen;
		flex: 0 0 100%;
		margin: 0 2px;
		font-size: 0.8em;
	}
</style>
