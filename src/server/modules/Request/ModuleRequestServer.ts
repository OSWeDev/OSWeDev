import * as http from 'http';
import * as https from 'https';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
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
        APIControllerWrapper.getInstance().registerServerApiHandler(ModuleRequest.APINAME_sendRequestFromApp, this.sendRequestFromApp.bind(this));
    }

    public async sendRequestFromApp(
        method: string,
        host: string,
        path: string,
        posts: {} = null,
        headers: {} = null,
        sendHttps: boolean = false
    ): Promise<any> {

        return new Promise((resolve, reject) => {
            const options = {
                host: host,
                path: path,
                method: method,
                headers: headers,
            };

            // // Pour plus de compatibilité (avec Teams notamment) => mais incompatible avec lenvoi de SMS sur sendinblue...
            // if ((method.toLowerCase() == 'post') && ((!headers) || (!headers['Content-Length'])) && !!posts) {
            //     headers['Content-Length'] = JSON.stringify(posts).length;
            // }

            function callback(res) {
                let result: Buffer[] = [];

                res.on('data', (chunk: Buffer[]) => {
                    result = result.concat(chunk);
                });

                res.on('end', () => {
                    let buffer: Buffer = Buffer.concat(result);

                    if (buffer && buffer.length > 0) {
                        try {
                            buffer = JSON.parse(buffer.toString());
                        } catch (e) {
                            ConsoleHandler.getInstance().error(e);
                        }
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