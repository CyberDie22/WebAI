<script lang="ts">
    import PrismJS from "./PrismJS.svelte";

    export let message: string;
    export let role: 'user' | 'assistant' | 'system';

    let messages: Array<{ type: 'code', language: string, code: string } | { type: 'text', text: string }> = []

    const formatMessage = (message: string) => {
        console.log("loading msg:", message, role)
        messages = []
        let lines = message.split("\n");
        let currentMessage = ""
        let inCodeBlock = false
        let language = ""
        for (let line of lines) {
            console.log("prcoessing line:", line)
            if (line.startsWith("```")) {
                if (inCodeBlock && line === "```") {
                    console.log("closing code block", currentMessage, language)
                    messages = [...messages, {
                        type: "code",
                        language: language,
                        code: currentMessage
                    }]
                    currentMessage = ""
                    language = ""
                    inCodeBlock = false
                } else {
                    messages = [...messages, {
                        type: "text",
                        text: currentMessage
                    }]
                    currentMessage = ""
                    language = line.substring(3)
                    if (language === "") {
                        language = "clike"
                    }
                    console.log("opening code block", language)
                    inCodeBlock = true
                }
            } else {
                currentMessage += line + "\n"
            }
        }
        if (inCodeBlock) {
            messages = [...messages, {
                type: "code",
                language: language,
                code: currentMessage
            }]
        } else {
            messages = [...messages, {
                type: "text",
                text: currentMessage
            }]
        }

        console.log("messages:", messages)
    }

    $: formatMessage(message)
</script>

{#if role !== 'system'}
<div class="bg-gray-800/30 mx-auto w-full py-6 my-3 rounded-xl flex flex-col justify-center max-w-3xl">
    <span class="text-xs px-8">{role == 'user' ? "User" : "AI"}</span>
    <span class="px-8 whitespace-pre-wrap">
        {#each messages as msg}
            {#if msg.type === 'text'}
                {msg.text}
            {:else if msg.type === 'code'}
                <PrismJS language={msg.language} code={msg.code} />
            {/if}
        {/each}
    </span>
</div>
{/if}