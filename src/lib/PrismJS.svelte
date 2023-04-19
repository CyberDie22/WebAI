<svelte:head>
    <link href="https://unpkg.com/prismjs@v1.x/themes/prism-tomorrow.css" rel="stylesheet" />
    <link href="https://unpkg.com/prismjs@v1.x/plugins/line-numbers/prism-line-numbers.css" rel="stylesheet" />
    <link href="https://unpkg.com/prismjs@v1.x/plugins/inline-color/prism-inline-color.css" rel="stylesheet" />
</svelte:head>

<script lang="ts">
    import { onMount } from "svelte";

    export let language: string;
    export let code: string;

    let codeTag: HTMLElement

    const loadPlugin = (plugin: string, callback: () => void) => {
        let script = document.createElement("script");
        script.src = `https://unpkg.com/prismjs@v1.x/plugins/${plugin}/prism-${plugin}.min.js`
        document.head.append(script)
        script.onload = callback
    }

    const tryHighlight = (code: string) => {
        console.log("trying to highlight", code)
        if (codeTag) {
            codeTag.innerHTML = code
        }
        try {
            Prism.highlightAll()
        } catch (e) {
            console.log("loading plugins")
            let mainScript = document.createElement("script");
            mainScript.src = "https://unpkg.com/prismjs@v1.x/components/prism-core.min.js"
            document.head.append(mainScript)
            mainScript.onload = () => {
                loadPlugin("autoloader", () => {
                    loadPlugin("line-numbers", () => {
                        loadPlugin("autolinker", () => {
                            loadPlugin("inline-color", () => {
                                Prism.plugins.autoloader.languages_path = 'https://prismjs.com/components/';
                                Prism.highlightAll()
                            })
                        })
                    })
                })
            }
        }
    }

    $: tryHighlight(code)

    onMount(() => {
        tryHighlight(code)
    })
</script>

<div class="">
    <pre class="rounded-lg line-numbers"><code class="language-{language}" bind:this={codeTag}></code></pre>
</div>