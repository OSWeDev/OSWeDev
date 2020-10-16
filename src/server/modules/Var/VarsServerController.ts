import debounce = require('lodash/debounce');
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import DAG from '../../../shared/modules/Var/graph/dagbase/DAG';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import VarConfVOBase from '../../../shared/modules/Var/vos/VarConfVOBase';
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
    private _registered_vars: { [name: string]: VarConfVOBase } = {};
    private _registered_vars_by_ids: { [id: number]: VarConfVOBase } = {};
    private _registered_vars_controller: { [name: string]: VarServerControllerBase<any> } = {};
    private _registered_vars_by_datasource: { [datasource_id: string]: Array<VarServerControllerBase<any>> } = {};

    // TODO FIXME est-ce que tout n'est pas en cache à ce stade, si on demande toujours en insérant en base ?
    private _registered_vars_controller_by_api_type_id: { [api_type_id: string]: { [var_id: number]: VarServerControllerBase<any> } } = {};

    // CUD during run, broadcasting CUD
    private _varcacheconf_by_var_ids: { [var_id: number]: VarCacheConfVO } = {};
    private _varcacheconf_by_api_type_ids: { [api_type_id: string]: { [var_id: number]: VarCacheConfVO } } = {};
    /**
     * ----- Global application cache - Brocasted CUD - Local R
     */

    protected constructor() {
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

    get registered_vars_controller_by_api_type_id(): { [api_type_id: string]: { [var_id: number]: VarServerControllerBase<any> } } {
        return this._registered_vars_controller_by_api_type_id;
    }

    public init_varcontrollers_dag(varcontrollers_dag: DAG<VarCtrlDAGNode>) {
        this._varcontrollers_dag = varcontrollers_dag;
    }

    public getVarConf(var_name: string): VarConfVOBase {
        return this._registered_vars ? (this._registered_vars[var_name] ? this._registered_vars[var_name] : null) : null;
    }

    public getVarConfById(var_id: number): VarConfVOBase {
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

    public async registerVar(varConf: VarConfVOBase, controller: VarServerControllerBase<any>): Promise<VarConfVOBase> {
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

        let daoVarConf: VarConfVOBase = await ModuleDAO.getInstance().getNamedVoByName<VarConfVOBase>(varConf._type, varConf.name);

        if (daoVarConf) {
            this.setVar(daoVarConf, controller);
            return daoVarConf;
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(varConf);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            return null;
        }

        varConf.id = parseInt(insertOrDeleteQueryResult.id.toString());

        this.setVar(varConf, controller);
        return varConf;
    }

    public async configureVarCache(var_conf: VarConfVOBase, var_cache_conf: VarCacheConfVO): Promise<VarCacheConfVO> {

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

        var_cache_conf.id = parseInt(insert_or_update_result.id.toString());

        this._varcacheconf_by_var_ids[var_conf.id] = var_cache_conf;
        if (!this._varcacheconf_by_api_type_ids[var_conf.var_data_vo_type]) {
            this._varcacheconf_by_api_type_ids[var_conf.var_data_vo_type] = {};
        }
        this._varcacheconf_by_api_type_ids[var_conf.var_data_vo_type][var_conf.id] = var_cache_conf;
        return var_cache_conf;
    }

    /**
     * TODO FIXME REFONTE A FAIRE - A VOIR si on a toujours besoin de ces logiques
     * @param varConf
     * @param controller
     */
    private setVar(varConf: VarConfVOBase, controller: VarServerControllerBase<any>) {
        this._registered_vars[varConf.name] = varConf;
        this._registered_vars_controller[varConf.name] = controller;
        this._registered_vars_by_ids[varConf.id] = varConf;

        let datasource_deps: Array<DataSourceControllerBase<any>> = controller.getDataSourcesDependencies();
        datasource_deps = (!!datasource_deps) ? datasource_deps : [];
        datasource_deps.forEach((datasource_dep) => {
            datasource_dep.registerDataSource();
        });

        // On enregistre le lien entre DS et VAR
        let dss: Array<DataSourceControllerBase<any>> = this.get_datasource_deps(controller);
        for (let i in dss) {
            let ds = dss[i];

            if (!this._registered_vars_by_datasource[ds.name]) {
                this._registered_vars_by_datasource[ds.name] = [];
            }
            this._registered_vars_by_datasource[ds.name].push(controller);

            for (let j in ds.vo_api_type_ids) {
                let vo_api_type_id = ds.vo_api_type_ids[j];

                if (!this._registered_vars_controller_by_api_type_id[vo_api_type_id]) {
                    this._registered_vars_controller_by_api_type_id[vo_api_type_id] = {};
                }
                this._registered_vars_controller_by_api_type_id[vo_api_type_id][controller.varConf.id] = controller;
            }
            // if (!!controller.getVarCacheConf()) {

            //     this._cached_var_by_var_id[varConf.id] = controller;
            //     for (let j in ds.vo_api_type_ids) {
            //         let vo_api_type_id = ds.vo_api_type_ids[j];

            //         if (!this._cached_var_id_by_datasource_by_api_type_id[vo_api_type_id]) {
            //             this._cached_var_id_by_datasource_by_api_type_id[vo_api_type_id] = {};
            //         }

            //         if (!this._cached_var_id_by_datasource_by_api_type_id[vo_api_type_id][ds.name]) {
            //             this._cached_var_id_by_datasource_by_api_type_id[vo_api_type_id][ds.name] = {};
            //         }

            //         this._cached_var_id_by_datasource_by_api_type_id[vo_api_type_id][ds.name][varConf.id] = controller;
            //     }
            // }
        }

        // let deps: number[] = controller.getVarsIdsDependencies();
        // for (let i in deps) {
        //     let dep = deps[i];

        //     if (!this._parent_vars_by_var_id[dep]) {
        //         this._parent_vars_by_var_id[dep] = {};
        //     }
        //     this._parent_vars_by_var_id[dep][varConf.id] = controller;
        // }
    }

    /**
     * @param controller
     */
    private get_datasource_deps(controller: VarServerControllerBase<any>): Array<DataSourceControllerBase<any>> {
        let datasource_deps: Array<DataSourceControllerBase<any>> = controller.getDataSourcesDependencies();
        datasource_deps = (!!datasource_deps) ? datasource_deps : [];

        return datasource_deps;
    }
}