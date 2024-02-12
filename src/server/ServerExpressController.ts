/* istanbul ignore file: only one method, and not willing to test it right now*/

import { Request } from 'express';
import IServerUserSession from '../shared/modules/AccessPolicy/vos/IServerUserSession';
import UserVO from '../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../shared/modules/ContextFilter/vos/ContextQueryVO';

export default class ServerExpressController {

    // istanbul ignore next: nothing to test
    public static getInstance(): ServerExpressController {
        if (!ServerExpressController.instance) {
            ServerExpressController.instance = new ServerExpressController();
        }
        return ServerExpressController.instance;
    }

    private static instance: ServerExpressController = null;

    private constructor() { }

    public async getStackContextFromReq(req: Request, session: IServerUserSession) {
        return {
            IS_CLIENT: true,
            REFERER: req.headers.referer,
            UID: session.uid,
            SESSION: session,
            CLIENT_TAB_ID: req.headers.client_tab_id,
            SELF_USER: (session.user_vo && session.user_vo.id) ?
                // On rafraîchi souvent l'info, mais pas dans la milliseconde non plus...
                await query(UserVO.API_TYPE_ID).filter_by_id(session.user_vo.id).set_max_age_ms(100).exec_as_server().select_vo<UserVO>() :
                // await query(UserVO.API_TYPE_ID).filter_by_id(session.user_vo.id).exec_as_server().select_vo<UserVO>() :
                null,
        };
    }
}
