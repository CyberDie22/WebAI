<script lang="ts">
    let clazz: string = "";
    export { clazz as class };
    export let textclass: string = "";
    export let placeholder: string = "";
    export let label: string = ""

    export let text: string;

    export let disabled: boolean = false;
</script>

<div class={`py-3 ${clazz}`}>
    <label>
        {label}

        <div>
            <slot name="extra" />
        </div>

        <input disabled={disabled} type="text" placeholder="{placeholder}" class={`bg-white/10 shadow-md w-full h-full rounded-lg transition-colors duration-150 from-white/10 to-white/20 ${textclass}`} bind:value={text} contenteditable="true">
    </label>
</div>
