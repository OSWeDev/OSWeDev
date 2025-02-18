/* istanbul ignore file: only one method, and not willing to test it right now*/

import { Request } from 'express';
import UserAPIVO from '../shared/modules/AccessPolicy/vos/UserAPIVO';
import UserVO from '../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../shared/tools/ObjectHandler';
import { RunsOnBgThread } from './modules/BGThread/annotations/RunsOnBGThread';

export interface IRequestStackContext {
    IS_CLIENT: boolean;
    REFERER: string;
    UID: number;
    SESSION_ID: string;
    SID: string;
    CLIENT_TAB_ID: string;
    CONTEXT_INCOMPATIBLE?: boolean; // Dans le cas où un fonctionnement est incompatible avec le contexte, on peut le désactiver et on indique pourquoi
    CONTEXT_INCOMPATIBLE_REASON?: string; // Dans le cas où un fonctionnement est incompatible avec le contexte, on peut le désactiver et on indique pourquoi
}

export default class ServerExpressController {

    private static instance: ServerExpressController = null;

    private constructor() { }

    // istanbul ignore next: nothing to test
    public static getInstance(): ServerExpressController {
        if (!ServerExpressController.instance) {
            ServerExpressController.instance = new ServerExpressController();
        }
        return ServerExpressController.instance;
    }

    /**
     * INFO : Nom du BGTHREAD en dur pour des pbs de dépendances circulaires
     * et on peut lancer en local si le bgthread est pas encore dispo
     * @param api_key
     * @returns
     */
    @RunsOnBgThread('APIBGThread', ServerExpressController.getInstance, true)
    private async get_user_by_api_key(api_key: string): Promise<UserVO> {
        return query(UserVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<UserAPIVO>().api_key, api_key, UserAPIVO.API_TYPE_ID)
            .exec_as_server()
            .set_max_age_ms(1000)
            .select_vo<UserVO>();
    }

    public async getStackContextFromReq(
        req: Request,
        session_id: string,
        sid: string,
        uid: number,
    ): Promise<IRequestStackContext> {

        const apiKey = req.headers['x-api-key'] as string;
        const client_tab_id = req.headers.client_tab_id as string;
        const referrer = req.headers.referer as string;

        if (!apiKey) {
            return {
                IS_CLIENT: true,
                REFERER: referrer,
                UID: uid,
                SESSION_ID: session_id,
                SID: sid,
                CLIENT_TAB_ID: client_tab_id,
            };
        }

        // Vérifier la clé d'API ici. Exemple :
        const exist_user_vo: UserVO = await this.get_user_by_api_key(apiKey);

        if (!exist_user_vo) {
            return {
                IS_CLIENT: true,
                REFERER: referrer,
                UID: null,
                SID: sid,
                CLIENT_TAB_ID: client_tab_id,
                SESSION_ID: session_id,
            };
        }

        return {
            IS_CLIENT: true,
            REFERER: referrer,
            UID: exist_user_vo.id,
            SID: sid,
            CLIENT_TAB_ID: client_tab_id,
            SESSION_ID: session_id,
        };
    }
}
