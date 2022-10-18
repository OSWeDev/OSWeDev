

import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import DAG from '../../../shared/modules/Var/graph/dagbase/DAG';
import DAGController from '../../../shared/modules/Var/graph/dagbase/DAGController';
import VarDAGNode from '../../../shared/modules/Var/graph/VarDAGNode';
import ModuleVar from '../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../shared/modules/Var/VarsController';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVO from '../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
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
    private _varcontrollers_dag_depths: { [var_id: number]: number } = null;

    // NO CUD during run, just init in each thread - no multithreading special handlers needed
    private _registered_vars_controller: { [name: string]: VarServerControllerBase<any> } = {};
    private _registered_vars_by_datasource: { [datasource_id: string]: Array<VarServerControllerBase<any>> } = {};

    // TODO FIXME est-ce que tout n'est pas en cache à ce stade, si on demande toujours en insérant en base ?
    private _registered_vars_controller_by_api_type_id: { [api_type_id: string]: Array<VarServerControllerBase<any>> } = {};

    // CUD during run, broadcasting CUD
    private _varcacheconf_by_var_ids: { [var_id: number]: VarCacheConfVO } = {};
    private _varcacheconf_by_api_type_ids: { [api_type_id: string]: { [var_id: number]: VarCacheConfVO } } = {};

    private preloadedVarConfs: boolean = false;
    /**
     * ----- Global application cache - Brocasted CUD - Local R
     */

    protected constructor() {
    }

    public clear_all_inits() {
        VarsServerController.getInstance()._varcontrollers_dag = null;
        VarsServerController.getInstance()._varcontrollers_dag_depths = null;
        VarsServerController.getInstance()._registered_vars_controller = {};
        VarsServerController.getInstance()._registered_vars_by_datasource = {};
        VarsServerController.getInstance()._registered_vars_controller_by_api_type_id = {};
        VarsServerController.getInstance()._varcacheconf_by_var_ids = {};
        VarsServerController.getInstance()._varcacheconf_by_api_type_ids = {};
    }

    get varcontrollers_dag() {
        return this._varcontrollers_dag;
    }

    get varcontrollers_dag_depths() {
        return this._varcontrollers_dag_depths;
    }

    public update_registered_varconf(id: number, conf: VarConfVO) {
        VarsController.getInstance().var_conf_by_id[id] = conf;
        VarsController.getInstance().var_conf_by_name[conf.name] = conf;

        if (ConfigurationService.getInstance().node_configuration.DEBUG_VARS) {
            ConsoleHandler.getInstance().log('update_registered_varconf:UPDATED VARCConf VAR_ID:' + conf.id + ':' + JSON.stringify(conf));
        }
    }

    public delete_registered_varconf(id: number) {
        let name = VarsController.getInstance().var_conf_by_id[id].name;
        delete VarsController.getInstance().var_conf_by_id[id];
        delete VarsController.getInstance().var_conf_by_name[name];

        if (ConfigurationService.getInstance().node_configuration.DEBUG_VARS) {
            ConsoleHandler.getInstance().log('delete_registered_varconf:DELETED VARCConf VAR_ID:' + id + ':' + name);
        }
    }

    public update_registered_varcacheconf(id: number, cacheconf: VarCacheConfVO) {
        this._varcacheconf_by_var_ids[id] = cacheconf;

        let conf = this.getVarConfById(cacheconf.var_id);
        if (!conf) {
            return;
        }

        if (!this.varcacheconf_by_api_type_ids[conf.var_data_vo_type]) {
            this.varcacheconf_by_api_type_ids[conf.var_data_vo_type] = {};
        }
        this.varcacheconf_by_api_type_ids[conf.var_data_vo_type][cacheconf.var_id] = cacheconf;

        if (ConfigurationService.getInstance().node_configuration.DEBUG_VARS) {
            ConsoleHandler.getInstance().log('update_registered_varcacheconf:UPDATED VARCacheConf VAR_ID:' + cacheconf.var_id + ':' + JSON.stringify(cacheconf));
        }
    }

    public delete_registered_varcacheconf(id: number) {
        let cacheconf = this._varcacheconf_by_var_ids[id];
        delete this._varcacheconf_by_var_ids[id];

        let conf = this.getVarConfById(cacheconf.var_id);
        if (!conf) {
            return;
        }

        if (!this.varcacheconf_by_api_type_ids[conf.var_data_vo_type]) {
            return;
        }
        delete this.varcacheconf_by_api_type_ids[conf.var_data_vo_type][cacheconf.var_id];

        if (ConfigurationService.getInstance().node_configuration.DEBUG_VARS) {
            ConsoleHandler.getInstance().log('delete_registered_varcacheconf:DELETED VARCacheConf VAR_ID:' + cacheconf.var_id + ':' + JSON.stringify(cacheconf));
        }
    }

    public init_varcontrollers_dag_depths() {

        if ((!this._varcontrollers_dag_depths) && this.varcontrollers_dag) {
            this._varcontrollers_dag_depths = {};

            let needs_again = true;
            while (needs_again) {
                needs_again = false;

                let did_something = false;
                let last_not_full = null;
                for (let i in VarsServerController.getInstance().varcontrollers_dag.nodes) {
                    let node = VarsServerController.getInstance().varcontrollers_dag.nodes[i];

                    if (!!this._varcontrollers_dag_depths[node.var_controller.varConf.id]) {
                        continue;
                    }

                    let depth = this.get_max_depth(node, false);
                    if (depth === null) {
                        last_not_full = node;
                        needs_again = true;
                        continue;
                    }

                    this._varcontrollers_dag_depths[node.var_controller.varConf.id] = depth;
                    did_something = true;
                }

                if ((!did_something) && needs_again) {
                    if (!last_not_full) {
                        ConsoleHandler.getInstance().error('!last_not_full on !did_something in init_varcontrollers_dag_depths');
                        throw new Error('!last_not_full on !did_something in init_varcontrollers_dag_depths');
                    }

                    let depth = this.get_max_depth(last_not_full, true);
                    if (depth === null) {
                        ConsoleHandler.getInstance().error('depth===null on !did_something in init_varcontrollers_dag_depths');
                        throw new Error('depth===null on !did_something in init_varcontrollers_dag_depths');
                    }

                    this._varcontrollers_dag_depths[last_not_full.var_controller.varConf.id] = depth;
                }
            }
        }
        return this._varcontrollers_dag_depths;
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
     *
     * Si denied ici on dit que c'est valid, mais il faut bien remonter l'info qu'on deny aussi la var qui dépend de ce truc
     */
    public has_valid_value(param: VarDataBaseVO): boolean {

        if (!param) {
            return false;
        }

        if ((param.value_type === VarDataBaseVO.VALUE_TYPE_IMPORT) ||
            (param.value_type === VarDataBaseVO.VALUE_TYPE_DENIED)) {
            return true;
        }

        if ((typeof param.value !== 'undefined') && (!!param.value_ts)) {
            return true;
        }

        return false;
    }

    public getVarConf(var_name: string): VarConfVO {
        return VarsController.getInstance().var_conf_by_name ? (VarsController.getInstance().var_conf_by_name[var_name] ? VarsController.getInstance().var_conf_by_name[var_name] : null) : null;
    }

    public getVarConfById(var_id: number): VarConfVO {
        return VarsController.getInstance().var_conf_by_id ? (VarsController.getInstance().var_conf_by_id[var_id] ? VarsController.getInstance().var_conf_by_id[var_id] : null) : null;
    }

    public getVarController(var_name: string): VarServerControllerBase<any> {
        return this._registered_vars_controller ? (this._registered_vars_controller[var_name] ? this._registered_vars_controller[var_name] : null) : null;
    }

    public getVarControllerById(var_id: number): VarServerControllerBase<any> {
        if ((!VarsController.getInstance().var_conf_by_id) || (!VarsController.getInstance().var_conf_by_id[var_id]) ||
            (!this._registered_vars_controller)) {
            return null;
        }

        let res = this._registered_vars_controller[VarsController.getInstance().var_conf_by_id[var_id].name];
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

    /**
     * Renvoie les datasources dont la var est une dépendance.
     * @param controller
     */
    public get_datasource_deps_and_predeps(controller: VarServerControllerBase<any>): DataSourceControllerBase[] {
        let datasource_deps: DataSourceControllerBase[] = controller.getDataSourcesDependencies();
        datasource_deps = (!!datasource_deps) ? datasource_deps : [];

        let datasource_predeps: DataSourceControllerBase[] = controller.getDataSourcesPredepsDependencies();
        for (let i in datasource_predeps) {
            let ds = datasource_predeps[i];

            if (datasource_deps.indexOf(ds) == -1) {
                datasource_deps.push(ds);
            }
        }

        return datasource_deps;
    }

    /**
     * Renvoie le nom des datasources dont la var est une dépendance.
     * @param controller
     */
    public get_datasource_deps_and_predeps_names(controller: VarServerControllerBase<any>): string[] {
        let datasource_deps: DataSourceControllerBase[] = this.get_datasource_deps_and_predeps(controller);
        let datasource_deps_names: string[] = [];
        for (let i in datasource_deps) {
            let ds = datasource_deps[i];
            datasource_deps_names.push(ds.name);
        }
        return datasource_deps_names;
    }

    public async registerVar(varConf: VarConfVO, controller: VarServerControllerBase<any>): Promise<VarConfVO> {
        if ((!varConf) || (!controller)) {
            return null;
        }

        if (!ModuleVar.getInstance().initializedasync_VarsController) {
            await ModuleVar.getInstance().initializeasync();
        }

        let daoVarConf: VarConfVO = VarsController.getInstance().var_conf_by_name ? VarsController.getInstance().var_conf_by_name[varConf.name] : null;

        // Pour les tests unitaires, on fournit l'id du varconf directement pour éviter cette étape
        if ((!daoVarConf) && (varConf.id != null) && (typeof varConf.id != 'undefined')) {
            daoVarConf = varConf;
        }

        if (!daoVarConf) {
            daoVarConf = await query(VarConfVO.API_TYPE_ID).filter_by_text_eq('name', varConf.name).select_vo<VarConfVO>();
        }

        if (daoVarConf) {

            /**
             * Juste pour l'init des segment_types, si on voit en base null et dans le controller autre chose, on update la bdd sur ce champ
             */
            if ((!daoVarConf.segment_types) && (!!varConf.segment_types)) {
                daoVarConf.segment_types = varConf.segment_types;
                await ModuleDAO.getInstance().insertOrUpdateVO(daoVarConf);
            }

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

        let existing_bdd_conf: VarCacheConfVO[] = await query(VarCacheConfVO.API_TYPE_ID).filter_by_num_eq('var_id', var_cache_conf.var_id).select_vos<VarCacheConfVO>();

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
        VarsController.getInstance().var_conf_by_name[varConf.name] = varConf;
        this._registered_vars_controller[varConf.name] = controller;
        VarsController.getInstance().var_conf_by_id[varConf.id] = varConf;

        let dss: DataSourceControllerBase[] = this.get_datasource_deps_and_predeps(controller);
        dss = (!!dss) ? dss : [];
        if (dss && dss.length) {
            dss.forEach((datasource_dep) => {
                datasource_dep.registerDataSource();
            });
        }

        // On enregistre le lien entre DS et VAR
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

    private get_max_depth(node: VarCtrlDAGNode, ignore_incomplete: boolean) {
        let is_complete = true;
        let depth = 1;

        for (let j in node.outgoing_deps) {
            let dep = node.outgoing_deps[j];

            if ((dep.outgoing_node as VarCtrlDAGNode).var_controller.varConf.id == node.var_controller.varConf.id) {
                continue;
            }

            if (!this._varcontrollers_dag_depths[(dep.outgoing_node as VarCtrlDAGNode).var_controller.varConf.id]) {
                is_complete = false;
                break;
            }
            depth = Math.max(depth, this._varcontrollers_dag_depths[(dep.outgoing_node as VarCtrlDAGNode).var_controller.varConf.id] + 1);
        }

        if ((!is_complete) && (!ignore_incomplete)) {
            return null;
        }

        return depth;
    }
}