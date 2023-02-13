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

    /**
     * Pour du POST, il faut ajouter Content-Length dans le header
     * Sinon ça ne marche pas dans certain cas
     */
    public async sendRequestFromApp(
        method: string,
        host: string,
        path: string,
        posts: {} = null,
        headers: {} = null,
        sendHttps: boolean = false,
        result_headers: {} = null,
        nojsonparse: boolean = false,
        add_content_length_to_headers: boolean = false // Que pour les POST
    ): Promise<any> {

        return new Promise((resolve, reject) => {
            const options = {
                host: host,
                path: path,
                method: method,
                headers: headers,
            };

            let dataPosts: any = posts ? JSON.stringify(posts) : null;

            // // Pour plus de compatibilité (avec Teams notamment) => mais incompatible avec lenvoi de SMS sur sendinblue...
            if (add_content_length_to_headers && (method == ModuleRequest.METHOD_POST) && !!dataPosts && (dataPosts.length > 0)) {
                headers['Content-Length'] = dataPosts.length;
            }

            function callback(res: http.IncomingMessage) {
                let result: Buffer[] = [];

                res.on('data', (chunk: Buffer[]) => {
                    result = result.concat(chunk);
                });

                res.on('end', () => {
                    let buffer: Buffer = Buffer.concat(result);

                    if (!nojsonparse) {
                        if (buffer && buffer.length > 0) {
                            try {
                                buffer = JSON.parse(buffer.toString());
                            } catch (e) {
                                ConsoleHandler.error(e + ' : sendRequestFromApp full response buffer : ' + buffer.toString());
                            }
                        }
                    }

                    if (!!result_headers) {
                        resolve({ datas: buffer, headers: result_headers });
                        return;
                    }

                    resolve(buffer);
                });

                if ((!!result_headers) && (!!res.headers)) {
                    for (let i in res.headers) {
                        let header = res.headers[i];

                        result_headers[i] = header;
                    }
                }
            }

            let request: http.ClientRequest = (sendHttps) ? https.request(options, callback) : http.request(options, callback);

            if (dataPosts) {
                request.write(dataPosts);
            }

            request.end();
        });
    }
}