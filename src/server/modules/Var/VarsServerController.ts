

import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import DAG from '../../../shared/modules/Var/graph/dagbase/DAG';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import VarCtrlDAGNode from './controllerdag/VarCtrlDAGNode';
import DataSourceControllerBase from './datasource/DataSourceControllerBase';
import VarServerControllerBase from './VarServerControllerBase';

export default class VarsServerController {

    /**
     * Multithreading notes :
     *  - There's only one bgthread doing all the computations, and separated from the other threads if the project decides to do so
     */
    public static getInstance(): VarsServerController {
        if (!VarsServerController.instance) {
            VarsServerController.instance = new VarsServerController();
        }
        return VarsServerController.instance;
    }

    private static instance: VarsServerController = null;

    /**
     * Global application cache - Brocasted CUD - Local R -----
     */

    // NO CUD during run, just init in each thread - no multithreading special handlers needed
    private _varcontrollers_dag: DAG<VarCtrlDAGNode> = null;

    // NO CUD during run, just init in each thread - no multithreading special handlers needed
    private _registered_vars: { [name: string]: VarConfVO } = {};
    private _registered_vars_by_ids: { [id: number]: VarConfVO } = {};
    private _registered_vars_controller: { [name: string]: VarServerControllerBase<any> } = {};
    private _registered_vars_by_datasource: { [datasource_id: string]: Array<VarServerControllerBase<any>> } = {};

    // TODO FIXME est-ce que tout n'est pas en cache à ce stade, si on demande toujours en insérant en base ?
    private _registered_vars_controller_by_api_type_id: { [api_type_id: string]: Array<VarServerControllerBase<any>> } = {};

    // CUD during run, broadcasting CUD
    private _varcacheconf_by_var_ids: { [var_id: number]: VarCacheConfVO } = {};
    private _varcacheconf_by_api_type_ids: { [api_type_id: string]: { [var_id: number]: VarCacheConfVO } } = {};
    /**
     * ----- Global application cache - Brocasted CUD - Local R
     */

    protected constructor() {
    }

    public clear_all_inits() {
        VarsServerController.getInstance()._varcontrollers_dag = null;
        VarsServerController.getInstance()._registered_vars = {};
        VarsServerController.getInstance()._registered_vars_by_ids = {};
        VarsServerController.getInstance()._registered_vars_controller = {};
        VarsServerController.getInstance()._registered_vars_by_datasource = {};
        VarsServerController.getInstance()._registered_vars_controller_by_api_type_id = {};
        VarsServerController.getInstance()._varcacheconf_by_var_ids = {};
        VarsServerController.getInstance()._varcacheconf_by_api_type_ids = {};
    }

    get varcontrollers_dag() {
        return this._varcontrollers_dag;
    }

    get registered_vars_controller_(): { [name: string]: VarServerControllerBase<any> } {
        return this._registered_vars_controller;
    }

    get registered_vars_by_datasource(): { [datasource_id: string]: Array<VarServerControllerBase<any>> } {
        return this._registered_vars_by_datasource;
    }

    get varcacheconf_by_api_type_ids(): { [api_type_id: string]: { [var_id: number]: VarCacheConfVO } } {
        return this._varcacheconf_by_api_type_ids;
    }

    get varcacheconf_by_var_ids(): { [var_id: number]: VarCacheConfVO } {
        return this._varcacheconf_by_var_ids;
    }

    get registered_vars_controller_by_api_type_id(): { [api_type_id: string]: Array<VarServerControllerBase<any>> } {
        return this._registered_vars_controller_by_api_type_id;
    }


    /**
     * ATTENTION : Si on est client on doit pas utiliser cette méthode par ce qu'elle ne voit pas les
     *  vardatares or les valeurs sont là bas et pas dans le vardata
     * On considère la valeur valide si elle a une date de calcul ou d'init, une valeur pas undefined et
     *  si on a une conf de cache, pas expirée. Par contre est-ce que les imports expirent ? surement pas
     *  dont il faut aussi indiquer ces var datas valides
     */
    public has_valid_value(param: VarDataBaseVO): boolean {

        if (!param) {
            return false;
        }

        if (param.value_type === VarDataBaseVO.VALUE_TYPE_IMPORT) {
            return true;
        }

        if ((typeof param.value !== 'undefined') && (!!param.value_ts)) {

            let var_cache_conf = this.varcacheconf_by_var_ids[param.var_id];
            if (var_cache_conf && !!var_cache_conf.cache_timeout_secs) {
                let timeout: number = Dates.add(Dates.now(), -var_cache_conf.cache_timeout_secs);
                if (param.value_ts >= timeout) {
                    return true;
                }
            } else {
                return true;
            }
        }

        return false;
    }

