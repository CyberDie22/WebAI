<script lang="ts">
	import Button from "$lib/Button.svelte";
	import Textbox from "$lib/Textbox.svelte";
	import AIBox from "$lib/AIBox.svelte";
	import Listbox from "$lib/Listbox.svelte";
	import TextConversationPage from "$lib/TextConversationPage.svelte";
	import NewChatConversationPage from "$lib/NewChatConversationPage.svelte";
	import SettingsDialog from "$lib/SettingsDialog.svelte";

	// import * as ChatGPT from "$lib/chatgpt-api"

	import * as AI from "$lib/models"
	import { convesationUpdateDates } from "$lib/models";
	import { deepClone } from "$lib/deepClone"

	import { createPopover, createDialog, createListbox } from "svelte-headlessui"
	import Transition from "svelte-transition"

	import { onMount } from "svelte";
	import { construct_svelte_component } from "svelte/internal";
	import NewSettingsDialog from "$lib/NewSettingsDialog.svelte";
	import RangeSelector from "$lib/RangeSelector.svelte";
	let isMounted = false

	let totalAI: number = 0;
	let acceptNewTotalAI = true

	const getTotalAI = (atEnd: boolean = false): number => {
		if (!acceptNewTotalAI) {
			totalAI = 0
			acceptNewTotalAI = true
		}
		if (atEnd) {
			acceptNewTotalAI = false
		}
		totalAI += 1;
		return totalAI;
	}

	let defaultSettings: { 
		[key: string]: any,
		'chatgpt': typeof AI.ChatGPT.prototype.options,
		'instructgpt': typeof AI.InstructGPT.prototype.options,
		'webchatgpt': typeof AI.WebChatGPT.prototype.options,
	} = {
		'chatgpt': {
			'api_key': '',
			'model': AI.ChatGPTModel.GPT35Turbo,
			'temperature': 0.7,
			'top_p': 1,
			'max_tokens': Infinity,
			'frequency_penalty': 0.0,
			'presence_penalty': 0.0,
			'system_message': 'You are ChatGPT, a large language model powered by {running_model} trained by OpenAI. Answer as concisely as possible. Knowledge cutoff: {knowledge_cutoff} Current date: {current_date}',
		},
		'instructgpt': {
			'api_key': '',
			'model': AI.InstructGPTModel.Davinci,
			'temperature': 0.7,
			'top_p': 1,
			'max_tokens': Infinity,
			'frequency_penalty': 0.0,
			'presence_penalty': 0.0,
			'system_message': 'You are InstructGPT, a large language model powered by {running_model} trained by OpenAI. Answer as concisely as possible. Knowledge cutoff: {knowledge_cutoff} Current date: {current_date}',
		},
		'webchatgpt': {
			'model': AI.WebChatGPTModel.DefaultGPT3,
			'access_token': '',
			'session_token': '',
			'api_prefix': '',
			'puid': '',
		}
	}

	let aiSelectPopover = createPopover({})
	let chatGPTSettingsDialog = createDialog({ label: 'ChatGPT Settings' });
	let chatGPTSettingsDialogModelPicker = createListbox({ label: 'Model', selected: defaultSettings.chatgpt.model })
	let instructGPTSettingsDialog = createDialog({ label: 'InstructGPT Settings' })
	let instructGPTSettingsDialogModelPicker = createListbox({ label: 'Model', selected: defaultSettings.instructgpt.model })
	let webChatGPTSettingsDialog = createDialog({ label: 'Web ChatGPT Settings' })
	let webChatGPTAuthSelection = ['Access Token', 'Session Token']
	let webChatGPTAuth = 'Access Token'
	let webChatGPTSettingsDialogAuthPicker = createListbox({ label: 'Auth', selected: webChatGPTAuth })
	let webChatGPTSettingsDialogModelPicker = createListbox({ label: 'Model', selected: defaultSettings.webchatgpt.model })

	$: defaultSettings.chatgpt.model = $chatGPTSettingsDialogModelPicker.selected
	$: defaultSettings.instructgpt.model = $instructGPTSettingsDialogModelPicker.selected
	$: webChatGPTAuth = $webChatGPTSettingsDialogAuthPicker.selected

	// sizes are in px
	let aiSelectBox: {
		aiBoxSize: number,
		aiBoxPull: number,
		selectBoxSpacing: number,
		totalBoxPull: number,
		yTranslate: number,
		height: number
	} = {
		'aiBoxSize': 64,
		'aiBoxPull': 24,
		'selectBoxSpacing': 4,
		
		'totalBoxPull': 0,
		'yTranslate': 0,
		'height': 0
	}
	$: {
		aiSelectBox.totalBoxPull = ((totalAI - 1) * aiSelectBox.aiBoxPull)
		aiSelectBox.yTranslate = (aiSelectBox.aiBoxSize * totalAI) + (aiSelectBox.selectBoxSpacing * totalAI) - aiSelectBox.totalBoxPull
		aiSelectBox.height = ((aiSelectBox.aiBoxSize + aiSelectBox.selectBoxSpacing) * totalAI) - aiSelectBox.totalBoxPull - aiSelectBox.selectBoxSpacing
	}

	let message: string = "";
	let messageArea: HTMLTextAreaElement;

	let selectedAI: {
		'name': string,
		'key': string,
	} = {
		'name': 'ChatGPT',
		'key': 'chatgpt'
	}

	// $: console.log(defaultSettings.chatgpt.model)

	let conversations: { [key: string]: { 'aiInstance': AI.Model, 'conversation': AI.Conversation } } = {}
	let selectedConversationId = ''

	const selectAI = (ai: string, aiName: string) => {
		selectedAI.key = ai
		selectedAI.name = aiName
		aiSelectPopover.close()
	}

	onMount(() => {
		isMounted = true
	})

	const sendMessage = async () => {
		let wasNewChat = false
		if (onNewChat) {
			wasNewChat = true
			onNewChat = false
			await createConversation()
		}

		if (conversations[selectedConversationId].aiInstance.inuse) return

		if (!conversations[selectedConversationId]) return

		let sentMessage = message
		message = ""

		let conversation = conversations[selectedConversationId]

		if (conversation.aiInstance.id === 'chatgpt') {
			let chatGPT = conversation.aiInstance as AI.ChatGPT
			await chatGPT.askStream(sentMessage, () => {}).catch((e) => console.log(e))
		} else if (conversation.aiInstance.id === 'instructgpt') {
			let instructGPT = conversation.aiInstance as AI.InstructGPT
			await instructGPT.askStream(sentMessage, () => {}).catch((e) => console.log(e))
		} else if (conversation.aiInstance.id === 'webchatgpt') {
			let webChatGPT = conversation.aiInstance as AI.WebChatGPT
			await webChatGPT.askStream(sentMessage, () => {}).catch((e) => console.log(e))
		}

		if (wasNewChat) {
			let generator = new AI.TitleGeneratorModel()
			await generator.promptStream(message, (_, full) => {
				full = full.trim()
				if (full.startsWith("\"") && full.endsWith("\"")) full = full.substring(1, full.length - 1)
				conversations[selectedConversationId].conversation.name = full
			})
		}
	}

	let onNewChat = true
	const newChatHandler = () => {
		selectedConversationId = ""
		onNewChat = true
	}

	const createConversation = async () => {
		let aiInstance: AI.Model
		let conversation: AI.Conversation;
		switch (selectedAI.key) {
			case 'chatgpt':
				aiInstance = new AI.ChatGPT(deepClone(defaultSettings.chatgpt))
				conversation = (aiInstance as AI.ChatGPT).conversation
				break
			case 'instructgpt':
				aiInstance = new AI.InstructGPT(deepClone(defaultSettings.instructgpt))
				conversation = (aiInstance as AI.InstructGPT).conversation
				break
			case 'webchatgpt':
				aiInstance = new AI.WebChatGPT(deepClone(defaultSettings.webchatgpt))
				conversation = (aiInstance as AI.WebChatGPT).conversation
				break
			default:
				throw new Error("AI not found")
		}

		conversations[conversation.id] = {
			aiInstance: aiInstance,
			conversation: conversation
		}
		selectConversation(conversation.id)

		console.log(conversations)
	}

	const deleteConversation = async (conversationId: string) => {
		if (conversations[conversationId]) {
			delete conversations[conversationId]
		}
		if (selectedConversationId == conversationId) {
			selectedConversationId = ''
		}
		conversations = conversations
	}

	const selectConversation = async (conversationId: string) => {
		if (conversations[selectedConversationId])
			conversations[selectedConversationId].conversation.selected = false
		selectedConversationId = conversationId
		conversations[selectedConversationId].conversation.selected = true
	}

	let activeAI = ''
	$: {
		if (conversations[selectedConversationId]) {
			activeAI = conversations[selectedConversationId].aiInstance.id
		} else {
			activeAI = selectedAI.key
		}
	}
	let activeAIName = ''
	$: {
		if (conversations[selectedConversationId]) {
			activeAIName = conversations[selectedConversationId].aiInstance.name
		} else {
			activeAIName = selectedAI.name
		}
	}
	let activeAINameExtra = ''
	$: {
		if (conversations[selectedConversationId]) {
			activeAINameExtra = conversations[selectedConversationId].aiInstance.nameExtra
		} else {
			if (selectedAI.key === 'chatgpt') {
				activeAINameExtra = `(model: ${defaultSettings.chatgpt.model})`
			} else if (selectedAI.key === 'instructgpt') {
				activeAINameExtra = `(model: ${defaultSettings.instructgpt.model})`
			} else {
				activeAINameExtra = ''
			}
		}
	}
	let activeAIOptions: { [key: string]: any } = {}
	$: {
		switch (activeAI) {
			case 'chatgpt':
				activeAIOptions = (conversations.selectedConversationId?.aiInstance as AI.ChatGPT)?.options || defaultSettings.chatgpt
				break
			case 'instructgpt':
				activeAIOptions = (conversations.selectedConversationId?.aiInstance as AI.InstructGPT)?.options || defaultSettings.instructgpt
				break
			case 'webchatgpt':
				activeAIOptions = (conversations.selectedConversationId?.aiInstance as AI.WebChatGPT)?.options || defaultSettings.webchatgpt
				break
			default:
				activeAIOptions = {}
		}
	}

	let editingTitle: { [key: string]: boolean } = {}
	let editedTitle: { [key: string]: string } = {}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="One UI for many AI" />
