<div>
    <div class="mdc-typography--caption">{label}</div>
    {#each radioOptions as value}
        <label>
            <input type="radio" {name} {value} >
            <span>{value}</span>
        </label>
    {/each}
    <div id="{name}-validation" data-felte-reporter-dom-for={name} aria-live="polite" />
</div>

<script lang="ts">
    export let name: string;
    export let label: string | undefined = undefined;
    export let radioOptions: string[];
</script>

<style>
</style>