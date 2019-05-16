import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import { IHookFilterVos } from '../../../shared/modules/DAO/interface/IHookFilterVos';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import APIDAOParamVO from '../../../shared/modules/DAO/vos/APIDAOParamVO';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../shared/modules/ModuleTable';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';
import BooleanHandler from '../../../shared/tools/BooleanHandler';
import ServerBase from '../../ServerBase';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import DAOTriggerHook from './triggers/DAOTriggerHook';
import ModuleTrigger from '../../../shared/modules/Trigger/ModuleTrigger';
import APIDAOParamsVO from '../../../shared/modules/DAO/vos/APIDAOParamsVO';

export default class ModuleDAOServer extends ModuleServerBase {

    public static DAO_ACCESS_TYPE_CREATE: string = "CREATE";
    public static DAO_ACCESS_TYPE_READ: string = "READ";
    public static DAO_ACCESS_TYPE_UPDATE: string = "UPDATE";
    public static DAO_ACCESS_TYPE_DELETE: string = "DELETE";

    public static getInstance() {
        if (!ModuleDAOServer.instance) {
            ModuleDAOServer.instance = new ModuleDAOServer();
        }
        return ModuleDAOServer.instance;
    }

    private static instance: ModuleDAOServer = null;

    private constructor() {
        super(ModuleDAO.getInstance().name);
    }

    // On expose des hooks pour les modules qui veulent gérer le filtrage des vos suivant l'utilisateur connecté
    private access_hooks: { [api_type_id: string]: { [access_type: string]: IHookFilterVos<IDistantVOBase> } } = {};

    // private pre_read_trigger_hook: DAOTriggerHook;
    private pre_update_trigger_hook: DAOTriggerHook;
    private pre_create_trigger_hook: DAOTriggerHook;
    private pre_delete_trigger_hook: DAOTriggerHook;

    // private post_read_trigger_hook: DAOTriggerHook;
    // private post_update_trigger_hook: DAOTriggerHook;
    // private post_create_trigger_hook: DAOTriggerHook;
    // private post_delete_trigger_hook: DAOTriggerHook;

    public async configure() {
        // this.pre_read_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_PRE_READ_TRIGGER);
        this.pre_update_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_PRE_UPDATE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(this.pre_update_trigger_hook);
        this.pre_create_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_PRE_CREATE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(this.pre_create_trigger_hook);
        this.pre_delete_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_PRE_DELETE_TRIGGER);
        ModuleTrigger.getInstance().registerTriggerHook(this.pre_delete_trigger_hook);

        // this.post_read_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_POST_READ_TRIGGER);

