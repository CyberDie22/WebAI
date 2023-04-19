<script lang="ts">
    import SettingsDialog from "./SettingsDialog.svelte";
    import Textbox from "./Textbox.svelte";
    import Listbox from "./Listbox.svelte";
    import RangeSelector from "./RangeSelector.svelte";

    import { createDialog, createListbox } from "svelte-headlessui";

    export let name: string;

    export const settingsDialog = createDialog({ label: name });

    export let data: {
        'elements': ({
            'type': 'textbox',
            'label': string,
            'bind': string,
            'placeholder'?: string,
        } | {
            'type': 'list',
            'label': string,
            'selected': string,
            'options': string[],
            'enabled'?: { [key: string]: boolean },
        } | {
            'type': 'range',
            'label': string,
            'min': number,
            'max': number,
            'step': number,
            'bind': number,
        })[]
    };
</script>

<SettingsDialog settingsDialog={settingsDialog}>
    <h4 class="text-md font-semibold text-white/80">{name}</h4>
    {#each data.elements as element}
        {#if element.type === 'textbox'}
            <Textbox textclass="p-3" bind:text={element.bind} placeholder={element.placeholder} label={element.label} />
        {:else if element.type === 'list'}
        {@const localPicker = createListbox({ label: element.label, selected: element.selected })}
            <Listbox listbox={localPicker} options={element.options} enabled={element.enabled} label={element.label}></Listbox>
        {:else if element.type === 'range'}
            <RangeSelector min={element.min} max={element.max} step={element.step} bind:value={element.bind} label={element.label} />
        {/if}
    {/each}
</SettingsDialog>