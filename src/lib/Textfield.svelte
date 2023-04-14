<div class="input-field">
    <input style="width: 100%;"{name} {type} {step} class="validate" data-felte-keep-on-remove>
    <label class="active" for={name}>{label}</label>
</div>

<script lang="ts">
    export let name: string;
    export let label: string | undefined = undefined;
    export let type: string = "text";
    export let step: string | undefined = undefined;
</script>

<style>
</style>