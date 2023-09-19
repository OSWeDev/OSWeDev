import fetch from "../../../../shared/Fetch";

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

    private _fetch: any = null;

    private constructor() {
        this._fetch = fetch;
    }

    public async get_conversation(user_id: number, access_token: string): Promise<any> {
        return null;
    }

    public async send_message(user_id: number, access_token: string, message: string): Promise<any> {
        const url = `${BardApiService.BARD_API_URL}/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate`;




        return null;
    }

    // private async send

    /**
     * parse_response
     *
     * @param {string} text
     * @returns {{ request_id: string, conversation_id: string, response_id: string, responses: string[] }}
     */
    private parse_response(text: string): { request_id: string, conversation_id: string, response_id: string, responses: string[] } {
        let response_lines = {
            request_id: "",
            conversation_id: "",
            response_id: "",
            responses: [],
        };

        try {
            const lines = text.split("\n");

            for (let i in lines) {
                const line = lines[i];

                if (line.includes("wrb.fr")) {
                    let data = JSON.parse(line);
                    let responsesData = JSON.parse(data[0][2]);

                    response_lines = responsesData.map((response) => {
                        return this.parse_response_line(response);
                    });
                }

            }
        } catch (e: any) {
            throw new Error(
                `Error parsing response: make sure you are using the correct cookie, ` +
                `copy the value of "__Secure-1PSID" cookie and set it like this: \n\nnew ` +
                `Bard("__Secure-1PSID=<COOKIE_VALUE>")\n\nAlso using a US proxy is recommended.\n\n ` +
                `If this error persists, please open an issue on github.\n ` +
                `https://github.com/PawanOsman/GoogleBard`
            );
        }

        return response_lines;
    }


    /**
     * parse_response_line
     *
     * @param {string | string[]} line
     * @param response_line
     * @returns {{ request_id: string, conversation_id: string, response_id: string, responses: string[] }}
     */
    private parse_response_line(
        line: string | string[],
        response_line = {
            request_id: "",
            conversation_id: "",
            response_id: "",
            responses: [],
        }
    ): { request_id: string, conversation_id: string, response_id: string, responses: string[] } {

        try {
            if (typeof line === "string") {
                if (line?.startsWith("c_")) {
                    response_line.conversation_id = line;
                    return;
                }
                if (line?.startsWith("r_")) {
                    response_line.request_id = line;
                    return;
                }
                if (line?.startsWith("rc_")) {
                    response_line.response_id = line;
                    return;
                }

                response_line.responses.push(line);
            }

            if (Array.isArray(line)) {
                line.map((item) => {
                    this.parse_response_line(item, response_line);
                });
            }
        } catch (err) {
            throw new Error(
                `Error parsing response: make sure you are using the correct cookie, ` +
                `copy the value of "__Secure-1PSID" cookie and set it like this: \n\n ` +
                `new Bard("__Secure-1PSID=<COOKIE_VALUE>")\n\nAlso using a US proxy is ` +
                `recommended.\n\nIf this error persists, please open an issue on ` +
                `github.\nhttps://github.com/PawanOsman/GoogleBard`
            );
        }

        return response_line;
    }

}