</svelte:head>

<div class="flex h-full w-full text-white/80">
	<div class="relative z-20">
		<SettingsDialog settingsDialog={chatGPTSettingsDialog}>
			<h4 class="text-md font-semibold text-white/80">Client Settings</h4>
			<Textbox textclass="p-3" bind:text={defaultSettings.chatgpt.api_key} placeholder="sk-dh7a..." label="API Key" />
			<Textbox textclass="p-3" bind:text={defaultSettings.chatgpt.system_message} label="System Message" />
			<Listbox listbox={chatGPTSettingsDialogModelPicker} options={AI.ChatGPT.models} enabledAwait={isMounted ? AI.ChatGPT.checkAvaliablity(defaultSettings.chatgpt.api_key) : new Promise((resolve) => resolve({}))} label="Model"></Listbox>
			<RangeSelector bind:value={defaultSettings.chatgpt.temperature} min={0} max={2} step={0.01} label="Temperature" />
			<RangeSelector bind:value={defaultSettings.chatgpt.top_p} min={0} max={1} step={0.01} label="Top P" />
			<RangeSelector bind:value={defaultSettings.chatgpt.frequency_penalty} min={-2} max={2} step={0.01} label="Frequency Penalty" />
			<RangeSelector bind:value={defaultSettings.chatgpt.presence_penalty} min={-2} max={2} step={0.01} label="Presence Penalty" />
		</SettingsDialog>

		<SettingsDialog settingsDialog={instructGPTSettingsDialog}>
			<h4 class="text-md font-semibold text-white/80">Client Settings</h4>
			<Textbox textclass="p-3" bind:text={defaultSettings.instructgpt.api_key} placeholder="sk-dh7a..." label="API Key" />
			<Textbox textclass="p-3" bind:text={defaultSettings.instructgpt.system_message} label="System Message" />
			<Listbox listbox={instructGPTSettingsDialogModelPicker} options={AI.InstructGPT.models} label="Model"></Listbox>
			<RangeSelector bind:value={defaultSettings.instructgpt.temperature} min={0} max={2} step={0.01} label="Temperature" />
			<RangeSelector bind:value={defaultSettings.instructgpt.top_p} min={0} max={1} step={0.01} label="Top P" />
			<RangeSelector bind:value={defaultSettings.instructgpt.frequency_penalty} min={-2} max={2} step={0.01} label="Frequency Penalty" />
			<RangeSelector bind:value={defaultSettings.instructgpt.presence_penalty} min={-2} max={2} step={0.01} label="Presence Penalty" />
		</SettingsDialog>

		<SettingsDialog settingsDialog={webChatGPTSettingsDialog}>
			<h4 class="text-md font-semibold text-white/80">Client Settings</h4>
			<Listbox listbox={webChatGPTSettingsDialogAuthPicker} options={webChatGPTAuthSelection} label="Auth Type" />
			{#if webChatGPTAuth === 'Access Token'}
				<Textbox textclass="p-3" bind:text={defaultSettings.webchatgpt.access_token} label="Access Token" />
			{:else if webChatGPTAuth === 'Session Token'}
				<Textbox textclass="p-3" bind:text={defaultSettings.webchatgpt.session_token} label="Session Token" />
			{/if}

		</SettingsDialog>

		<!-- <SettingsDialog settingsDialog={chatGPTSettingsDialog}>
			<h4 class="text-md font-semibold text-white/80">Client Settings</h4>
			<Textbox textclass="p-3" bind:text={defaultSettings.chatgpt.api_key} placeholder="sk-dh7a..." label="API Key" />
			<Textbox textclass="p-3" bind:text={defaultSettings.chatgpt.system_message} label="System Message">
				<p slot="extra">You can use placeholders in the message such as: [[MODEL]] for the name of the model.</p>
			</Textbox>

			<Listbox listbox={chatGPTSettingsDialogModelPicker} options={AI.ChatGPT.models} enabledAwait={isMounted ? AI.ChatGPT.checkAvaliablity(defaultSettings.chatgpt.api_key) : new Promise((resolve) => resolve({}))}></Listbox>
		</SettingsDialog> -->
	</div>

	<div class="w-[360px] h-full bg-blue-800/10 shadow-lg">
		<Button class="w-full h-20 font-semibold text-lg mb-6" onclick={() => { newChatHandler() }}>New Chat</Button>


		{#each Object.keys(conversations).sort((a, b) => {
			let _a = conversations[a].conversation.lastUpdated
			let _b = conversations[b].conversation.lastUpdated
			if (_a > _b) return -1
			if (_a < _b) return 1
			return 0
		}) as conversationId}
			<Button class="w-full h-28 font-semibold text-lg -mb-2 group" onclick={() => { selectConversation(conversationId) }}>
				<div class="flex flex-row w-full items-center justify-center relative">
					{#if editingTitle[conversationId]}
						<input type="text" class="text-center font-semibold text-lg bg-transparent cursor-pointer h-7" bind:value={editedTitle[conversationId]}>

						<div class="absolute right-2 invisible opacity-0 group-hover:!visible group-hover:!opacity-100 transition-opacity duration-150">
							<!--no button-->
							<button on:click={() => editingTitle[conversationId] = false}>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							  	</svg>
							</button>

							<!--yes button-->
							<button on:click={() => { editingTitle[conversationId] = false; conversations[conversationId].conversation.name = editedTitle[conversationId]}}>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
								</svg>
							</button>
						</div>
					{:else}
						<h1 class="text-center font-semibold text-lg bg-transparent cursor-pointer h-7 overflow-ellipsis overflow-hidden">{conversations[conversationId].conversation.name}</h1>
						<div class="absolute right-2 invisible opacity-0 group-hover:!visible group-hover:!opacity-100 transition-opacity duration-150">
							<!--edit button-->
							<button on:click={() => { editingTitle[conversationId] = true; editedTitle[conversationId] = conversations[conversationId].conversation.name }}>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
								</svg>
							</button>

							<!--delete button-->
							<button on:click={() => deleteConversation(conversationId)}>
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					{/if}
				</div>
				<div class="text-sm font-thin">Last Updated: {$convesationUpdateDates[conversationId].toLocaleDateString()} {$convesationUpdateDates[conversationId].toLocaleTimeString()}</div>
				<div class="text-sm font-thin">Model Used: {conversations[conversationId].aiInstance.name} {conversations[conversationId].aiInstance.nameExtra}</div>
			</Button>
		{/each}
	</div>

	<div class="flex flex-col flex-grow flex-1">
		<header class="w-full h-24 bg-blue-800/[15%] flex items-center justify-center">
			<div class="flex flex-col items-center justify-center">
				<div class="flex flex-row"><h1 class="text-2xl font-bold">Name</h1><h1 class="text-2xl">Here</h1></div>
				<div class="flex flex-row">
					<p>Selected AI: {activeAIName} {activeAINameExtra}</p>
				</div>
			</div>
		</header>

		<div class="flex flex-col flex-grow items-center relative">

			<div id="scroll-chatbox" class="overflow-y-auto overscoll-y-contain snap-proximity snap-y w-full h-[calc(100svh-6rem-2.5rem-0.75rem)] pt-6 pb-6 last:snap-end">
				{#if conversations[selectedConversationId] && conversations[selectedConversationId].aiInstance.primaryType === AI.ModelType.Text}
					<TextConversationPage selectedConversationId={selectedConversationId} />
				{:else}
					<NewChatConversationPage />
				{/if}
			</div>

			<div class="mx-auto w-full max-w-3xl rounded-sm px-3 xl:px-0 flex flex-row left-0 right-0 mb-3 sm:mb-0 z-10" style="bottom: 0px;">
				<div class="relative flex flex-row w-full justify-center items-stretch rounded-lg shadow mb-6">
					<div class="flex gap-2 mb-3 items-stretch justify-center absolute bottom-full w-full"></div>
					<div class="relative">
						<Transition
							show={$aiSelectPopover.expanded}
							enter="ease-out duration-200"
							enterFrom="opacity-0"
							enterTo="opacity-100"
							leave="ease-in duration-150"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<div use:aiSelectPopover.panel style={`transform: translate(0, -${aiSelectBox.yTranslate}px); height: ${aiSelectBox.height}px;`} class={`absolute z-10 rounded-md w-64 bg-white/10 ai-select-box`}>
								<div class="grid grid-rows-2 w-full">
									<AIBox name="ChatGPT" totalAI={getTotalAI()} closePanel={() => selectAI('chatgpt', 'ChatGPT')} openSettings={() => { aiSelectPopover.close(); chatGPTSettingsDialog.open() }} />
									
									<AIBox name="InstructGPT" totalAI={getTotalAI()} closePanel={() => selectAI('instructgpt', 'InstructGPT')} openSettings={() => { aiSelectPopover.close(); instructGPTSettingsDialog.open() }} />
									
									<AIBox name="Web ChatGPT" totalAI={getTotalAI(true)} closePanel={() => selectAI('webchatgpt', 'Web ChatGPT')} openSettings={() => { aiSelectPopover.close(); webChatGPTSettingsDialog.open() }} />
								</div>
							</div>
						</Transition>
		
						<button use:aiSelectPopover.button class="flex items-center w-10 h-10 my-auto ml-2 justify-center absolute left-0 top-0 bottom-0 z-10">
							<svg fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1.5" viewBox="0 0 40 40" class="w-10 h-10 p-2 block transition duration-300 ease-in-out rounded-lg hover:bg-black/30 cursor-pointer hover:shadow"><path d="M37.5324 16.8707C37.9808 15.5241 38.1363 14.0974 37.9886 12.6859C37.8409 11.2744 37.3934 9.91076 36.676 8.68622C35.6126 6.83404 33.9882 5.3676 32.0373 4.4985C30.0864 3.62941 27.9098 3.40259 25.8215 3.85078C24.8796 2.7893 23.7219 1.94125 22.4257 1.36341C21.1295 0.785575 19.7249 0.491269 18.3058 0.500197C16.1708 0.495044 14.0893 1.16803 12.3614 2.42214C10.6335 3.67624 9.34853 5.44666 8.6917 7.47815C7.30085 7.76286 5.98686 8.3414 4.8377 9.17505C3.68854 10.0087 2.73073 11.0782 2.02839 12.312C0.956464 14.1591 0.498905 16.2988 0.721698 18.4228C0.944492 20.5467 1.83612 22.5449 3.268 24.1293C2.81966 25.4759 2.66413 26.9026 2.81182 28.3141C2.95951 29.7256 3.40701 31.0892 4.12437 32.3138C5.18791 34.1659 6.8123 35.6322 8.76321 36.5013C10.7141 37.3704 12.8907 37.5973 14.9789 37.1492C15.9208 38.2107 17.0786 39.0587 18.3747 39.6366C19.6709 40.2144 21.0755 40.5087 22.4946 40.4998C24.6307 40.5054 26.7133 39.8321 28.4418 38.5772C30.1704 37.3223 31.4556 35.5506 32.1119 33.5179C33.5027 33.2332 34.8167 32.6547 35.9659 31.821C37.115 30.9874 38.0728 29.9178 38.7752 28.684C39.8458 26.8371 40.3023 24.6979 40.0789 22.5748C39.8556 20.4517 38.9639 18.4544 37.5324 16.8707ZM22.4978 37.8849C20.7443 37.8874 19.0459 37.2733 17.6994 36.1501C17.7601 36.117 17.8666 36.0586 17.936 36.0161L25.9004 31.4156C26.1003 31.3019 26.2663 31.137 26.3813 30.9378C26.4964 30.7386 26.5563 30.5124 26.5549 30.2825V19.0542L29.9213 20.998C29.9389 21.0068 29.9541 21.0198 29.9656 21.0359C29.977 21.052 29.9842 21.0707 29.9867 21.0902V30.3889C29.9842 32.375 29.1946 34.2791 27.7909 35.6841C26.3872 37.0892 24.4838 37.8806 22.4978 37.8849ZM6.39227 31.0064C5.51397 29.4888 5.19742 27.7107 5.49804 25.9832C5.55718 26.0187 5.66048 26.0818 5.73461 26.1244L13.699 30.7248C13.8975 30.8408 14.1233 30.902 14.3532 30.902C14.583 30.902 14.8088 30.8408 15.0073 30.7248L24.731 25.1103V28.9979C24.7321 29.0177 24.7283 29.0376 24.7199 29.0556C24.7115 29.0736 24.6988 29.0893 24.6829 29.1012L16.6317 33.7497C14.9096 34.7416 12.8643 35.0097 10.9447 34.4954C9.02506 33.9811 7.38785 32.7263 6.39227 31.0064ZM4.29707 13.6194C5.17156 12.0998 6.55279 10.9364 8.19885 10.3327C8.19885 10.4013 8.19491 10.5228 8.19491 10.6071V19.808C8.19351 20.0378 8.25334 20.2638 8.36823 20.4629C8.48312 20.6619 8.64893 20.8267 8.84863 20.9404L18.5723 26.5542L15.206 28.4979C15.1894 28.5089 15.1703 28.5155 15.1505 28.5173C15.1307 28.5191 15.1107 28.516 15.0924 28.5082L7.04046 23.8557C5.32135 22.8601 4.06716 21.2235 3.55289 19.3046C3.03862 17.3858 3.30624 15.3413 4.29707 13.6194ZM31.955 20.0556L22.2312 14.4411L25.5976 12.4981C25.6142 12.4872 25.6333 12.4805 25.6531 12.4787C25.6729 12.4769 25.6928 12.4801 25.7111 12.4879L33.7631 17.1364C34.9967 17.849 36.0017 18.8982 36.6606 20.1613C37.3194 21.4244 37.6047 22.849 37.4832 24.2684C37.3617 25.6878 36.8382 27.0432 35.9743 28.1759C35.1103 29.3086 33.9415 30.1717 32.6047 30.6641C32.6047 30.5947 32.6047 30.4733 32.6047 30.3889V21.188C32.6066 20.9586 32.5474 20.7328 32.4332 20.5338C32.319 20.3348 32.154 20.1698 31.955 20.0556ZM35.3055 15.0128C35.2464 14.9765 35.1431 14.9142 35.069 14.8717L27.1045 10.2712C26.906 10.1554 26.6803 10.0943 26.4504 10.0943C26.2206 10.0943 25.9948 10.1554 25.7963 10.2712L16.0726 15.8858V11.9982C16.0715 11.9783 16.0753 11.9585 16.0837 11.9405C16.0921 11.9225 16.1048 11.9068 16.1207 11.8949L24.1719 7.25025C25.4053 6.53903 26.8158 6.19376 28.2383 6.25482C29.6608 6.31589 31.0364 6.78077 32.2044 7.59508C33.3723 8.40939 34.2842 9.53945 34.8334 10.8531C35.3826 12.1667 35.5464 13.6095 35.3055 15.0128ZM14.2424 21.9419L10.8752 19.9981C10.8576 19.9893 10.8423 19.9763 10.8309 19.9602C10.8195 19.9441 10.8122 19.9254 10.8098 19.9058V10.6071C10.8107 9.18295 11.2173 7.78848 11.9819 6.58696C12.7466 5.38544 13.8377 4.42659 15.1275 3.82264C16.4173 3.21869 17.8524 2.99464 19.2649 3.1767C20.6775 3.35876 22.0089 3.93941 23.1034 4.85067C23.0427 4.88379 22.937 4.94215 22.8668 4.98473L14.9024 9.58517C14.7025 9.69878 14.5366 9.86356 14.4215 10.0626C14.3065 10.2616 14.2466 10.4877 14.2479 10.7175L14.2424 21.9419ZM16.071 17.9991L20.4018 15.4978L24.7325 17.9975V22.9985L20.4018 25.4983L16.071 22.9985V17.9991Z" fill="currentColor"></path></svg>
						</button>
					</div>
					<textarea id="test" contenteditable="true" bind:this={messageArea} on:keypress={e => { if (e.which === 13 && !e.shiftKey) { e.preventDefault(); messageArea.dispatchEvent(new SubmitEvent('submit')) } }} on:submit={sendMessage} bind:value={message} rows="1" placeholder="Send a message..." class="py-4 pl-14 pr-14 rounded-md text-slate-100 w-full bg-white/5 placeholder-white/40 focus:outline-none resize-none placeholder:truncate"></textarea>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
</style>