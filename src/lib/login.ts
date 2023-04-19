export class OpenAIChatAuth {
    authURL: string;
    options: ConstructorParameters<typeof OpenAIChatAuth>[1];
    
    constructor(authURL: string, options: { accessToken?: string, sessionToken?: string, puid?: string }) {
        this.authURL = authURL;
        this.options = options;
    }

    async request(method: string, path: string, body?: any): ReturnType<typeof fetch> {
        let headers: Record<string, string> = {
            "Accept": "text/event-stream",
            "Authorization": "Bearer " + this.options.accessToken,
            "Content-Type": "application/json",
            // "X-OpenAI-Assistant-App-Id": "",
            "Connection": "close",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://chat.openai.com/chat",
        }
        let cookies: Record<string, string> = {
            "library": "revChatGPT"
        }
        if (this.options.puid !== '') cookies["_puid"] = this.options.puid as string

        headers["Cookie"] = ""
        for (let key in cookies) {
            headers["Cookie"] += key + "=" + cookies[key] + ";"
        }

        return fetch(this.authURL + path, {
            method: method,
            body: body,
            headers: headers
        })
    }

    async login(): Promise<void> {
        if (this.options.accessToken !== '') return // already logged in

        if (this.options.sessionToken !== '') {
            // login with session token
            let headers = {
                "Referer": "https://chat.openai.com/",
                "Cookies": "__Secure-next-auth.session-token=" + this.options.sessionToken + ";"
            }

            let response = await fetch(this.authURL.substring(0, this.authURL.lastIndexOf("/")) + "/auth/session", { headers: headers })
            let data = await response.json().catch((_) => { throw new Error("Failed to parse JSON") })
            this.options.accessToken = data.accessToken
            return
        }

        // TODO: login with username and password
        // TODO: login with Google
        // TODO: login with Microsoft
    }
}

// TODO: Google auth
// TODO: Microsoft auth