<script lang="ts">
	import type { createDialog } from "svelte-headlessui"
    import { Transition } from "svelte-transition";

    import Button from "./Button.svelte";

    export let settingsDialog: ReturnType<typeof createDialog>;
</script>

<Transition show={$settingsDialog.expanded}>
    <Transition
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
    >
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-lg" on:click={settingsDialog.close} />
    </Transition>

    <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
            <Transition
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
            >
                <div class="w-full max-h-[80vh] max-w-2xl transform overflow-y-auto overflow-x-hidden rounded-2xl bg-white/10 p-6 text-left align-middle shadow-xl transition-all" use:settingsDialog.modal>
                    <h3 class="text-2xl font-bold leading-6 text-white">Settings</h3>
                    <div class="mt-2 h-auto">
                        <slot />
                    </div>
                    
                    <div class="mt-4 w-full flex justify-end">
                        <Button class="w-fit" buttonclass="px-4 py-2" onclick={settingsDialog.close}>Save</Button>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</Transition>