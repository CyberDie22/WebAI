<script lang="ts">
    export let min: number = 0;
    export let max: number = 100;
    export let step: number = 1;
    export let value: number = 0;
    export let label: string = "";
</script>

<div class="py-3">
    <label>
        {label}: {value}

        <br>

        <input class="w-full appearance-none" type="range" min={min} max={max} step={step} bind:value={value}>
    </label>
</div>