    public getVarConf(var_name: string): VarConfVO {
        return this._registered_vars ? (this._registered_vars[var_name] ? this._registered_vars[var_name] : null) : null;
    }

    public getVarConfById(var_id: number): VarConfVO {
        return this._registered_vars_by_ids ? (this._registered_vars_by_ids[var_id] ? this._registered_vars_by_ids[var_id] : null) : null;
    }

    public getVarController(var_name: string): VarServerControllerBase<any> {
        return this._registered_vars_controller ? (this._registered_vars_controller[var_name] ? this._registered_vars_controller[var_name] : null) : null;
    }

    public getVarControllerById(var_id: number): VarServerControllerBase<any> {
        if ((!this._registered_vars_by_ids) || (!this._registered_vars_by_ids[var_id]) ||
            (!this._registered_vars_controller)) {
            return null;
        }

        let res = this._registered_vars_controller[this._registered_vars_by_ids[var_id].name];
        return res ? res : null;
    }

    public init_varcontrollers_dag() {

        let varcontrollers_dag: DAG<VarCtrlDAGNode> = new DAG();

        for (let i in VarsServerController.getInstance().registered_vars_controller_) {
            let var_controller: VarServerControllerBase<any> = VarsServerController.getInstance().registered_vars_controller_[i];

            let node = VarCtrlDAGNode.getInstance(varcontrollers_dag, var_controller);

            let var_dependencies: { [dep_name: string]: VarServerControllerBase<any> } = var_controller.getVarControllerDependencies();

            for (let dep_name in var_dependencies) {
                let var_dependency = var_dependencies[dep_name];

                let dependency = VarCtrlDAGNode.getInstance(varcontrollers_dag, var_dependency);

                node.addOutgoingDep(dep_name, dependency);
            }
        }

        this._varcontrollers_dag = varcontrollers_dag;
    }

    public async registerVar(varConf: VarConfVO, controller: VarServerControllerBase<any>): Promise<VarConfVO> {
        if ((!varConf) || (!controller)) {
            return null;
        }

        if (this._registered_vars && this._registered_vars[varConf.name]) {
            this.setVar(this._registered_vars[varConf.name], controller);
            return this._registered_vars[varConf.name];
        }

        // Pour les tests unitaires, on fournit l'id du varconf directement pour éviter cette étape
        if ((varConf.id != null) && (typeof varConf.id != 'undefined')) {
            this.setVar(varConf, controller);
            return varConf;
        }

        let daoVarConf: VarConfVO = await ModuleDAO.getInstance().getNamedVoByName<VarConfVO>(varConf._type, varConf.name);

        if (daoVarConf) {
            this.setVar(daoVarConf, controller);
            return daoVarConf;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(varConf);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            return null;
        }

        varConf.id = insertOrDeleteQueryResult.id;

        this.setVar(varConf, controller);
        return varConf;
    }

    public async configureVarCache(var_conf: VarConfVO, var_cache_conf: VarCacheConfVO): Promise<VarCacheConfVO> {

        let existing_bdd_conf: VarCacheConfVO[] = await ModuleDAO.getInstance().getVosByRefFieldIds<VarCacheConfVO>(VarCacheConfVO.API_TYPE_ID, 'var_id', [var_cache_conf.var_id]);

        if ((!!existing_bdd_conf) && existing_bdd_conf.length) {

            if (existing_bdd_conf.length == 1) {
                this._varcacheconf_by_var_ids[var_conf.id] = existing_bdd_conf[0];
                if (!this._varcacheconf_by_api_type_ids[var_conf.var_data_vo_type]) {
                    this._varcacheconf_by_api_type_ids[var_conf.var_data_vo_type] = {};
                }
                this._varcacheconf_by_api_type_ids[var_conf.var_data_vo_type][var_conf.id] = existing_bdd_conf[0];
                return existing_bdd_conf[0];
            }
            return null;
        }

        let insert_or_update_result: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(var_cache_conf);

        if ((!insert_or_update_result) || (!insert_or_update_result.id)) {
            ConsoleHandler.getInstance().error('Impossible de configurer le cache de la var :' + var_conf.id + ':');
            return null;
        }

        var_cache_conf.id = insert_or_update_result.id;

        this._varcacheconf_by_var_ids[var_conf.id] = var_cache_conf;
        if (!this._varcacheconf_by_api_type_ids[var_conf.var_data_vo_type]) {
            this._varcacheconf_by_api_type_ids[var_conf.var_data_vo_type] = {};
        }
        this._varcacheconf_by_api_type_ids[var_conf.var_data_vo_type][var_conf.id] = var_cache_conf;
        return var_cache_conf;
    }

