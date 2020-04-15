import * as http from 'http';
import * as https from 'https';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import SendRequestParamVO from '../../../shared/modules/Request/vos/SendRequestParamVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleRequestServer extends ModuleServerBase {

    public static METHOD_GET: string = "GET";
    public static METHOD_POST: string = "POST";

    public static getInstance() {
        if (!ModuleRequestServer.instance) {
            ModuleRequestServer.instance = new ModuleRequestServer();
        }
        return ModuleRequestServer.instance;
    }

    private static instance: ModuleRequestServer = null;

    constructor() {
        super(ModuleRequest.getInstance().name);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleRequest.APINAME_sendRequestFromApp, this.sendRequestFromApp.bind(this));
    }

    public async sendRequestFromApp(param: SendRequestParamVO): Promise<any> {

        if (!param) {
            return null;
        }

        let method: string = param.method;
        let host: string = param.host;
        let path: string = param.path;
        let posts: {} = param.posts;
        let headers: {} = param.headers;
        let sendHttps: boolean = param.sendHttps;

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
                    } catch (e) {
                        ConsoleHandler.getInstance().error(e);
                    }

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