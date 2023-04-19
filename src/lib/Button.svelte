<script lang="ts">
    export let onclick: () => void = () => {};
    let clazz: string = "";
    export { clazz as class };
    export let buttonclass: string = "";
    export let use: any = (node: HTMLElement) => {};
</script>

<p class={`${clazz} p-3`}>
    <button use:use class={`bg-white/10 shadow-md w-full h-full rounded-lg hover:bg-white/20 transition-colors duration-150 from-white/10 to-white/20 ${buttonclass}`} on:click={onclick} on:keypress={onclick}>
        <slot />
    </button>
</p>