    /**
     * On fait la somme des deps dont le nopm débute par le filtre en param.
     * @param varDAGNode Noeud dont on somme les deps
     * @param dep_name_starts_with Le filtre sur le nom des deps (dep_name.startsWith(dep_name_starts_with) ? sum : ignore)
     * @param start_value 0 par défaut, mais peut être null aussi dans certains cas ?
     */
    public get_outgoing_deps_sum(varDAGNode: VarDAGNode, dep_name_starts_with: string, start_value: number = 0) {
        let res: number = start_value;

        for (let i in varDAGNode.outgoing_deps) {
            let outgoing = varDAGNode.outgoing_deps[i];

            if (dep_name_starts_with && !outgoing.dep_name.startsWith(dep_name_starts_with)) {
                continue;
            }

            let var_data = (outgoing.outgoing_node as VarDAGNode).var_data;
            let value = var_data ? var_data.value : null;
            if ((!var_data) || (isNaN(value))) {
                continue;
            }

            if (value == null) {
                continue;
            }

            // 0 ou null ça marche
            if (!res) {
                res = value;
                continue;
            }

            res += value;
        }

        return res;
    }

    private setVar(varConf: VarConfVO, controller: VarServerControllerBase<any>) {
        this._registered_vars[varConf.name] = varConf;
        this._registered_vars_controller[varConf.name] = controller;
        this._registered_vars_by_ids[varConf.id] = varConf;

        let datasource_deps: DataSourceControllerBase[] = controller.getDataSourcesDependencies();
        datasource_deps = (!!datasource_deps) ? datasource_deps : [];
        if (datasource_deps && datasource_deps.length) {
            datasource_deps.forEach((datasource_dep) => {
                datasource_dep.registerDataSource();
            });
        }

        // On enregistre le lien entre DS et VAR
        let dss: DataSourceControllerBase[] = this.get_datasource_deps(controller);
        for (let i in dss) {
            let ds = dss[i];

            if (!this._registered_vars_by_datasource[ds.name]) {
                this._registered_vars_by_datasource[ds.name] = [];
            }
            this._registered_vars_by_datasource[ds.name].push(controller);

            for (let j in ds.vo_api_type_ids) {
                let vo_api_type_id = ds.vo_api_type_ids[j];

                if (!this._registered_vars_controller_by_api_type_id[vo_api_type_id]) {
                    this._registered_vars_controller_by_api_type_id[vo_api_type_id] = [];
                }
                this._registered_vars_controller_by_api_type_id[vo_api_type_id].push(controller);
            }
        }

        // On enregistre les defaults translations
        this.register_var_default_translations(varConf.name, controller);
    }

    /**
     * @param controller
     */
    private get_datasource_deps(controller: VarServerControllerBase<any>): DataSourceControllerBase[] {
        let datasource_deps: DataSourceControllerBase[] = controller.getDataSourcesDependencies();
        datasource_deps = (!!datasource_deps) ? datasource_deps : [];

        return datasource_deps;
    }

    private register_var_default_translations(varConf_name: string, controller: VarServerControllerBase<any>) {
        if (!!controller.var_name_default_translations) {
            DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
                controller.var_name_default_translations,
                VarsController.getInstance().get_translatable_name_code(varConf_name)));
        }

        if (!!controller.var_description_default_translations) {
            DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
                controller.var_description_default_translations,
                VarsController.getInstance().get_translatable_description_code(varConf_name)));
        }

        if (!!controller.var_explaination_default_translations) {
            DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
                controller.var_explaination_default_translations,
                VarsController.getInstance().get_translatable_explaination(varConf_name)));
        }

        if (!!controller.var_deps_names_default_translations) {

            let deps: { [dep_name: string]: VarServerControllerBase<any> } = controller.getVarControllerDependencies();
            for (let i in deps) {
                let dep = deps[i];

                if (!controller.var_deps_names_default_translations[i]) {
                    continue;
                }
                DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation(
                    controller.var_deps_names_default_translations[i],
                    VarsController.getInstance().get_translatable_dep_name(i)));
            }
        }
    }

}