        // this.post_update_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_POST_UPDATE_TRIGGER);
        // ModuleTrigger.getInstance().registerTriggerHook(this.post_update_trigger_hook);
        // this.post_create_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_POST_CREATE_TRIGGER);
        // ModuleTrigger.getInstance().registerTriggerHook(this.post_create_trigger_hook);
        // this.post_delete_trigger_hook = new DAOTriggerHook(DAOTriggerHook.DAO_POST_DELETE_TRIGGER);
        // ModuleTrigger.getInstance().registerTriggerHook(this.post_delete_trigger_hook);
    }

    public registerAccessHook<T extends IDistantVOBase>(API_TYPE_ID: string, access_type: string, hook: IHookFilterVos<T>) {
        if (!this.access_hooks[API_TYPE_ID]) {
            this.access_hooks[API_TYPE_ID] = {};
        }
        this.access_hooks[API_TYPE_ID][access_type] = hook;
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_DELETE_VOS, this.deleteVOs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VOS, this.insertOrUpdateVOs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_INSERT_OR_UPDATE_VO, this.insertOrUpdateVO.bind(this));

        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VO_BY_ID, this.getVoById.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS, this.getVos.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_GET_VOS_BY_IDS, this.getVosByIds.bind(this));


        // ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_SELECT_ALL, this.selectAll.bind(this));
        // ModuleAPI.getInstance().registerServerApiHandler(ModuleDAO.APINAME_SELECT_ONE, this.selectOne.bind(this));
    }

    private async insertOrUpdateVOs(vos: IDistantVOBase[]): Promise<any[]> {

        let results: any[] = await ModuleServiceBase.getInstance().db.tx(async (t) => {

            let queries: any[] = [];

            for (let i in vos) {
                let vo: IDistantVOBase = vos[i];

                let isUpdate: boolean = vo.id ? true : false;
                let sql: string = await this.getqueryfor_insertOrUpdateVO(vo);

                if (!sql) {
                    continue;
                }

                queries.push(t.oneOrNone(sql, vo)/*posttrigger pas si simple : .then(async (data) => {
                    if (isUpdate) {
                        await this.post_update_trigger_hook.trigger(vo._type, vo);
                    } else {
                        await this.post_create_trigger_hook.trigger(vo._type, vo);
                    }
                })*/);
            }

            return t.batch(queries);
        });

        return results;
    }

    private async insertOrUpdateVO(vo: IDistantVOBase): Promise<any> {
        let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
        let uid: number = httpContext ? httpContext.get('UID') : null;
        if ((uid >= 225) && (uid <= 230)) {
            return null;
        }

        let isUpdate: boolean = vo.id ? true : false;
        let sql: string = await this.getqueryfor_insertOrUpdateVO(vo);

        if (!sql) {
            return null;
        }

        return await ModuleServiceBase.getInstance().db.oneOrNone(sql, vo)/*posttrigger pas si simple : .then(async (data) => {
            if (isUpdate) {
                await this.post_update_trigger_hook.trigger(vo._type, vo);
            } else {
                await this.post_create_trigger_hook.trigger(vo._type, vo);
            }
        })*/;
    }

    private async deleteVOs(vos: IDistantVOBase[]): Promise<any[]> {

        let results: any[] = await ModuleServiceBase.getInstance().db.tx(async (t) => {

            let queries: any[] = [];

            for (let i in vos) {
                let vo = vos[i];

                if (!vo._type) {
                    console.error("Un VO sans _type dans le DAO ! " + JSON.stringify(vo));
                    continue;
                }

                let datatable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

                if (!datatable) {
                    console.error("Impossible de trouver le datatable de ce _type ! " + JSON.stringify(vo));
                    continue;
                }

                // Ajout des triggers, avant et après suppression.
                //  Attention si un des output est false avant suppression, on annule la suppression
                let res: boolean[] = await this.pre_delete_trigger_hook.trigger(vo._type, vo);
                if (!BooleanHandler.getInstance().AND(res, true)) {
                    continue;
                }

                const sql = "DELETE FROM " + datatable.full_name + " where id = ${id} RETURNING id";
                queries.push(t.oneOrNone(sql, vo)/*posttrigger pas si simple : .then(async (data) => {
                    await this.post_delete_trigger_hook.trigger(vo._type, vo);
                })*/);
            }

            return t.batch(queries);
        });

        return results;
    }

    private async getqueryfor_insertOrUpdateVO(vo: IDistantVOBase): Promise<string> {

        if (!vo._type) {
            console.error("Un VO sans _type dans le DAO ! " + JSON.stringify(vo));
            return null;
        }

        let datatable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[vo._type];

        if (!datatable) {
            console.error("Impossible de trouver le datatable de ce _type ! " + JSON.stringify(vo));
            return null;
        }

        let sql: string = null;

        if (vo.id) {

            // Ajout des triggers, avant et après modification.
            //  Attention si un des output est false avant modification, on annule la modification
            let res: boolean[] = await this.pre_update_trigger_hook.trigger(vo._type, vo);
            if (!BooleanHandler.getInstance().AND(res, true)) {
                return null;
            }

            const setters = [];
            for (const f in datatable.fields) {

                if (typeof vo[datatable.fields[f].field_id] == "undefined") {
                    continue;
                }

                setters.push(datatable.fields[f].field_id + ' = ${' + datatable.fields[f].field_id + '}');
            }

            sql = "UPDATE " + datatable.full_name + " SET " + setters.join(', ') + " WHERE id = ${id} RETURNING ID";

        } else {

            // Ajout des triggers, avant et après modification.
            //  Attention si un des output est false avant modification, on annule la modification
            let res: boolean[] = await this.pre_create_trigger_hook.trigger(vo._type, vo);
            if (!BooleanHandler.getInstance().AND(res, true)) {
                return null;
            }

            const tableFields = [];
            const placeHolders = [];
            for (const f in datatable.fields) {
                if (typeof vo[datatable.fields[f].field_id] == "undefined") {
                    continue;
                }

                tableFields.push(datatable.fields[f].field_id);
                placeHolders.push('${' + datatable.fields[f].field_id + '}');
            }

            sql = "INSERT INTO " + datatable.full_name + " (" + tableFields.join(', ') + ") VALUES (" + placeHolders.join(', ') + ") RETURNING id";
        }

        return sql;
    }


    public async selectAll<T extends IDistantVOBase>(API_TYPE_ID: string, query: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null): Promise<T[]> {
        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let res: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t " + (query ? query : ''), queryParams ? queryParams : []) as T[]);

        // On filtre les res suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ, res);
    }


    // private async selectAll<T extends IDistantVOBase>(apiDAOParamVOs: APIDAOParamVOs<T>): Promise<T[]> {
    //     let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOParamVOs.API_TYPE_ID];

    //     // On vérifie qu'on peut faire un select
    //     if (!await this.checkAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ)) {
    //         return null;
    //     }

    //     let res: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t " + (apiDAOParamVOs.query ? apiDAOParamVOs.query : ''), apiDAOParamVOs.queryParams ? apiDAOParamVOs.queryParams : []) as T[]);

    //     // On filtre les res suivant les droits d'accès
    //     return await this.filterVOsAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ, res);
    // }

    private async checkAccess<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string): Promise<boolean> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return true;
        }

        // Si on lit les droits, on peut tout lire
        if ((datatable.full_name == ModuleAccessPolicy.getInstance().accesspolicy_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().rolepolicies_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().role_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().userroles_datatable.full_name)) {
            return true;
        }

        // On applique les accès au global sur le droit de faire un SELECT
        return await ModuleAccessPolicy.getInstance().checkAccess(ModuleDAO.ACCESS_GROUP_NAME, ModuleDAO.ACCESS_GROUP_NAME + '.' + access_type + "." + datatable.full_name);
    }

    private async filterVOsAccess<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string, vos: T[]): Promise<T[]> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return vos;
        }

        // Si on lit les droits, on peut tout lire
        if ((datatable.full_name == ModuleAccessPolicy.getInstance().accesspolicy_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().rolepolicies_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().role_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().userroles_datatable.full_name)) {
            return vos;
        }

        // On regarde si il existe un acces pour ce VO
        // Par défaut pas de filtrage
        // if (await ModuleAccessPolicy.getInstance().isAdmin()) {
        //     return vos;
        // }

        // Suivant le type de contenu et le type d'accès, on peut avoir un hook enregistré sur le ModuleDAO pour filtrer les vos
        let hook = this.access_hooks[datatable.vo_type] && this.access_hooks[datatable.vo_type][access_type] ? this.access_hooks[datatable.vo_type][access_type] : null;
        if (hook) {
            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            let uid: number = httpContext ? httpContext.get('UID') : null;
            let user_data = httpContext ? httpContext.get('USER_DATA') : null;
            return await hook(datatable, vos, uid, user_data) as T[];
        }

        return vos;
    }

    private async filterVOAccess<T extends IDistantVOBase>(datatable: ModuleTable<T>, access_type: string, vo: T): Promise<T> {

        if (!ModuleAccessPolicy.getInstance().actif) {
            return vo;
        }

        // Si on lit les droits, on peut tout lire
        if ((datatable.full_name == ModuleAccessPolicy.getInstance().accesspolicy_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().rolepolicies_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().role_datatable.full_name) ||
            (datatable.full_name == ModuleAccessPolicy.getInstance().userroles_datatable.full_name)) {
            return vo;
        }

        // On regarde si il existe un acces pour ce VO
        // Par défaut pas de filtrage

        // Suivant le type de contenu et le type d'accès, on peut avoir un hook enregistré sur le ModuleDAO pour filtrer les vos
        let hook = this.access_hooks[datatable.vo_type] && this.access_hooks[datatable.vo_type][access_type] ? this.access_hooks[datatable.vo_type][access_type] : null;
        if (hook) {
            let httpContext = ServerBase.getInstance() ? ServerBase.getInstance().getHttpContext() : null;
            let uid: number = httpContext ? httpContext.get('UID') : null;
            let user_data = httpContext ? httpContext.get('USER_DATA') : null;
            let filtered: T[] = await hook(datatable, [vo], uid, user_data) as T[];

            if (filtered && (filtered.length == 1)) {
                return vo;
            }
        }

        return vo;
    }

    // private async selectOne<T extends IDistantVOBase>(apiDAOParamVO: APIDAOParamVO<T>): Promise<T> {
    //     let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOParamVO.API_TYPE_ID];

    //     // On vérifie qu'on peut faire un select
    //     if (!await this.checkAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ)) {
    //         return null;
    //     }

    //     let vo: T = datatable.forceNumeric(await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + (apiDAOParamVO.query ? apiDAOParamVO.query : '') + ";", apiDAOParamVO.queryParams ? apiDAOParamVO.queryParams : []) as T);

    //     // On filtre suivant les droits d'accès
    //     return await this.filterVOAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ, vo);
    // }

    public async selectOne<T extends IDistantVOBase>(API_TYPE_ID: string, query: string = null, queryParams: any[] = null, depends_on_api_type_ids: string[] = null): Promise<T> {
        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let vo: T = datatable.forceNumeric(await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t " + (query ? query : '') + ";", queryParams ? queryParams : []) as T);

        // On filtre suivant les droits d'accès
        return await this.filterVOAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ, vo);
    }

    private async getVoById<T extends IDistantVOBase>(apiDAOParamVO: APIDAOParamVO): Promise<T> {

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOParamVO.API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let vo: T = datatable.forceNumeric(await ModuleServiceBase.getInstance().db.oneOrNone("SELECT t.* FROM " + datatable.full_name + " t WHERE id=" + apiDAOParamVO.id + ";") as T);

        if (!vo) {
            return vo;
        }

        // On filtre suivant les droits d'accès
        return await this.filterVOAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ, vo);
    }

    private async getVosByIds<T extends IDistantVOBase>(apiDAOParamsVO: APIDAOParamsVO): Promise<T[]> {

        let datatable: ModuleTable<T> = VOsTypesManager.getInstance().moduleTables_by_voType[apiDAOParamsVO.API_TYPE_ID];

        // On vérifie qu'on peut faire un select
        if (!await this.checkAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ)) {
            return null;
        }

        let vos: T[] = datatable.forceNumerics(await ModuleServiceBase.getInstance().db.query("SELECT t.* FROM " + datatable.full_name + " t WHERE id in (" + apiDAOParamsVO.ids + ");") as T[]);

        // On filtre suivant les droits d'accès
        return await this.filterVOsAccess(datatable, ModuleDAOServer.DAO_ACCESS_TYPE_READ, vos);
    }

    private async getVos<T extends IDistantVOBase>(API_TYPE_ID: StringParamVO): Promise<T[]> {

        // On filtre les res suivant les droits d'accès
        // return await this.selectAll(apiDAOParamVOs);
        return await this.selectAll<T>(API_TYPE_ID.text);
    }
}