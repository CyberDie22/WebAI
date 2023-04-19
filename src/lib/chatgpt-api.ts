export enum Model {
    GPT35Turbo = 'gpt-3.5-turbo',
    GPT4 = 'gpt-4',
    GPT432K = 'gpt-4-32k'
}
export const models: Model[] = [Model.GPT35Turbo, Model.GPT4, Model.GPT432K];
export const reverseModel: { [key: string]: Model } = {
    'gpt-3.5-turbo': Model.GPT35Turbo,
    'gpt-4': Model.GPT4,
    'gpt-4-32k': Model.GPT432K,
}

export type MessageRole = 'user' | 'assistant' | 'system';
export class Message {
    content: string;
    role: MessageRole;

    constructor(content: string, role: MessageRole) {
        this.content = content;
        this.role = role;
    }

    countTokens(model: Model): number {
        return this.content.split(" ").length * 4; // TODO: implement this
    }
}

export class Conversation {
    messages: Message[];
    onmessageupdate: () => void;
    
    constructor(messages: Message[] = [], onmessageupdate: () => void = () => {}) {
        this.messages = messages;
        this.onmessageupdate = onmessageupdate;
    }

    addMessage(message: Message) {
        this.messages.push(message)
        this.onmessageupdate();
    }

    countTokens(model: Model): number {
        return this.messages.reduce((total, message) => total + message.countTokens(model), 0);
    }
}

export class Chatbot {
    api_key: string;
    model: Model;
    temperature: number;
    top_p: number;
    max_tokens: number;
    token_truncate_limit: number;
    frequency_penalty: number;
    presence_penalty: number;
    system_message: string;
    onmessageupdate: () => void;
    headers: any;
    conversation: Conversation = new Conversation();

    constructor(options: {
            api_key: string,
            model: Model,
            temperature?: number,
            top_p?: number,
            max_tokens?: number,
            frequency_penalty?: number,
            presence_penalty?: number,
            system_message?: string,
            onmessageupdate?: () => void,
        }
    ) {
        this.api_key = options.api_key;
        this.model = options.model;
        this.temperature = options.temperature || 0.7;
        this.top_p = options.top_p || 1;
        if (options.max_tokens === Infinity) options.max_tokens = undefined
        this.max_tokens = options.max_tokens || (
            this.model === Model.GPT432K ? 32768 : (this.model === Model.GPT4 ? 8192 : 4096)
        );
        this.token_truncate_limit = this.max_tokens < 256 ? this.max_tokens : this.max_tokens - 256
        this.frequency_penalty = options.frequency_penalty || 0.0;
        this.presence_penalty = options.presence_penalty || 0.0;
        this.system_message = options.system_message || 'You are ChatGPT, a large language model from OpenAI. Always annotate all code blocks with the language contained in them. Respond conversationally';
        this.onmessageupdate = options.onmessageupdate || (() => {});

        this.headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.api_key}`,
        }

        this.reset();

        try {
            this.setAPIKey(this.api_key);
        } catch (e) {
            // console.error(e);
        }
    }

    setAPIKey(api_key: string) {
        this.api_key = api_key;
        this.headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.api_key}`,
        }

        this.checkAuth().then(res => {
            if (!res) {
                throw new Error('Invalid API key');
            }

            this.checkModel().then(res => {
                if (!res) {
                    throw new Error('Invalid model');
                }
            }).catch(e => { })
        }).catch(e => { })
    }

    async checkAuth(): Promise<boolean> {
        let res = await fetch('https://api.openai.com/v1/models', { headers: this.headers }).catch(() => { return false });
        if (res === false || res === true) { return res }
        return res.status === 200;
    }

    async checkModel(): Promise<boolean> {
        let res = await fetch(`https://api.openai.com/v1/models/${this.model}`, { headers: this.headers }).catch(() => { return false });
        if (res === false || res === true) { return res }
        return res.status === 200;
    }

    reset(model: Model | undefined = undefined, system_message: string | undefined = undefined) {
        if (!model) {
            model = this.model;
        }

        if (!system_message) {
            system_message = this.system_message;
        }

        this.conversation = new Conversation([
            new Message(system_message, 'system'),
        ], this.onmessageupdate);
        this.model = model;
    }

    private truncateConversation() {
        while (this.conversation.countTokens(this.model) > this.token_truncate_limit && this.conversation.messages.length > 1) {
            let first = this.conversation.messages.shift() as Message; // guarenteed to exist
            this.conversation.messages.shift()
            this.conversation.messages.unshift(first);
        }
    }

    getMaxTokens(): number {
        return this.max_tokens - this.conversation.countTokens(this.model);
    }

    async askStream(message: string, callback: (chunk: string) => void, role: MessageRole = 'user'): Promise<string> {
        console.log("got message", message)
        this.conversation.addMessage(new Message(message, role));
        this.truncateConversation();

        let data = {
            "model": this.model,
            "messages": this.conversation.messages.map(message => { return { "content": message.content, "role": message.role } }),
            "temperature": this.temperature,
            "top_p": this.top_p,
            "max_tokens": this.getMaxTokens(),
            "frequency_penalty": this.frequency_penalty,
            "presence_penalty": this.presence_penalty,
            "stream": true,
        }

        let res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: this.headers, body: JSON.stringify(data) })

        if (res.status !== 200 || !res.body) {
            throw new Error('API request failed (status ' + res.status + ') - ' + await res.text());
        }

        let responseRole: MessageRole | undefined = undefined;
        let fullMessage: string = ""

        let reader = res.body.getReader();
        let decoder = new TextDecoder('utf-8');

        while (true) {
            let { done, value } = await reader.read();
            console.log(done, value)

            if (done) {
                break;
            }

            if (value) {
                let manyChunks = decoder.decode(value, { stream: true })
                console.log(manyChunks)

                for (let chunk of manyChunks.split("\n")) {
                    chunk = chunk.substring(6)
                    if (chunk === "[DONE]") break
                    if (chunk === "") continue

                    console.log(chunk)

                    let resJson: any

                    try {
                        resJson = JSON.parse(chunk)
                    } catch (e) {
                        console.log("Error parsing JSON: " + e + " (chunk: " + chunk + ")");
                        continue
                    }
                    
                    if (!resJson.choices) continue
                    let choices = resJson.choices

                    if (choices.length === 0 && !choices[0].delta) continue
                    let delta = choices[0].delta

                    if (delta.role) {
                        responseRole = delta.role
                    }

                    if (delta.content) {
                        fullMessage += delta.content
                        
                        console.log("Calling callback with: " + delta.content.replace(/\n/g, "\\n"))
                        callback(delta.content)
                    }
                }
            }
        }

        this.conversation.addMessage(new Message(fullMessage, responseRole as MessageRole));
        return fullMessage;
    }

    async ask(message: string, role: MessageRole = 'user'): Promise<string> {
        let fullMessage = await this.askStream(message, (_: string) => {}, role)
        return fullMessage;
    }
}