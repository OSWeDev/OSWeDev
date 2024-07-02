import http from 'http';
import https from 'https';
import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import ModuleRequest from '../../../shared/modules/Request/ModuleRequest';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleServerBase from '../ModuleServerBase';

export default class ModuleRequestServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
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

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleRequest.APINAME_sendRequestFromApp, this.sendRequestFromApp.bind(this));
    }

    /**
     * /!\ Pour du POST, il faut ajouter Content-Length dans le header
     * Sinon ça ne marche pas dans certain cas
     * @param method
     * @param host
     * @param path
     * @param posts
     * @param headers
     * @param sendHttps
     * @param result_headers
     * @param nojsonparse
     * @param add_content_length_to_headers Que pour les POST
     * @returns
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
        add_content_length_to_headers: boolean = false,
        json_stringify_posts: boolean = true
    ): Promise<any> {

        return new Promise((resolve, reject) => {
            if (!headers) {
                headers = {};
            }

            const options = {
                host: host,
                path: path,
                method: method,
                headers: headers,
            };

            let dataPosts: any = posts;

            if (json_stringify_posts) {
                dataPosts = dataPosts ? JSON.stringify(dataPosts) : null;
            }

            // // Pour plus de compatibilité (avec Teams notamment) => mais incompatible avec lenvoi de SMS sur sendinblue...
            if (add_content_length_to_headers && ((method == ModuleRequest.METHOD_POST) || (method == ModuleRequest.METHOD_PATCH)) && !!dataPosts && (dataPosts.length > 0)) {
                // .byteLength pour avoir la gestion des caractères spéciaux tel que les accents
                headers['Content-Length'] = Buffer.byteLength(dataPosts);
            }

            function callback(res: http.IncomingMessage) {

                if (res.statusCode >= 400) {
                    reject({ message: 'Request failed with status code ' + res.statusCode, headers: res.headers });
                    ConsoleHandler.error('Request failed with status code ' + res.statusCode + ' : ' + path + ' : ' + JSON.stringify(res.headers));
                    return;
                }

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

                    if (result_headers) {
                        resolve({ datas: buffer, headers: result_headers });
                        return;
                    }

                    resolve(buffer);
                });

                if ((!!result_headers) && (!!res.headers)) {
                    for (const i in res.headers) {
                        const header = res.headers[i];

                        result_headers[i] = header;
                    }
                }
            }

            const request: http.ClientRequest = (sendHttps) ? https.request(options, callback) : http.request(options, callback);
            request.on('error', (e) => {
                ConsoleHandler.error('Request failed with error ' + e.message);
                reject(new Error('Network error: ' + e.message));
            });

            if (dataPosts) {
                request.write(dataPosts);
            }

            request.end();
        });
    }
}