import * as https from 'https';
import * as http from 'http';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleRequest extends ModuleServerBase {

    public static METHOD_GET: string = "GET";
    public static METHOD_POST: string = "POST";

    public static getInstance() {
        if (!ModuleRequest.instance) {
            ModuleRequest.instance = new ModuleRequest();
        }
        return ModuleRequest.instance;
    }

    private static instance: ModuleRequest = null;

    constructor() {
        super('request');
    }

    public async sendRequestFromApp(method: string, host: string, path: string, posts: {} = null, headers: {} = null, sendHttps: boolean = false): Promise<any> {
        return new Promise((resolve, reject) => {
            const options = {
                host: host,
                path: path,
                method: method,
                headers: headers,
            };
            function callback(res) {
                let result: Buffer[] = [];

                res.on('data', (chunk: Buffer[]) => {
                    result = result.concat(chunk);
                });

                res.on('end', () => {
                    let buffer: Buffer = Buffer.concat(result);

                    try {
                        buffer = JSON.parse(buffer.toString());
                    } catch (e) { }

                    resolve(buffer);
                });
            }

            let request: http.ClientRequest = (sendHttps) ? https.request(options, callback) : http.request(options, callback);

            if (posts) {
                request.write(JSON.stringify(posts));
            }

            request.end();
        });
    }
}