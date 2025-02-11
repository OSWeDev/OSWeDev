import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ParamsManager from '../../../shared/modules/Params/ParamsManager';
import ParamVO from '../../../shared/modules/Params/vos/ParamVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import { IRequestStackContext } from '../../ServerExpressController';
import StackContext from '../../StackContext';
import ModuleDAOServer from '../DAO/ModuleDAOServer';

export default class ParamsServerController {

    public static UPDATE_PARAM_EVENT_NAME_PREFIX: string = 'UPDATE_PARAM_EVENT_NAME__';

    private static throttled_param_cache_value: { [param_name: string]: any } = {};
    private static throttled_param_cache_lastupdate_ms: { [param_name: string]: number } = {};
    private static semaphore_param: { [param_name: string]: Promise<any> } = {};

    public static get_update_param_event_name(param_name: string): string {
        return ParamsServerController.UPDATE_PARAM_EVENT_NAME_PREFIX + param_name;
    }

    /**
     * DELETE ME Post suppression StackContext: Does not need StackContext
     */
    public static async setParamValue_as_server(param_name: string, param_value: string | number | boolean, exec_as_server: boolean = true) {
        return ParamsServerController._setParamValue(param_name, param_value, exec_as_server);
    }

    /**
     * DELETE ME Post suppression StackContext: Does not need StackContext
     */
    public static async setParamValue(param_name: string, param_value: string | number | boolean) {
        return ParamsServerController._setParamValue(param_name, param_value, !StackContext.get(reflect<IRequestStackContext>().IS_CLIENT));
    }

    /**
     * NEEDS StackContext : DELETE ME Post suppression StackContext
     */
    public static async setParamValue_if_not_exists(param_name: string, param_value: string | number | boolean) {
        let param: ParamVO = await query(ParamVO.API_TYPE_ID).filter_by_text_eq(field_names<ParamVO>().name, param_name, ParamVO.API_TYPE_ID, true).select_vo<ParamVO>();

        if (param) {
            return;
        }

        param = new ParamVO();
        param.name = param_name;
        param.value = param_value as string;
        param.last_up_date = Dates.now();
        return ModuleDAO.instance.insertOrUpdateVO(param);
    }

    /**
     * DELETE ME Post suppression StackContext: Does not need StackContext
     */
    public static async setParamValue_if_not_exists_as_server(param_name: string, param_value: string | number | boolean, exec_as_server: boolean = true) {
        let param: ParamVO = await query(ParamVO.API_TYPE_ID).filter_by_text_eq(field_names<ParamVO>().name, param_name, ParamVO.API_TYPE_ID, true).exec_as_server(exec_as_server).select_vo<ParamVO>();

        if (param) {
            return;
        }

        param = new ParamVO();
        param.name = param_name;
        param.value = param_value as string;
        param.last_up_date = Dates.now();
        return ModuleDAOServer.instance.insertOrUpdateVO_as_server(param, exec_as_server);
    }

    public static async delete_params_cache(vo: ParamVO) {
        delete ParamsServerController.throttled_param_cache_value[vo.name];
        delete ParamsServerController.throttled_param_cache_lastupdate_ms[vo.name];
        delete ParamsServerController.semaphore_param[vo.name];

        // Si on a des preloads params, on les met à jour ou on le supprime
        if (!!ParamsManager.preload_params[vo.name]) {
            // On est sur une suppression, on supprime complètement le param
            if (!vo.id) {
                delete ParamsManager.preload_params[vo.name];
                return;
            }

            // Sinon on met à jour le param
            await ParamsManager.reloadPreloadParam(vo.name);
        }
    }

    /**
     * NEEDS StackContext : DELETE ME Post suppression StackContext
     */
    public static async setParamValueAsBoolean(param_name: string, param_value: boolean): Promise<InsertOrDeleteQueryResult> {
        return ParamsServerController.setParamValue(param_name, param_value ? '1' : '0');
    }

    /**
     * NEEDS StackContext : DELETE ME Post suppression StackContext
     */
    public static async setParamValueAsNumber(param_name: string, param_value: number): Promise<InsertOrDeleteQueryResult> {
        return ParamsServerController.setParamValue(param_name, param_value.toString());
    }

