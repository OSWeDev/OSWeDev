/* istanbul ignore file: only one method, and not willing to test it right now*/

import { Request } from 'express';
import IServerUserSession from '../shared/modules/AccessPolicy/vos/IServerUserSession';
import UserAPIVO from '../shared/modules/AccessPolicy/vos/UserAPIVO';
import UserVO from '../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../shared/tools/ObjectHandler';
import APIBGThread from './modules/API/bgthreads/APIBGThread';
import ForkedTasksController from './modules/Fork/ForkedTasksController';

export default class ServerExpressController {

    private static get_self_user_for_stack_context_task_name: string = 'ServerExpressController.get_self_user_for_stack_context_task_name';
    private static get_user_by_api_key_task_name: string = 'ServerExpressController.get_user_by_api_key_task_name';
    private static instance: ServerExpressController = null;

    private constructor() {
        ForkedTasksController.register_task(ServerExpressController.get_self_user_for_stack_context_task_name, this.get_self_user_for_stack_context_task_name.bind(this));
        ForkedTasksController.register_task(ServerExpressController.get_user_by_api_key_task_name, this.get_user_by_api_key.bind(this));
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ServerExpressController {
        if (!ServerExpressController.instance) {
            ServerExpressController.instance = new ServerExpressController();
        }
        return ServerExpressController.instance;
    }

    public async getStackContextFromReq(
        req: Request,
        session: IServerUserSession,
        filter_for_execution_on_bgthread: boolean = false
    ) {

        const apiKey = req.headers['x-api-key'] as string;

        if (!apiKey) {

            // On rafraîchi souvent l'info, mais pas dans la milliseconde non plus...
            const user = (session.user_vo && session.user_vo.id) ?
                await ForkedTasksController.exec_task_on_bgthread_and_return_value(
                    APIBGThread.BGTHREAD_name,
                    ServerExpressController.get_self_user_for_stack_context_task_name,
                    session.user_vo.id
                ) : null;
            return {
                IS_CLIENT: true,
                REFERER: req.headers.referer,
                UID: session ? session.uid : null,
                SID: session ? session.sid : null,
                SESSION: filter_for_execution_on_bgthread ? null : session,
                CLIENT_TAB_ID: req.headers.client_tab_id,
                SELF_USER: user,
            };
        }

        // Vérifier la clé d'API ici. Exemple :
        const exist_user_vo: UserVO = await ForkedTasksController.exec_task_on_bgthread_and_return_value(
            APIBGThread.BGTHREAD_name,
            ServerExpressController.get_user_by_api_key_task_name,
            apiKey
        );

        if (!exist_user_vo) {
            return {
                IS_CLIENT: true,
                REFERER: req.headers.referer,
                UID: null,
                SID: session ? session.sid : null,
                SESSION: filter_for_execution_on_bgthread ? null : session,
                CLIENT_TAB_ID: null,
                SELF_USER: null
            };
        }

        return {
            IS_CLIENT: true,
            REFERER: req.headers.referer,
            UID: exist_user_vo.id,
            SID: session ? session.sid : null,
            SESSION: filter_for_execution_on_bgthread ? null : session,
            CLIENT_TAB_ID: null,
            SELF_USER: exist_user_vo
        };
    }

    private async get_self_user_for_stack_context_task_name(uid: number): Promise<UserVO> {
        return await query(UserVO.API_TYPE_ID).filter_by_id(uid).set_max_age_ms(1000).exec_as_server().select_vo<UserVO>();
    }

    private async get_user_by_api_key(api_key: string): Promise<UserVO> {
        return await query(UserVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<UserAPIVO>().api_key, api_key, UserAPIVO.API_TYPE_ID)
            .exec_as_server()
            .set_max_age_ms(1000)
            .select_vo<UserVO>();
    }
}
