/* istanbul ignore file: only one method, and not willing to test it right now*/

import { Request } from 'express';
import IServerUserSession from '../shared/modules/AccessPolicy/vos/IServerUserSession';
import UserAPIVO from '../shared/modules/AccessPolicy/vos/UserAPIVO';
import UserVO from '../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../shared/tools/ObjectHandler';

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

        const apiKey = req.headers['x-api-key'] as string;

        if (!apiKey) {
            return {
                IS_CLIENT: true,
                REFERER: req.headers.referer,
                UID: session.uid,
                SESSION: session,
                CLIENT_TAB_ID: req.headers.client_tab_id,
                SELF_USER: (session.user_vo && session.user_vo.id) ?
                    // On rafraîchi souvent l'info, mais pas dans la milliseconde non plus...
                    await query(UserVO.API_TYPE_ID).filter_by_id(session.user_vo.id).set_max_age_ms(100).exec_as_server().select_vo<UserVO>() :
                    null,
            };
        }

        // Vérifier la clé d'API ici. Exemple :
        const exist_user_vo: UserVO = await query(UserVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<UserAPIVO>().api_key, apiKey, UserAPIVO.API_TYPE_ID)
            .exec_as_server()
            .set_max_age_ms(100)
            .select_vo<UserVO>();

        if (!exist_user_vo) {
            return {
                IS_CLIENT: true,
                REFERER: req.headers.referer,
                UID: null,
                SESSION: session,
                CLIENT_TAB_ID: null,
                SELF_USER: null
            };
        }

        return {
            IS_CLIENT: true,
            REFERER: req.headers.referer,
            UID: exist_user_vo.id,
            SESSION: session,
            CLIENT_TAB_ID: null,
            SELF_USER: exist_user_vo
        };
    }
}
