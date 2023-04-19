<script lang="ts">
    import { onMount } from "svelte";
	import type { createListbox } from "svelte-headlessui"
    import Button from "./Button.svelte";
    import Transition from "svelte-transition";

    export let options: Array<string>;
    export let enabled: { [key: string]: boolean } | undefined = undefined;
    export let enabledAwait: Promise<typeof enabled> | undefined = undefined;
    export let listbox: ReturnType<typeof createListbox>;
    export let label: string = "";

    $: {
        if (enabledAwait) {
            enabledAwait.then((value) => {
                enabled = value;
            });
        }
    }

    let mounted = false
    onMount(() => {
        mounted = true
    })
</script>

<div class="relative py-3">
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <label>
        {label}

        <Button class="p-0" buttonclass="p-2" use={listbox.button}>
            <span class="block truncate">{$listbox.selected}</span>
            <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <!-- <Selector class="h-5 w-5 text-gray-400" /> -->
            </span>
        </Button>
    </label>

    <Transition show={$listbox.expanded} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
        <ul
            use:listbox.items
            class="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white/40 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
        >
            <div class="group">
                {#each options as option}
                    {@const active = $listbox.active === option}
                    {@const selected = $listbox.selected === option}
                    <li
                        class="relative cursor-default select-none py-2 pl-10 pr-4 text-gray-900 backdrop-blur-lg {selected ? 'group-hover:hover:bg-white/60 group-hover:bg-transparent bg-white/80' : ''} {active ? 'bg-white/60' : ''}"
                        use:listbox.item={{ value: option, disabled: (enabled ? enabled[option] === false : false) }}
                    >
                        <span class="block truncate {selected ? 'font-medium' : 'font-normal'}">{option}</span>
                        {#if selected}
                            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                <!-- <Check class="h-5 w-5" /> -->
                            </span>
                        {/if}
                    </li>
                {/each}
            </div>
        </ul>
    </Transition>
</div>