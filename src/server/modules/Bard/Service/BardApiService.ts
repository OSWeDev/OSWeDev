import { load } from "cheerio";
import vm from "vm";

import fetch, { FetchFn } from "../../../../shared/Fetch";

export interface IConversation {
    request_id: string;
    conversation_id: string;
    response_id: string;
    responses?: string[];
}

/**
 * TODO: search in https://github.com/googleapis/google-api-nodejs-client/tree/main/src/apis
 */
export default class BardApiService {

    public static readonly BARD_API_URL: string = 'https://bard.google.com';

    public static getInstance(): BardApiService {
        if (!BardApiService.instance) {
            BardApiService.instance = new BardApiService();
        }

        return BardApiService.instance;
    }

    private static instance: BardApiService = null;

    private _fetch: FetchFn = null;
    private _headers: any = null;

    private constructor() {
        this._fetch = fetch;

        this._headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "TE": "trailers",
        };
    }

    /**
     * ask
     *
     * @param cookies
     * @param prompt
     * @param conversation
     * @returns {Promise<{response_1: string, response_2: string, response_3: string}>}
     */
    public async ask(cookies: string, prompt: string, conversation: IConversation): Promise<IConversation> {

        conversation = await this.send_message(cookies, prompt, conversation);

        return conversation;
    }

    /**
     * send_message
     *
     * @param cookies
     * @param prompt
     * @param conversation
     * @returns {Promise<IConversation>}
     */
    public async send_message(cookies: string, prompt: string, conversation: IConversation): Promise<IConversation> {
        const url = `${BardApiService.BARD_API_URL}/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate`;
        const { at, bl } = await this.get_request_params(cookies);

        const headers: any = {
            ...this._headers,
            Cookie: cookies,
        };

        const conversation_req = conversation?.conversation_id ?
            JSON.stringify([conversation?.conversation_id, conversation?.request_id, conversation?.response_id]) :
            "null";

        const f_req = JSON.stringify([null, `[[${JSON.stringify(prompt)}],null,${conversation_req}]`]);

        try {
            const res = await this._fetch(
                `${url}` + `?bl=${bl}&rt=c&_reqid=0`,
                {
                    method: 'POST',
                    headers,
                    body: new URLSearchParams({
                        "at": at,
                        "f.req": f_req,
                    }),
                }
            );

            if (!res.ok) {
                const reason = await res.text();
                const msg = `Bard error ${res.status || res.statusText}: ${reason}`;
                throw new Error(msg);
            }

            const response = await res.text();

            const parsed_response = this.parse_response(response);

            conversation.conversation_id = parsed_response.conversation_id;
            conversation.request_id = parsed_response.request_id;
            conversation.response_id = parsed_response.response_id;
            conversation.responses = [
                parsed_response.responses[3],
                parsed_response.responses[6],
                parsed_response.responses[9]
            ];

            return conversation;
        } catch (e: any) {
            console.error(e.message);
        }

        return null;
    }

    /**
     * get_request_params
     */
    private async get_request_params(cookies: string) {
        const headers: any = {
            ...this._headers,
            Cookie: cookies,
        };

        let at: string = "";
        let bl: string = "";

        try {
            const res = await this._fetch(`${BardApiService.BARD_API_URL}`, {
                method: 'GET',
                headers,
            });

            if (!res.ok) {
                const reason = await res.text();
                const msg = `Bard error ${res.status || res.statusText}: ${reason}`;
                throw new Error(msg);
            }

            const response = await res.text();

            const $ = load(response);

            const html = $("script[data-id=_gd]").html();
            const script = html.replace("window.WIZ_global_data", "googleData");

            const context = { googleData: { cfb2h: "", SNlM0e: "" } };
            vm.createContext(context);
            vm.runInContext(script, context);

            at = context.googleData.SNlM0e;
            bl = context.googleData.cfb2h;

        } catch (e: any) {
            throw new Error(
                `Error parsing response: make sure you are using the correct cookie, ` +
                `copy the value of "__Secure-1PSID" cookie and set it like this: \n\n ` +
                `new Bard("__Secure-1PSID=<COOKIE_VALUE>")\n\n ` +
                `Also using a US proxy is recommended.`
            );
        }

        return { at, bl };
    }

    private parse_response(text: string) {
        let res_data = {
            request_id: "",
            conversation_id: "",
            response_id: "",
            responses: [],
        };

        try {
            const parse_data = (data: string) => {
                if (typeof data === "string") {
                    if (data?.startsWith("c_")) {
                        res_data.conversation_id = data;
                        return;
                    }
                    if (data?.startsWith("r_")) {
                        res_data.request_id = data;
                        return;
                    }
                    if (data?.startsWith("rc_")) {
                        res_data.response_id = data;
                        return;
                    }
                    res_data.responses.push(data);
                }

                if (Array.isArray(data)) {
                    data.forEach((item) => {
                        parse_data(item);
                    });
                }
            };

            try {
                const lines = text.split("\n");

                for (const i in lines) {
                    const line = lines[i];

                    if (line.includes("wrb.fr")) {
                        const data = JSON.parse(line);

                        const responses_data = JSON.parse(data[0][2]);
                        responses_data.forEach((response) => {
                            parse_data(response);
                        });
                    }
                }

            } catch (e: any) {
                throw new Error(
                    `Error parsing response: make sure you are using the correct cookie, ` +
                    `copy the value of "__Secure-1PSID" cookie and set it like this: \n\n ` +
                    `new Bard("__Secure-1PSID=<COOKIE_VALUE>")\n\n ` +
                    `Also using a US proxy is recommended.\n\n `
                );
            }
        } catch (err) {
            throw new Error(
                `Error parsing response: make sure you are using the correct cookie, ` +
                `copy the value of "__Secure-1PSID" cookie and set it like this: \n\n ` +
                `new Bard("__Secure-1PSID=<COOKIE_VALUE>")\n\n ` +
                `Also using a US proxy is recommended.\n\n `
            );
        }

        return res_data;
    }
}