    /**
     * DELETE ME Post suppression StackContext: Does not need StackContext
     */
    public static async getParamValueAsString_as_server(param_name: string, default_if_undefined: string = null, max_cache_age_ms: number = null, exec_as_server: boolean = true): Promise<string> {
        return ParamsServerController.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? param_value : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            exec_as_server);
    }

    /**
     * DELETE ME Post suppression StackContext: Does not need StackContext
     */
    public static async getParamValueAsInt_as_server(param_name: string, default_if_undefined: number = null, max_cache_age_ms: number = null, exec_as_server: boolean = true): Promise<number> {
        return ParamsServerController.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? parseInt(param_value) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            exec_as_server);
    }

    /**
     * DELETE ME Post suppression StackContext: Does not need StackContext
     */
    public static async getParamValueAsBoolean_as_server(param_name: string, default_if_undefined: boolean = false, max_cache_age_ms: number = null, exec_as_server: boolean = true): Promise<boolean> {
        return ParamsServerController.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? (parseInt(param_value) != 0) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            exec_as_server);
    }

    /**
     * DELETE ME Post suppression StackContext: Does not need StackContext
     */
    public static async getParamValueAsFloat_as_server(param_name: string, default_if_undefined: number = null, max_cache_age_ms: number = null, exec_as_server: boolean = true): Promise<number> {
        return ParamsServerController.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? parseFloat(param_value) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            exec_as_server);
    }

    /**
     * NEEDS StackContext : DELETE ME Post suppression StackContext
     */
    public static async getParamValueAsString(param_name: string, default_if_undefined: string = null, max_cache_age_ms: number = null): Promise<string> {
        return ParamsServerController.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? param_value : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            !StackContext.get(reflect<IRequestStackContext>().IS_CLIENT));
    }

    /**
     * NEEDS StackContext : DELETE ME Post suppression StackContext
     */
    public static async getParamValueAsInt(param_name: string, default_if_undefined: number = null, max_cache_age_ms: number = null): Promise<number> {
        return ParamsServerController.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? parseInt(param_value) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            !StackContext.get(reflect<IRequestStackContext>().IS_CLIENT));
    }

    /**
     * NEEDS StackContext : DELETE ME Post suppression StackContext
     */
    public static async getParamValueAsBoolean(param_name: string, default_if_undefined: boolean = false, max_cache_age_ms: number = null): Promise<boolean> {
        return ParamsServerController.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? (parseInt(param_value) != 0) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            !StackContext.get(reflect<IRequestStackContext>().IS_CLIENT));
    }

    /**
     * NEEDS StackContext : DELETE ME Post suppression StackContext
     */
    public static async getParamValueAsFloat(param_name: string, default_if_undefined: number = null, max_cache_age_ms: number = null): Promise<number> {
        return ParamsServerController.getParamValue(
            param_name,
            (param_value: string) => (param_value != null) ? parseFloat(param_value) : default_if_undefined,
            default_if_undefined,
            max_cache_age_ms,
            !StackContext.get(reflect<IRequestStackContext>().IS_CLIENT));
    }

    /**
     * NEEDS StackContext : DELETE ME Post suppression StackContext
     */
    private static async getParamValue(
        text: string,
        transformer: (param_value: string) => any,
        default_if_undefined: string | number | boolean,
        max_cache_age_ms: number,
        exec_as_server: boolean): Promise<any> {

        if (max_cache_age_ms) {
            if (ParamsServerController.throttled_param_cache_lastupdate_ms[text] && (ParamsServerController.throttled_param_cache_lastupdate_ms[text] + max_cache_age_ms > Dates.now_ms())) {
                return ParamsServerController.throttled_param_cache_value[text];
            }
        }

        if (ParamsServerController.semaphore_param[text]) {
            /**
             * Cas d'un param qu'on demande en boucle ou avant le chargement en cours qui initialise le cache.
             *   On attend que le chargement en cours se termine et on retourne la valeur.
             */
            return ParamsServerController.semaphore_param[text];
        }

        ParamsServerController.semaphore_param[text] = new Promise(async (resolve, reject) => {

            let param: ParamVO = null;
            try {
                param = await query(ParamVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<ParamVO>().name, text, ParamVO.API_TYPE_ID, true)
                    .exec_as_server(exec_as_server)
                    .select_vo<ParamVO>();
            } catch (error) {
                ConsoleHandler.error('getParamValue:' + text + ':' + error);
            }
            const res = param ? transformer(param.value) : default_if_undefined;

            ParamsServerController.throttled_param_cache_lastupdate_ms[text] = Dates.now_ms();
            ParamsServerController.throttled_param_cache_value[text] = res;

            delete ParamsServerController.semaphore_param[text];

            resolve(res);
        });
        return ParamsServerController.semaphore_param[text];
    }

    /**
     * NEEDS StackContext : DELETE ME Post suppression StackContext
     */
    private static async _setParamValue(param_name: string, param_value: string | number | boolean, exec_as_server: boolean) {
        let param: ParamVO = await query(ParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<ParamVO>().name, param_name, ParamVO.API_TYPE_ID, true)
            .exec_as_server(exec_as_server)
            .select_vo<ParamVO>();

        if (!param) {
            param = new ParamVO();
            param.name = param_name;
        }
        param.value = param_value as string;
        param.last_up_date = Dates.now();
        return ModuleDAOServer.instance.insertOrUpdateVO_as_server(param, exec_as_server);
    }
}