<script lang="ts">
    import { selectedMessages } from "./models";

    import Message from "./Message.svelte";

    export let selectedConversationId: string;
</script>

{#if selectedConversationId !== ''}
    {#each $selectedMessages as msg}
        {#if msg.type == 'text'}
            <Message message={msg.toTextMessage().content} role={msg.toTextMessage().role} />
        {/if}
    {/each}
{/if}
<div></div>

