/* istanbul ignore file: only one method, and not willing to test it right now*/

import { Request } from 'express';
import IServerUserSession from './IServerUserSession';

export default class ServerExpressController {

    public static getInstance(): ServerExpressController {
        if (!ServerExpressController.instance) {
            ServerExpressController.instance = new ServerExpressController();
        }
        return ServerExpressController.instance;
    }

    private static instance: ServerExpressController = null;

    private constructor() { }

    public getStackContextFromReq(req: Request, session: IServerUserSession) {
        return {
            IS_CLIENT: true,
            REFERER: req.headers.referer,
            UID: session.uid,
            SESSION: session,
            CLIENT_TAB_ID: req.headers.client_tab_id
        };
    }
}
