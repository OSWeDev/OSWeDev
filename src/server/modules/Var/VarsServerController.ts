import debounce = require('lodash/debounce');
import { Moment } from 'moment';
import * as moment from 'moment';
import DataSourceControllerBase from '../../../shared/modules/DataSource/DataSourceControllerBase';
import VarUpdateCallback from '../../../shared/modules/Var/vos/VarUpdateCallback';
import VarControllerBase from '../../../shared/modules/Var/VarControllerBase';
import VarDataBaseVO from '../../../shared/modules/Var/vos/VarDataBaseVO';
import VarConfVOBase from '../../../shared/modules/Var/vos/VarConfVOBase';
import VarServerControllerBase from './VarServerControllerBase';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import VarCacheConfVO from '../../../shared/modules/Var/vos/VarCacheConfVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

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
    private _registered_vars: { [name: string]: VarConfVOBase } = {};
    private _registered_vars_by_ids: { [id: number]: VarConfVOBase } = {};
    private _registered_vars_controller_: { [name: string]: VarServerControllerBase<any> } = {};
    private _registered_vars_by_datasource: { [datasource_id: string]: Array<VarServerControllerBase<any>> } = {};

    // TODO FIXME est-ce que tout n'est pas en cache à ce stade, si on demande toujours en insérant en base ?
    private _cached_var_by_var_id: { [var_id: number]: VarServerControllerBase<any> } = {};
    private _cached_var_id_by_datasource_by_api_type_id: { [api_type_id: string]: { [ds_name: string]: { [var_id: number]: VarServerControllerBase<any> } } } = {};
    private _parent_vars_by_var_id: { [var_id: number]: { [parent_var_id: number]: VarServerControllerBase<any> } } = {};

    // CUD during run, broadcasting CUD
    private _varcacheconf_by_var_ids: { [var_id: number]: VarCacheConfVO } = {};
    private _varcacheconf_by_api_type_ids: { [api_type_id: string]: { [var_id: number]: VarCacheConfVO } } = {};
    /**
     * ----- Global application cache - Brocasted CUD - Local R
     */

    protected constructor() {
    }

    get varcacheconf_by_api_type_ids(): { [api_type_id: string]: { [var_id: number]: VarCacheConfVO } } {
        return this._varcacheconf_by_api_type_ids;
    }

    get varcacheconf_by_var_ids(): { [var_id: number]: VarCacheConfVO } {
        return this._varcacheconf_by_var_ids;
    }

    get cached_var_id_by_datasource_by_api_type_id(): { [api_type_id: string]: { [ds_name: string]: { [var_id: number]: VarServerControllerBase<any> } } } {
        return this._cached_var_id_by_datasource_by_api_type_id;
    }

    get parent_vars_by_var_id(): { [var_id: number]: { [parent_var_id: number]: VarServerControllerBase<any> } } {
        return this._parent_vars_by_var_id;
    }

    get cached_var_by_var_id(): { [var_id: number]: VarServerControllerBase<any> } {
        return this._cached_var_by_var_id;
    }

    public getVarConf(var_name: string): VarConfVOBase {
        return this._registered_vars ? (this._registered_vars[var_name] ? this._registered_vars[var_name] : null) : null;
    }

    public getVarConfById(var_id: number): VarConfVOBase {
        return this._registered_vars_by_ids ? (this._registered_vars_by_ids[var_id] ? this._registered_vars_by_ids[var_id] : null) : null;
    }

    public getVarController(var_name: string): VarServerControllerBase<any> {
        return this._registered_vars_controller_ ? (this._registered_vars_controller_[var_name] ? this._registered_vars_controller_[var_name] : null) : null;
    }

    public getVarControllerById(var_id: number): VarServerControllerBase<any> {
        if ((!this._registered_vars_by_ids) || (!this._registered_vars_by_ids[var_id]) ||
            (!this._registered_vars_controller_)) {
            return null;
        }

        let res = this._registered_vars_controller_[this._registered_vars_by_ids[var_id].name];
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
        this._registered_vars_controller_[varConf.name] = controller;
        this._registered_vars_by_ids[varConf.id] = varConf;
        this.registered_var_data_api_types[varConf.var_data_vo_type] = true;

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

            if (!!controller.getVarCacheConf()) {

                this._cached_var_by_var_id[varConf.id] = controller;
                for (let j in ds.vo_api_type_ids) {
                    let vo_api_type_id = ds.vo_api_type_ids[j];

                    if (!this._cached_var_id_by_datasource_by_api_type_id[vo_api_type_id]) {
                        this._cached_var_id_by_datasource_by_api_type_id[vo_api_type_id] = {};
                    }

                    if (!this._cached_var_id_by_datasource_by_api_type_id[vo_api_type_id][ds.name]) {
                        this._cached_var_id_by_datasource_by_api_type_id[vo_api_type_id][ds.name] = {};
                    }

                    this._cached_var_id_by_datasource_by_api_type_id[vo_api_type_id][ds.name][varConf.id] = controller;
                }
            }
        }

        let deps: number[] = controller.getVarsIdsDependencies();
        for (let i in deps) {
            let dep = deps[i];

            if (!this._parent_vars_by_var_id[dep]) {
                this._parent_vars_by_var_id[dep] = {};
            }
            this._parent_vars_by_var_id[dep][varConf.id] = controller;
        }
    }

    /**
     * @param controller
     */
    private get_datasource_deps(controller: VarServerControllerBase<any>): Array<DataSourceControllerBase<any>> {
        let datasource_deps: Array<DataSourceControllerBase<any>> = controller.getDataSourcesDependencies();
        datasource_deps = (!!datasource_deps) ? datasource_deps : [];

        return datasource_deps;
    }









    private static VARS_DESC_TRANSLATABLE_PREFIXES: string = "var.desc.";
    private static BATCH_UID: number = 0;


    public datasource_deps_by_var_id: { [var_id: number]: Array<DataSourceControllerBase<any>> } = {};

    public registered_var_callbacks: { [index: string]: VarUpdateCallback[] } = {};

    public registered_var_data_api_types: { [api_type: string]: boolean } = {};

    public set_dependencies_heatmap_version: (dependencies_heatmap_version: number) => void = null;


    private setIsWaiting: (isWaiting: boolean) => void = null;

    private loaded_imported_datas_of_vars_ids: { [index: string]: boolean } = {};

    private updateSemaphore: boolean = false;
    private updateSemaphore_needs_reload: boolean = false;

    /**
     * This is meant to handle the datas before sending it the store to avoid multiple overloading problems
     */

    private datasource_deps_defined: boolean = false;

    private actions_waiting_for_release_of_update_semaphore: Array<() => Promise<void>> = [];
    private debounced_updatedatas_wrapper = debounce(this.updateDatasWrapper, this.var_debouncer);















    get registered_vars_controller(): { [name: string]: VarControllerBase<any> } {
        return this.registered_vars_controller_;
    }

    public vardatas_by_index_from_array<T extends VarDataBaseVO>(vardatas: T[]): { [index: string]: T } {
        let res: { [index: string]: T } = {};

        for (let i in vardatas) {
            let vardata = vardatas[i];

            res[vardata.index] = vardata;
        }

        return res;
    }

    get updateSemaphore_(): boolean {
        return this.updateSemaphore;
    }

    public next_step() {
        this.is_waiting = false;
        this.setIsWaiting(false);
    }

    public set_step(step_num: number) {
        this.step_number = step_num;
        this.setStepNumber(this.step_number);
    }

    public switch_stepper() {
        this.is_stepping = !this.is_stepping;
        this.setIsStepping(this.is_stepping);

        if (this.is_stepping) {
            this.next_step();
        } else {
            this.set_step(1);
        }
    }

    public async initialize() {
        this.registered_vars_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<SimpleVarConfVO>(SimpleVarConfVO.API_TYPE_ID));
        this.registered_vars = {};
        this.registered_var_data_api_types = {};

        for (let i in this.registered_vars_by_ids) {
            this.registered_vars[this.registered_vars_by_ids[i].name] = this.registered_vars_by_ids[i];
            this.registered_var_data_api_types[this.registered_vars_by_ids[i].var_data_vo_type] = true;
        }
    }

    public get_translatable_name_code(varConf_id: number): string {
        return VarsServerController.VARS_DESC_TRANSLATABLE_PREFIXES + this.getVarConfById(varConf_id).name + '.translatable_name' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_description_code(varConf_id: number): string {
        return VarsServerController.VARS_DESC_TRANSLATABLE_PREFIXES + this.getVarConfById(varConf_id).name + '.translatable_description' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_params_desc_code(varConf_id: number): string {
        return VarsServerController.VARS_DESC_TRANSLATABLE_PREFIXES + this.getVarConfById(varConf_id).name + '.translatable_params_desc' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    /**
     * Pushes all BatchCached datas of this Batch_uid to the store and clears the cache
     */
    public flushVarsDatas() {
        if (!this.varDatasBATCHCache) {
            return;
        }

        if (!!this.setVarsData_) {
            this.setVarsData_(this.varDatasBATCHCache);
        }

        for (let index in this.varDatasBATCHCache) {
            let varData: VarDataBaseVO = this.varDatasBATCHCache[index];

            // Set the data finally
            this.setVarData(varData);
        }

        this.varDatasBATCHCache = {};
    }

    public registerStoreHandlers<TData extends VarDataBaseVO>(
        getVarData: { [paramIndex: string]: TData },
        setVarsData: (varDatas: VarDataBaseVO[] | { [index: string]: VarDataBaseVO }) => void,
        setIsStepping: (is_stepping: boolean) => void,
        setIsWaiting: (isWaiting: boolean) => void,
        setStepNumber: (step_number: number) => void,
        set_dependencies_heatmap_version: (dependencies_heatmap_version: number) => void) {
        this.varDatas = getVarData;
        this.setVarsData_ = setVarsData;
        this.setIsStepping = setIsStepping;
        this.setIsWaiting = setIsWaiting;
        this.setStepNumber = setStepNumber;

        this.set_dependencies_heatmap_version = set_dependencies_heatmap_version;
    }

    public define_datasource_deps() {

        if (!this.datasource_deps_defined) {

            for (let i in this.registered_vars_controller_) {
                let registered_var_controller = this.registered_vars_controller_[i];

                let datasource_deps: Array<DataSourceControllerBase<any>> = this.get_datasource_deps(registered_var_controller);
                datasource_deps = (!!datasource_deps) ? datasource_deps : [];
                this.datasource_deps_by_var_id[registered_var_controller.varConf.id] = datasource_deps;
            }
            this.datasource_deps_defined = true;
        }
    }



    public stageUpdateVoUpdate(vo_before_update: IDistantVOBase, vo_after_update: IDistantVOBase) {

        this.define_datasource_deps();

        let res: { [index: string]: VarDataBaseVO } = DataSourcesController.getInstance().getUpdatedParamsFromVoUpdate(vo_before_update, vo_after_update);

        if (!res) {
            return;
        }

        for (let i in res) {
            this.stageUpdateData(res[i]);
        }
    }

    public setNewValueOutsideNormalUpdate<TData extends VarDataBaseVO>(value: TData) {

        this.setVarData(value, false);

        let index: string = value.index;
        if ((!index) || (!this.varDAG.nodes[index])) {
            return;
        }

        let node = this.varDAG.nodes[index];
        node.value = value;

        this.setVarsData_([value]);

        // Si en cours d'update, on marque pour le prochain batch et on ne demande pas la mise à jour ça sert à rien
        if (this.updateSemaphore) {

            for (let i in node.incoming) {
                let incoming = node.incoming[i];

                if ((!incoming.ongoing_update) && (!incoming.marked_for_update) &&
                    (!incoming.marked_for_next_update)) {
                    incoming.marked_for_next_update = true;
                }
            }
        } else {
            for (let i in node.incoming) {
                let incoming = node.incoming[i];

                incoming.marked_for_update = true;
            }
            this.debouncedUpdateDatas();
        }
    }

    public stageUpdateData<TDataParam extends VarDataBaseVO>(param: TDataParam, force_reload_if_updating: boolean = false) {

        let index: string = param.index;
        if ((!index) || (!this.varDAG.nodes[index])) {
            return;
        }

        let node = this.varDAG.nodes[index];

        // Si on demande à update un param qui est calculé côté serveur, on doit absolument recharger depuis le serveur
        if (!this.getVarControllerById(param.var_id).is_computable_client_side) {
            node.imported_or_precomputed_data_loaded = false;
        }

        // Si en cours d'update, on marque pour le prochain batch et on ne demande pas la mise à jour ça sert à rien
        if (this.updateSemaphore && (!force_reload_if_updating)) {

            if ((!node.ongoing_update) && (!node.marked_for_update) &&
                (!node.marked_for_next_update)) {
                node.marked_for_next_update = true;
            }
        } else {
            node.marked_for_update = true;
            this.debouncedUpdateDatas();
        }
    }

    public stageUpdateDataAndReloadImports<TDataParam extends VarDataBaseVO>(param: TDataParam, remove_import: boolean = false) {

        let index: string = param.index;
        if ((!index) || (!this.varDAG.nodes[index])) {
            return;
        }

        this.varDAG.nodes[index].imported_or_precomputed_data_loaded = false;

        this.varDAG.nodes[index].deps_loaded = false;
        this.varDAG.nodes[index].needs_deps_loading = true;

        this.loaded_imported_datas_of_vars_ids[param.var_id] = false;

        this.stageUpdateData(param, true);
    }

    /**
     * TODO FIXME POUR LA REFONTE : INFO : on doit checker parmi les encours de traitement et les à venir (donc les registered au global en fait)
     * si on est pas registered on register, et si on est déjà registered on attend le résultat comme les autres
     * @param param 
     * @param reload_on_register 
     * @param var_callbacks 
     * @param ignore_unvalidated_datas 
     * @param already_register 
     */
    public registerDataParam<TDataParam extends VarDataBaseVO>(
        param: TDataParam,
        reload_on_register: boolean = false,
        var_callbacks: VarUpdateCallback[] = null,
        ignore_unvalidated_datas: boolean = false,
        already_register: boolean = false) {

        if (!param) {
            return false;
        }

        if (this.updateSemaphore) {
            let self = this;
            this.actions_waiting_for_release_of_update_semaphore.push(async () => {
                self.registerDataParam(param, reload_on_register, var_callbacks, ignore_unvalidated_datas, already_register);
            });
            return false;
        }

        if (!already_register) {
            this.varDAG.registerParams([param], reload_on_register, ignore_unvalidated_datas);
        }

        if (!!var_callbacks) {

            let param_index = param.index;
            for (let i in var_callbacks) {
                let var_callback = var_callbacks[i];

                if (!this.registered_var_callbacks[param_index]) {
                    this.registered_var_callbacks[param_index] = [];
                }
                this.registered_var_callbacks[param_index].push(var_callback);
            }
        }

        let actual_value = this.varDAG.nodes[param.index].var_data.value;
        if (reload_on_register || (typeof actual_value === "undefined")) {
            this.stageUpdateData(param);
        }

        // Si la var est déjà calculée, on doit lancer le callback directement
        if ((!reload_on_register) && (typeof actual_value !== "undefined")) {
            this.run_callbacks(param, param.index);
        }
    }

    public clean_caches_and_vardag() {
        // On veut surtout pas supprimer l'arbre pendant qu'un update est en cours
        if (this.updateSemaphore) {
            return;
        }
        VarsServerController.getInstance().varDAG.clearDAG();
        this.loaded_imported_datas_of_vars_ids = {};
    }

    public unregisterCallbacks<TDataParam extends VarDataBaseVO>(param: TDataParam, var_callbacks_uids: number[]) {

        if (!param) {
            return false;
        }

        let param_index = param.index;
        let remaining_callbacks: VarUpdateCallback[] = [];

        for (let j in this.registered_var_callbacks[param_index]) {
            let registered_var_callback = this.registered_var_callbacks[param_index][j];

            if (var_callbacks_uids.indexOf(registered_var_callback.UID) < 0) {
                remaining_callbacks.push(registered_var_callback);
            }
        }

        this.registered_var_callbacks[param_index] = remaining_callbacks;
    }

    public async registerDataParamAndReturnVarData<TDataParam extends VarDataBaseVO>(
        param: TDataParam, reload_on_register: boolean = false, ignore_unvalidated_datas: boolean = false): Promise<VarDataBaseVO> {

        let self = this;
        return new Promise<VarDataBaseVO>((accept, reject) => {

            try {

                let var_callback_once = VarUpdateCallback.newCallbackOnce(param.index, (varData: VarDataBaseVO) => {
                    self.unregisterDataParam(param);
                    accept(varData);
                });

                self.registerDataParam(param, reload_on_register, [var_callback_once], ignore_unvalidated_datas);
            } catch (error) {
                ConsoleHandler.getInstance().error(error);
                reject(error);
            }
        });
    }

    public async registerDataParamsAndReturnVarDatas<TDataParam extends VarDataBaseVO, TData extends TDataParam & VarDataBaseVO>(
        params: TDataParam[], reload_on_register: boolean = false, ignore_unvalidated_datas: boolean = false): Promise<TData[]> {

        let res: TData[] = [];

        try {
            let promises = [];

            for (let i in params) {
                promises.push(this.registerDataParamAndReturnVarData(params[i], reload_on_register, ignore_unvalidated_datas));
            }
            await Promise.all(promises);

            for (let i in params) {
                let param = params[i];

                let data: TData = this.varDAG.nodes[param.index].var_data;

                if (!!data) {
                    res.push(data);
                }
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            return null;
        }

        return (res && res.length) ? res : null;
    }

    // FIXME todo à voir si en terme de perf on a un souci sur le fait de cumuler les infos de vars datas sans les supprimer de temps en temps.
    //  Mais là les perfs de mise à jour du store sont affreuses, il faut debounce a minima, mais du coup risque de demander un remove de var sur une var register à nouveau entre la demande initiale et le debounce... donc attention
    public onVarDAGNodeRemoval(node: VarDAGNode) {

        if ((!node) || (!node.param)) {
            return;
        }
        let index: string = node.param.index;

        // // if (!!this.varDatasStaticCache[index]) {
        // //     delete this.varDatasStaticCache[index];
        // // }
        // if (!!this.setVarData_) {
        //     this.removeVarData(node.param);
        // }


        if (!!this.varDatasStaticCache[index]) {
            delete this.varDatasStaticCache[index];
        }
    }

    public unregisterDataParam<TDataParam extends VarDataBaseVO>(param: TDataParam) {

        let index: string = param.index;
        if (!index) {
            return;
        }

        if (this.updateSemaphore) {
            let self = this;
            this.actions_waiting_for_release_of_update_semaphore.push(async () => {
                self.unregisterDataParam(param);
            });
            return false;
        }

        this.varDAG.unregisterIndexes([index]);
    }

    public getImportedVarsDatasByIndexFromArray<TImportedData extends VarDataBaseVO>(
        compteursValeursImportees: TImportedData[]): { [var_id: number]: { [param_index: string]: TImportedData } } {
        let res: { [var_id: number]: { [param_index: string]: TImportedData } } = {};

        for (let i in compteursValeursImportees) {
            let importedData: TImportedData = compteursValeursImportees[i];

            if (!importedData) {
                continue;
            }

            let param_index: string = importedData.index;

            if (!res[importedData.var_id]) {
                res[importedData.var_id] = {};
            }

            res[importedData.var_id][param_index] = importedData;
        }

        return res;
    }

    /**
     * FIXME TODO ASAP VARS TU
     * Fonction qui permet de définir avec une date le tsrange qu'on veut vraiment calculer dans le cas d'un compteur
     *  par exemple un compteur de solde d'heures veut la somme des soldes quotidiens depuis le dernier reset ou imports mais
     *  ils sont gérés plus tard
     */
    public get_tsrange_on_resetable_var(var_id: number, target: Moment, min_inclusiv: boolean, max_inclusiv: boolean, segment_type: number): TSRange {

        let controller = VarsServerController.getInstance().getVarControllerById(var_id);

        if (!controller) {
            return;
        }

        let conf = controller.varConf;

        if (!conf) {
            return null;
        }

        if (!conf.has_yearly_reset) {
            // Techniquement on a rien à faire ici...
            return null;
        }

        if (max_inclusiv) {
            TimeSegmentHandler.getInstance().incMoment(target, controller.segment_type, 1);
            TimeSegmentHandler.getInstance().forceStartSegment(target, controller.segment_type);
        }
        min_inclusiv = true;
        max_inclusiv = false;

        let closest_earlier_reset_date: Moment = ResetDateHelper.getInstance().getClosestPreviousResetDate(
            target, false, conf.has_yearly_reset, conf.yearly_reset_day_in_month, conf.yearly_reset_month);
        return TSRange.createNew(closest_earlier_reset_date, target, min_inclusiv, max_inclusiv, segment_type);
    }

    public getTSRangeToCall(target: Moment, min_inclusiv: boolean, max_inclusiv: boolean, segment_type: number): TSRange {
        return RangeHandler.getInstance().createNew(
            TSRange.RANGE_TYPE,
            moment('1900-01-01').startOf('day').utc(true),
            moment(target).utc(true),
            min_inclusiv,
            max_inclusiv,
            segment_type
        );
    }



    /**
     * Utilisé pour les tests unitaires
     */
    public unregisterVar(varConf: VarConfVOBase) {
        if (this.registered_vars && varConf && this.registered_vars[varConf.name]) {
            delete this.registered_vars[varConf.name];
            delete this.registered_vars_controller_[varConf.name];
            delete this.registered_vars_by_ids[varConf.id];
            delete this.datasource_deps_by_var_id[varConf.id];
        }
    }

    /**
     * Compare params. Return true if same
     * @param p1
     * @param p2
     */
    public isSameParam(p1: VarDataBaseVO, p2: VarDataBaseVO): boolean {
        return p1.index == p2.index;
    }

    /**
     * Compare params. Return true if same and in same order
     * @param ps1
     * @param ps2
     */
    public isSameParamArray(ps1: VarDataBaseVO[], ps2: VarDataBaseVO[]): boolean {
        ps1 = (!!ps1) ? ps1 : [];
        ps2 = (!!ps2) ? ps2 : [];

        if (ps1.length != ps2.length) {
            return false;
        }

        for (let i in ps1) {
            let p1: VarDataBaseVO = ps1[i];
            let p2: VarDataBaseVO = ps2[i];

            if (p1.index != p2.index) {
                return false;
            }
        }
        return true;
    }

    // private setVar(varConf: VarConfVOBase, controller: VarControllerBase<any>) {
    //     this.registered_vars[varConf.name] = varConf;
    //     this.registered_vars_controller_[varConf.name] = controller;
    //     this.registered_vars_by_ids[varConf.id] = varConf;
    //     this.registered_var_data_api_types[varConf.var_data_vo_type] = true;

    //     let datasource_deps: Array<DataSourceControllerBase<any>> = controller.getDataSourcesDependencies();
    //     datasource_deps = (!!datasource_deps) ? datasource_deps : [];
    //     datasource_deps.forEach((datasource_dep) => {
    //         datasource_dep.registerDataSource();
    //     });

    //     // On enregistre le lien entre DS et VAR
    //     let dss: Array<DataSourceControllerBase<any>> = this.get_datasource_deps(controller);
    //     for (let i in dss) {
    //         let ds = dss[i];

    //         if (!this.registered_vars_by_datasource[ds.name]) {
    //             this.registered_vars_by_datasource[ds.name] = [];
    //         }
    //         this.registered_vars_by_datasource[ds.name].push(controller);

    //         if (!!controller.getVarCacheConf()) {

    //             this.cached_var_by_var_id[varConf.id] = controller;
    //             for (let j in ds.vo_api_type_ids) {
    //                 let vo_api_type_id = ds.vo_api_type_ids[j];

    //                 if (!this.cached_var_id_by_datasource_by_api_type_id[vo_api_type_id]) {
    //                     this.cached_var_id_by_datasource_by_api_type_id[vo_api_type_id] = {};
    //                 }

    //                 if (!this.cached_var_id_by_datasource_by_api_type_id[vo_api_type_id][ds.name]) {
    //                     this.cached_var_id_by_datasource_by_api_type_id[vo_api_type_id][ds.name] = {};
    //                 }

    //                 this.cached_var_id_by_datasource_by_api_type_id[vo_api_type_id][ds.name][varConf.id] = controller;
    //             }
    //         }
    //     }

    //     let deps: number[] = controller.getVarsIdsDependencies();
    //     for (let i in deps) {
    //         let dep = deps[i];

    //         if (!this.parent_vars_by_var_id[dep]) {
    //             this.parent_vars_by_var_id[dep] = {};
    //         }
    //         this.parent_vars_by_var_id[dep][varConf.id] = controller;
    //     }
    // }

    /**
     * On va chercher à dépiler toutes les demandes en attente,
     *  et dans un ordre définit par le controller du type de var group
     */
    private async updateDatas() {

        if (this.is_stepping) {
            await this.updateDatasStepped();
            return;
        }

        if (!ModulesManager.getInstance().isServerSide) {
            await this.updateDatasLinearClient();
            return;
        }

        await this.updateDatasLinearServer();
    }

    /**
     * Etape 1 : on propage et on passe de marked for next à marked update et si on a aucun marked update, on quitte
     * @returns true si il y a au moins 1 maked_for_update
     */
    private updateDatas_propagation_et_next_to_current(): boolean {

        let has_marked_for_update: boolean = false;

        let nodes_to_propagate: { [index: string]: VarDAGNode } = {};
        for (let i in this.varDAG.nodes) {
            let node = this.varDAG.nodes[i];

            if (node.marked_for_next_update) {
                node.marked_for_update = true;
                node.marked_for_next_update = false;
            }

            if (node.marked_for_update) {
                has_marked_for_update = true;
                nodes_to_propagate[node.name] = node;
            }
        }

        if (!has_marked_for_update) {
            return false;
        }

        let nodes_propagated: { [index: string]: boolean } = {};
        while (ObjectHandler.getInstance().hasAtLeastOneAttribute(nodes_to_propagate)) {

            let next_nodes_to_propagate: { [index: string]: VarDAGNode } = {};
            for (let i in nodes_to_propagate) {
                let node = nodes_to_propagate[i];

                for (let j in node.incoming) {
                    let parent_node = node.incoming[j];

                    if (!nodes_propagated[parent_node.name]) {
                        next_nodes_to_propagate[parent_node.name] = parent_node;
                    }
                }

                node.marked_for_update = true;

                nodes_propagated[node.name] = true;
            }
            nodes_to_propagate = next_nodes_to_propagate;
        }

        return true;
    }

    /**
     * On essaie d'avoir une seule et même version de l'algo partout
     */
    private async updateDatasLinear() {

        /**
         * On boucle tant qu'on a pas une step 1 de propagation qui indique qu'on a terminé
         */
        while (true) {

            /**
             * Etape 1 : on propage et on passe de marked for next à marked update et si on a aucun marked update, on quitte
             */
            if (!this.updateDatas_propagation_et_next_to_current()) {
                break;
            }

            // Si des deps restent à résoudre, on les gère à ce niveau. On part du principe maintenant qu'on interdit une dep à un datasource pour le
            //  chargement des deps. ça va permettre de booster très fortement les chargements de données. Si un switch impact une dep de var, il
            //  faut l'avoir en param d'un constructeur de var et le changement du switch sera à prendre en compte dans la var au cas par cas.
            // TODO FIXME VARS les deps on les charge quand on ajoute des vars en fait c'est pas mieux ici et on devrait pas avoir à reparcourir l'arbre
            // à ce stade
            await this.solveDeps();

            // Ajout d'une étape pour le chargement des datas importées. Le but est de supprimer à terme le chargement des imports avant définition des deps
            //  pour les charger une fois la liste complète des deps connue et on cherchera à tronquer les branches qui sont importées ou précalculées,
            //  avant de demander les datas / ou de faire les calculs
            await this.loadImportedOrPrecompiledDatas();

            // Une fois les deps à jour, on propage la demande de mise à jour à travers les deps
            this.propagateUpdateRequest();

            this.clean_var_dag();

            // La demande est propagée jusqu'aux feuilles, on peut demander le chargement de toutes les datas nécessaires, en visitant des feuilles vers le top
            await this.loadDatasources();

            // On visite pour résoudre les calculs
            this.compute_all_nodes();

            this.mark_nodes_as_computed_at_least_once();

            this.flushVarsDatas();
        }
    }

    private mark_nodes_as_computed_at_least_once() {
        for (let i in this.varDAG) {
            let node = this.varDAG.nodes[i];

            if (!node.computed) {
                continue;
            }
            node.computed = false;
            node.computed_at_least_once = true;
        }
    }

    private compute_all_nodes() {
        for (let i in this.varDAG) {
            let node = this.varDAG.nodes[i];

            if (!node.ongoing_update) {
                continue;
            }
            this.computeNode(node);
        }
    }

    private async updateDatasStepped() {

        /**
         * On boucle tant qu'on a pas une step 1 de propagation qui indique qu'on a terminé
         */
        while (true) {

            switch (this.step_number) {
                default:
                case null:
                case 1:

                    /**
                     * Etape 1 : on propage et on passe de marked for next à marked update et si on a aucun marked update, on quitte
                     */
                    if (!this.updateDatas_propagation_et_next_to_current()) {
                        return;
                    }

                    if ((!!this.is_stepping) && this.setStepNumber) {
                        this.setIsWaiting(true);
                        this.setStepNumber(20);
                        break;
                    }

                case 20:

                    // Si des deps restent à résoudre, on les gère à ce niveau. On part du principe maintenant qu'on interdit une dep à un datasource pour le
                    //  chargement des deps. ça va permettre de booster très fortement les chargements de données. Si un switch impact une dep de var, il
                    //  faut l'avoir en param d'un constructeur de var et le changement du switch sera à prendre en compte dans la var au cas par cas.
                    // TODO FIXME VARS les deps on les charge quand on ajoute des vars en fait c'est pas mieux ici et on devrait pas avoir à reparcourir l'arbre
                    // à ce stade => sauf si on a des DS pre deps ...
                    await this.solveDeps();

                    if ((!!this.is_stepping) && this.setStepNumber) {
                        this.setIsWaiting(true);
                        this.setStepNumber(25);
                        break;
                    }

                case 25:

                    // Ajout d'une étape pour le chargement des datas importées. Le but est de supprimer à terme le chargement des imports avant définition des deps
                    //  pour les charger une fois la liste complète des deps connue et on cherchera à tronquer les branches qui sont importées ou précalculées,
                    //  avant de demander les datas / ou de faire les calculs
                    await this.loadImportedOrPrecompiledDatas();

                    if ((!!this.is_stepping) && this.setStepNumber) {
                        this.setIsWaiting(true);
                        this.setStepNumber(30);
                        break;
                    }

                case 30:

                    // Une fois les deps à jour, on propage la demande de mise à jour à travers les deps
                    this.propagateUpdateRequest();

                    if ((!!this.is_stepping) && this.setStepNumber) {
                        this.setIsWaiting(true);
                        this.setStepNumber(40);
                        break;
                    }

                case 40:

                    this.clean_var_dag();

                    if ((!!this.is_stepping) && this.setStepNumber) {
                        this.setIsWaiting(true);
                        this.setStepNumber(50);
                        break;
                    }

                case 50:

                    // La demande est propagée jusqu'aux feuilles, on peut demander le chargement de toutes les datas nécessaires, en visitant des feuilles vers le top
                    await this.loadDatasources();

                    if ((!!this.is_stepping) && this.setStepNumber) {
                        this.setIsWaiting(true);
                        this.setStepNumber(60);
                        break;
                    }

                case 60:

                    // On visite pour résoudre les calculs
                    this.compute_all_nodes();

                    if ((!!this.is_stepping) && this.setStepNumber) {
                        this.setIsWaiting(true);
                        this.setStepNumber(70);
                        break;
                    }

                case 70:

                    this.mark_nodes_as_computed_at_least_once();

                    if ((!!this.is_stepping) && this.setStepNumber) {
                        this.setIsWaiting(true);
                        this.setStepNumber(80);
                        break;
                    }

                case 80:

                    this.flushVarsDatas();

                    if ((!!this.is_stepping) && this.setStepNumber) {
                        this.setIsWaiting(true);
                        this.setStepNumber(90);
                        break;
                    }
            }
        }
    }

    private markNoeudsAGererImportMatroids(marker_todo: string, marker_ok: string) {

        for (let i in this.varDAG.nodes) {
            let node = this.varDAG.nodes[i];

            if (node.hasMarker(marker_ok)) {
                continue;
            }

            node.addMarker(marker_todo, this.varDAG);
        }
    }

    private getNoeudsAGererImportMatroids(marker_todo: string): { [node_name: string]: VarDAGNode } {
        let noeuds_a_gerer: { [node_name: string]: VarDAGNode } = {};

        for (let i in this.varDAG.marked_nodes_names[marker_todo]) {
            let node_index: string = this.varDAG.marked_nodes_names[marker_todo][i];

            noeuds_a_gerer[node_index] = this.varDAG.nodes[node_index];
        }

        return noeuds_a_gerer;
    }

    private getRootsLocauxToLoadImportedOrPrecompiledDatas(nodes_by_name: { [node_name: string]: VarDAGNode }): { [node_name: string]: VarDAGNode } {
        let res: { [node_name: string]: VarDAGNode } = {};

        for (let i in nodes_by_name) {
            let node = nodes_by_name[i];

            // Cas spécifique, mais récurrent, d'un noeud qui n'est pas root mais dont les ascendants ne peuvent dépendre d'un import en base
            // Dans ce cas c'est beaucoup plus simple, et on court-circuite le système classique
            if ((!node.needs_parent_to_load_precompiled_or_imported_data) && node.needs_to_load_precompiled_or_imported_data) {
                res[node.name] = node;
                continue;
            }

            let isroot = true;
            if (node.hasIncoming) {

                // On part du principe qu'un matroid dépend obligatoirement d'un matroid, donc on ne devrait pas avoir besoin de faire une remontée récursive
                for (let j in node.incoming) {
                    let incoming = node.incoming[j];

                    if (nodes_by_name[incoming.name]) {

                        // Ok c'est pas un root mais on peut pousser le truc un peu plus loin si on se dit que le parent est pas chargeable, on sait qu'on aura pas de réduction de scope donc on charge quand même
                        //  par contre attention, on peut très bien avoir une var parente encore qui elle nécessite un chargement. Donc on va devoir remonter de façon récursive pour le coup. Ou alors on doit marquer les noeuds dès le départ
                        //  pour indiquer qui a un parent qui nécessite de tester un chargement.
                        isroot = false;
                        break;
                    }
                }
            }

            if (isroot) {
                res[node.name] = node;
            }
        }

        return res;
    }

    private async loadDatasForNodes(nodes: { [node_name: string]: VarDAGNode }) {
        let promises: Array<Promise<any>> = [];
        let self = this;
        let nodes_to_request: VarDAGNode[] = [];

        let server_side: boolean = (!!ModulesManager.getInstance().isServerSide);
        for (let i in nodes) {
            let node = nodes[i];

            let var_controller = this.getVarControllerById(node.param.var_id);

            if (((!var_controller.can_load_precompiled_or_imported_datas_client_side) && (!server_side)) ||
                ((!var_controller.can_load_precompiled_or_imported_datas_server_side) && (!!server_side))) {
                node.loaded_datas_matroids = [];
                continue;
            }

            nodes_to_request.push(node);
        }

        for (let i in nodes_to_request) {

            let node = nodes_to_request[i];

            promises.push((async () => {

                let var_controller = self.getVarControllerById(node.param.var_id);

                /**
                 * On sépare le cas très spécifique d'une Var qui:
                 *  - a des imports uniquement atomiques
                 *  - est côté client, et non calculable côté client || côté serveur et non calculable côté serveur
                 * Dans ce cas on peut juste faire la somme des valeurs des imports en base, et partir.
                 */
                let ne_peut_pas_calculer = ((!var_controller.is_computable_client_side) && (!ModulesManager.getInstance().isServerSide)) || ((!var_controller.is_computable_server_side) && (!!ModulesManager.getInstance().isServerSide));

                if (var_controller.can_use_optimized_imports_calculation && ne_peut_pas_calculer) {

                    let value: number = await ModuleVar.getInstance().getSimpleVarDataValueSumFilterByMatroids<VarDataBaseVO, VarDataBaseVO>(this.getVarConfById(node.param.var_id).var_data_vo_type, [node.param], {});
                    node.loaded_datas_matroids = [];
                    node.computed_datas_matroids = [];
                    node.loaded_datas_matroids_sum_value = value;

                    let var_value: VarDataBaseVO = MatroidController.getInstance().cloneFrom(node.param as VarDataBaseVO);
                    var_value.value = value;
                    var_value.value_type = VarDataBaseVO.VALUE_TYPE_IMPORT;
                    node.value = var_value;

                    VarsServerController.getInstance().setVarData(var_value, true);
                    this.post_computeNode(node);

                    if (!node.deps_loaded) {
                        node.needs_deps_loading = false;
                        node.deps_loaded = true;
                    }

                    node.ongoing_update = false;
                    node.computed = true;
                    node.computed_at_least_once = true;
                    node.marked_for_update = false;

                    return;
                } else if (ne_peut_pas_calculer) {

                    let value: VarDataValueRes = await ModuleVar.getInstance().getSimpleVarDataCachedValueFromParam(node.param);

                    node.loaded_datas_matroids = [];
                    node.computed_datas_matroids = [];
                    node.loaded_datas_matroids_sum_value = value ? value.value : null;

                    if (value && value.has_value) {

                        let var_value: VarDataBaseVO = MatroidController.getInstance().cloneFrom(node.param as VarDataBaseVO);
                        var_value.value = value.value;
                        var_value.value_type = VarDataBaseVO.VALUE_TYPE_IMPORT;
                        node.value = var_value;

                        VarsServerController.getInstance().setVarData(var_value, true);
                    }
                    this.post_computeNode(node);

                    if (!node.deps_loaded) {
                        node.needs_deps_loading = false;
                        node.deps_loaded = true;
                    }

                    node.ongoing_update = false;
                    node.computed = true;
                    node.computed_at_least_once = true;
                    node.marked_for_update = false;

                    return;
                }

                let matroids_inscrits: VarDataBaseVO[] = await ModuleDAO.getInstance().filterVosByMatroids<VarDataBaseVO, VarDataBaseVO>(this.getVarConfById(node.param.var_id).var_data_vo_type, [node.param], {});

                if (!matroids_inscrits) {
                    return;
                }

                // Si on est sur une var qui utilise que des imports ou precompiled atomiques, on peut passer rapidement ici, inutile de chercher à découper , vérifier les intersections il n'y en aura pas
                if (var_controller.has_only_atomique_imports_or_precompiled_datas) {
                    node.loaded_datas_matroids = Array.from(matroids_inscrits);
                    return;
                }

                // On a les matroids inscrits dans le matroid qui questionne, on veut maintenant identifier l'ensemble le 'plus couvrant'
                //  Pour l'instant on fait simple, on classe par cardinal dec, et on garde ceux qui intersectent pas l'ensemble en cours de constitution

                // TODO FIXME VARS ASAP au lieu de demander un vos filtered, on demande des datarendered donc on filtre côté serveur directement les matroids qui seront utilisés ou pas
                //  au final côté client, ce qui évite d'envoyer une somme compilée pour les mois, et pour les jours des mois et pour l'année, si l'année est valide et couvre les autres.
                //  Attention, si on veut faire une couverture optimale on peut pas d'abord filtrer les couverts et ensuite chercher la couverture totale. Exemple si j'ai une question
                //  qui se pose sur 6 semaines, dont 4,5 sont couverts par un mois en datarendered, on a un cardinal élevé, on couvre 4 semaines probablement, mais on pourra probablement
                //  plus tenter de couvrire les semaines restantes avec des calculs semaine.Alors que si on prend les 6 semaines en calculé, on couvre la totalité et on recalcule rien.
                //  L'approximation est-elle suffisante, à voir dans le temps.
                let matroids_list: VarDataBaseVO[] = [];
                let tmp_matroids_list: VarDataBaseVO[] = [];

                let cardinaux: { [id: number]: number } = {};

                // let before = moment();
                for (let j in matroids_inscrits) {
                    let matroid_inscrit = matroids_inscrits[j];

                    if (node.ignore_unvalidated_datas) {
                        if (!matroid_inscrit.value_ts) {
                            continue;
                        }
                    }

                    cardinaux[matroid_inscrit.id] = MatroidController.getInstance().get_cardinal(matroid_inscrit);
                    tmp_matroids_list.push(matroid_inscrit);
                }
                matroids_inscrits = tmp_matroids_list;
                if ((!matroids_inscrits) || (matroids_inscrits.length <= 0)) {
                    return;
                }

                matroids_inscrits.sort((a: VarDataBaseVO, b: VarDataBaseVO) =>
                    cardinaux[b.id] - cardinaux[a.id]);

                for (let j in matroids_inscrits) {
                    let matroid_inscrit = matroids_inscrits[j];

                    if (MatroidController.getInstance().matroid_intersects_any_matroid(matroid_inscrit, matroids_list)) {
                        continue;
                    }
                    matroids_list.push(matroid_inscrit);
                }

                // On veut en tirer 2 choses :
                //  La somme des valeurs précompilées sur la matroids_list, comme base de calcul
                //  Le matroid restant que l'on va propager sur les vars dont on dépend

                //  En fait, les deps ont besoin de connaitre tous les matroids parents, qui les filtrent
                //  on peut simplement les stocker, et retirer des matroids inscrits ceux qui intersectent avec l'un des matroid parent.

                //  Celà dit, pour le calcul final, il faut définir la liste des matroids restants à calculer.
                //  Si on a la liste des matroids restants à calculer, il faut savoir dire si les matroids inscrits restent inscrits dans les matroids restants.
                //  ça semble pas simple a priori, alors qu'avec les parents, on a pas de difficulté.

                //  donc on stocke les 2 infos dans l'arbre, les matroids cibles, et les matroids retirés via précompilation/import

                // On commence par stocker les matroids en cache :
                node.loaded_datas_matroids = Array.from(matroids_list);
            })());
        }
        await Promise.all(promises);
    }

    private updateMatroidsAfterImport(nodes: { [node_name: string]: VarDAGNode }) {

        for (let i in nodes) {
            let node: VarDAGNode = nodes[i];

            node.loaded_datas_matroids_sum_value = null;
            let var_controller = this.getVarControllerById(node.param.var_id);

            if (((!var_controller.can_load_precompiled_or_imported_datas_client_side) && (!ModulesManager.getInstance().isServerSide)) ||
                ((!var_controller.can_load_precompiled_or_imported_datas_server_side) && (!!ModulesManager.getInstance().isServerSide))) {

                if (((!var_controller.is_computable_client_side) && (!ModulesManager.getInstance().isServerSide)) ||
                    ((!var_controller.is_computable_server_side) && (!!ModulesManager.getInstance().isServerSide))) {
                    node.computed_datas_matroids = [];
                    continue;
                }

                node.computed_datas_matroids = [MatroidController.getInstance().cloneFrom(node.param as VarDataBaseVO)] as VarDataBaseVO[];
                continue;
            }

            let matroids_list: VarDataBaseVO[] = node.loaded_datas_matroids as VarDataBaseVO[];

            let remaining_matroids = [];
            if (!(((!var_controller.is_computable_client_side) && (!ModulesManager.getInstance().isServerSide)) ||
                ((!var_controller.is_computable_server_side) && (!!ModulesManager.getInstance().isServerSide)))) {
                remaining_matroids = [MatroidController.getInstance().cloneFrom(node.param as VarDataBaseVO)];
            }

            for (let j in matroids_list) {
                let matroid = matroids_list[j];

                if ((matroid.value === null) || (typeof matroid.value == "undefined")) {
                    continue;
                }

                if (node.loaded_datas_matroids_sum_value == null) {
                    node.loaded_datas_matroids_sum_value = matroid.value;
                } else {
                    node.loaded_datas_matroids_sum_value += matroid.value;
                }

                if (((!var_controller.is_computable_client_side) && (!ModulesManager.getInstance().isServerSide)) ||
                    ((!var_controller.is_computable_server_side) && (!!ModulesManager.getInstance().isServerSide))) {
                    continue;
                }

                let cut_results: Array<MatroidCutResult<VarDataBaseVO>> = MatroidController.getInstance().cut_matroids(matroid, remaining_matroids);
                remaining_matroids = [];
                for (let k in cut_results) {
                    remaining_matroids = remaining_matroids.concat(cut_results[k].remaining_items);
                }
            }

            node.computed_datas_matroids = remaining_matroids as VarDataBaseVO[];
        }
    }

    private updateDepssAfterImport(nodes: { [node_name: string]: VarDAGNode }) {

        for (let i in nodes) {
            let node: VarDAGNode = nodes[i];

            // Si on a rien de chargé, on a rien à changer, sauf si on a pas de deps loaded
            if (node.deps_loaded) {
                if ((!node.loaded_datas_matroids) || (!node.loaded_datas_matroids.length)) {
                    continue;
                }
            }

            // ça veut dire aussi qu'on se demande ici quels params on doit vraiment charger en deps de ce params pour pouvoir calculer
            //  et on doit modifier l'arbre en conséquence
            let node_controller = VarsServerController.getInstance().getVarControllerById(node.param.var_id);

            VarDAGDefineNodeDeps.clear_node_deps(node, this.varDAG);

            // On doit faire un fake vardagnode pour chaque matroid à calculer (donc résultant de la coupe) et on additionnera les résultats
            for (let j in node.computed_datas_matroids) {
                let computed_datas_matroid = node.computed_datas_matroids[j];

                let fake_vardagnode = new VarDAGNode(computed_datas_matroid.index, null, computed_datas_matroid);
                let deps: { [dep_id: string]: VarDataBaseVO } = node_controller.getParamDependencies(fake_vardagnode, this.varDAG);

                VarDAGDefineNodeDeps.add_node_deps(node, this.varDAG, deps, {});

                for (let k in node.outgoing) {
                    let outgoing = node.outgoing[k];

                    outgoing.marked_for_update = true;
                }
            }

            if (!node.deps_loaded) {
                node.needs_deps_loading = false;
                node.deps_loaded = true;
            }
        }
    }

    /**
     * Nouvelle version de la gestion des données importées et/ou précompilées pour avoir
     *  des chargements de datas uniquement liées à l'arbre demandé. Objectif : Limiter
     *  drastiquement les donées chargées, et donc en précompiler le plus possible à terme.
     *
     * On s'intéresse par contre que aux vars qui utilisent des matroids
     */
    private async loadImportedOrPrecompiledDatas() {

        while (true) {

            let noeuds_a_gerer: { [node_name: string]: VarDAGNode } = {};
            for (let i in this.varDAG.nodes) {
                let node = this.varDAG.nodes[i];

                if (!!node.imported_or_precomputed_data_loaded) {
                    continue;
                }

                noeuds_a_gerer[node.param.index] = node;
            }

            if (!ObjectHandler.getInstance().hasAtLeastOneAttribute(noeuds_a_gerer)) {
                return;
            }

            // Une fois qu'on a la liste des noeuds à gérer, on découpe en plusieurs étapes:
            //  1- prendre les noeuds de plus haut niveau (roots locaux) qui dépendent d'aucun noeud à gérer
            //  2- Charger les imports et ajuster les matroids
            //  3- Retirer ces noeuds des noeuds à gérer
            //  4- Vérifier les noeuds enfants. Pour chaque noeud :
            //      0- Si les parents ne sont pas tous chargés, on ignore
            //      a- Si l'enfant a plusieurs parents, et pour chaque matroid à calculer différent chez les parents, on duplique l'enfant, et on adapte pour chacun le nouveau matroid demandé
            //          ATTENTION la copie concerne le noeud et tout l'arbre qui en découle => donc peut impacter plusieurs matroids aussi en dessous
            //      b- Sinon on applique le matroid à calculer parent
            //  5- On recommence avec la liste des noeuds à gérer mise à jour

            //  1- prendre les noeuds de plus haut niveau (roots locaux) qui dépendent d'aucun noeud à gérer
            let roots_locaux: { [node_name: string]: VarDAGNode } = this.getRootsLocauxToLoadImportedOrPrecompiledDatas(noeuds_a_gerer);

            //  2- Charger les imports et ajuster les matroids
            await this.loadDatasForNodes(roots_locaux);

            //  3- Retirer ces noeuds des noeuds à gérer
            for (let i in roots_locaux) {
                roots_locaux[i].imported_or_precomputed_data_loaded = true;
            }

            //  4- Vérifier les noeuds enfants. Pour chaque noeud :
            //      0- Si les parents ne sont pas tous chargés, on ignore
            //      a- Si l'enfant a plusieurs parents, et pour chaque matroid à calculer différent chez les parents, on duplique l'enfant, et on adapte pour chacun le nouveau matroid demandé
            //          ATTENTION la copie concerne le noeud et tout l'arbre qui en découle => donc peut impacter plusieurs matroids aussi en dessous
            //      b- Sinon on applique le matroid à calculer parent
            this.updateMatroidsAfterImport(roots_locaux);
            this.updateDepssAfterImport(roots_locaux);

            //  5- On recommence avec la liste des noeuds à gérer mise à jour
        }
    }

    private async solveDeps() {

        /**
         * BUG : on arrive des fois ici avec plus de noeuds markés que de noeuds dans l'arbre ....
         *  c'est un bug, mais dont au fond on se fout... donc on clean les marked et on continue
         */
        if (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED] &&
            (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED].length > this.varDAG.nodes_names.length)) {
            this.clean_marked_nodes_names();
            ConsoleHandler.getInstance().error('BUG : on arrive des fois ici avec plus de noeuds markés que de noeuds dans l\'arbre ....');
        }

        let all_ok: boolean = (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED] &&
            (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED].length == this.varDAG.nodes_names.length)) &&
            ((!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING]) ||
                (!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING].length));

        while (!all_ok) {

            // On ajoute la gestion des chargements de datasources pre_deps
            //  Si on a pas tout chargé, et qu'on a des noeuds qui attendent un chargement de datasource, on lance ces chargement et on indique que la dep doit être résolue
            //  On demande à nouveau la résolution des deps
            //  et ainsi de suite, si on a encore d'autres deps à charger pour pouvoir avancer

            let nodes_names: string[] = Array.from(this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING]);

            while (nodes_names && nodes_names.length) {

                let new_nodes: { [index: string]: VarDAGNode } = {};
                for (let i in nodes_names) {
                    let node_name = nodes_names[i];
                    let node = this.varDAG.nodes[node_name];

                    if (node.hasMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED) || (!node.needs_deps_loading)) {
                        continue;
                    }
                    VarDAGDefineNodeDeps.defineNodeDeps(node, this.varDAG, new_nodes);
                }
                nodes_names = Object.keys(new_nodes);
            }

            all_ok = (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED] &&
                (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED].length == this.varDAG.nodes_names.length)) &&
                ((!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING]) ||
                    (!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING].length));

            if (!all_ok) {

                // On check qu'il y a des deps en attente
                if (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_PREDEPS_DATASOURCE_LOADING] &&
                    this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_PREDEPS_DATASOURCE_LOADING].length) {

                    // On doit récupérer les noeuds concernés et demander le chargement des datasources predeps
                    let nodes_names_to_preload: string[] = this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_PREDEPS_DATASOURCE_LOADING];

                    let datasources_batches: { [datasource_name: string]: { [index: string]: VarDataBaseVO } } = {};
                    let params: { [index: string]: VarDataBaseVO } = {};

                    for (let i in nodes_names_to_preload) {
                        let node_name_to_preload: string = nodes_names_to_preload[i];

                        let varDagNode: VarDAGNode = this.varDAG.nodes[node_name_to_preload];

                        let datasources_predeps: Array<DataSourceControllerBase<any>> = VarsServerController.getInstance().getVarControllerById(varDagNode.param.var_id).getDataSourcesPredepsDependencies();

                        for (let j in datasources_predeps) {
                            let datasource_predeps = datasources_predeps[j];

                            if (!datasources_batches[datasource_predeps.name]) {
                                datasources_batches[datasource_predeps.name] = {};
                            }
                            datasources_batches[datasource_predeps.name][varDagNode.name] = varDagNode.param;
                        }

                        params[varDagNode.name] = varDagNode.param;
                    }

                    let promises: Array<Promise<any>> = [];
                    for (let i in datasources_batches) {
                        let datasource_batch = datasources_batches[i];

                        let datasource_controller: DataSourceControllerBase<any> = DataSourcesController.getInstance().registeredDataSourcesController[i];

                        if (((!datasource_controller.can_use_client_side) && (!ModulesManager.getInstance().isServerSide)) ||
                            ((!datasource_controller.can_use_server_side) && (!!ModulesManager.getInstance().isServerSide))) {
                            continue;
                        }

                        promises.push((async () => {
                            await datasource_controller.load_for_batch(datasource_batch);
                        })());
                    }
                    await Promise.all(promises);

                    for (let node_name_to_preload in params) {
                        this.varDAG.nodes[node_name_to_preload].removeMarker(VarDAG.VARDAG_MARKER_NEEDS_PREDEPS_DATASOURCE_LOADING, this.varDAG, true);
                        this.varDAG.nodes[node_name_to_preload].addMarker(VarDAG.VARDAG_MARKER_PREDEPS_DATASOURCE_LOADED, this.varDAG);
                    }
                } else {

                    // Sinon on a pas tout ok, mais on sait pas résoudre, on indique une erreur
                    ConsoleHandler.getInstance().error('echec solveDeps:des deps restent, mais impossible de les charger');
                    return;
                }
            }
        }
    }

    private clean_marked_nodes_names() {

        for (let marker in this.varDAG.marked_nodes_names) {
            let nodes_names = this.varDAG.marked_nodes_names[marker];

            if (nodes_names.length > this.varDAG.nodes_names.length) {
                let new_marked_nodes: string[] = [];

                for (let i in nodes_names) {
                    let node_name = nodes_names[i];

                    if (!this.varDAG.nodes_names[node_name]) {
                        continue;
                    }
                    new_marked_nodes.push(node_name);
                }
                this.varDAG.marked_nodes_names[marker] = new_marked_nodes;
            }
        }
    }

    private run_callbacks(param: VarDataBaseVO, param_index: string) {
        let remaining_callbacks: VarUpdateCallback[] = [];

        for (let i in this.registered_var_callbacks[param_index]) {
            let callback = this.registered_var_callbacks[param_index][i];

            if (!!callback.callback) {
                callback.callback(this.getVarData(param, true));
            }

            if (callback.type == VarUpdateCallback.TYPE_EVERY) {
                remaining_callbacks.push(callback);
            }
        }
        this.registered_var_callbacks[param_index] = remaining_callbacks;
    }

    private propagateUpdateRequest() {

        if (!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE]) {
            return;
        }

        let visitor = new VarDAGDefineNodePropagateRequest();
        let visit_all_marked_nodes = true;
        let marker = VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE;

        while ((visit_all_marked_nodes && this.varDAG.marked_nodes_names[marker] && this.varDAG.marked_nodes_names[marker].length) ||
            ((!visit_all_marked_nodes) && ((!this.varDAG.marked_nodes_names[marker]) || (this.varDAG.marked_nodes_names[marker].length != this.varDAG.nodes_names.length)))) {

            let node_name: string;

            if (visit_all_marked_nodes) {
                node_name = this.varDAG.marked_nodes_names[marker][0];
            } else {
                node_name = this.varDAG.nodes_names.find((name: string) => !this.varDAG.nodes[name].hasMarker(marker));
            }

            if (!node_name) {
                return;
            }

            visitor.varDAGVisitorDefineNodePropagateRequest(this.varDAG.nodes[node_name], this.varDAG);
        }
    }

    /**
     * On charge les datas, en considérant tout l'arbre à plat, aucune dépendance et pas d'ordre de chargement
     */
    private async loadDatasources() {

        // On doit charger toutes les datas dont dépendent les ongoing_update
        let source_deps_by_node_names: { [node_name: string]: string[] } = {};
        let var_params_by_source_deps: { [ds_name: string]: VarDataBaseVO[] } = {};

        for (let i in this.varDAG.nodes) {
            let node: VarDAGNode = this.varDAG.nodes[i];

            if (!node.ongoing_update) {
                continue;
            }

            let node_name: string = node.name;
            let controller: VarControllerBase<any> = this.getVarControllerById(node.param.var_id);
            let datasource_deps: Array<DataSourceControllerBase<any>> = controller.getDataSourcesDependencies();

            // Si on peut pas calculer ça sert à rien
            let ne_peut_pas_calculer = ((!controller.is_computable_client_side) && (!ModulesManager.getInstance().isServerSide)) || ((!controller.is_computable_server_side) && (!!ModulesManager.getInstance().isServerSide));
            if (ne_peut_pas_calculer) {
                continue;
            }

            source_deps_by_node_names[node_name] = [];
            for (let j in datasource_deps) {
                let datasource_dep: DataSourceControllerBase<any> = datasource_deps[j];

                if (!var_params_by_source_deps[datasource_dep.name]) {
                    var_params_by_source_deps[datasource_dep.name] = [];
                }
                source_deps_by_node_names[node_name].push(datasource_dep.name);
                var_params_by_source_deps[datasource_dep.name].push(node.param);
            }
        }

        let promises: Array<Promise<any>> = [];
        for (let ds_name in var_params_by_source_deps) {
            let ds_controller: DataSourceControllerBase<any> = DataSourcesController.getInstance().registeredDataSourcesController[ds_name];

            promises.push((async () => {
                await ds_controller.load_for_batch(var_params_by_source_deps[ds_name]);
            })());
        }
        await Promise.all(promises);
    }

    private computeNode(node: VarDAGNode) {

        let actual_node: VarDAGNode = node;
        let nodes_path: VarDAGNode[] = [];
        let continue_compilation: boolean = true;

        if (node.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED)) {
            return;
        }

        if ((!node.ongoing_update) && (node.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED_AT_LEAST_ONCE))) {
            return;
        }

        while (continue_compilation) {

            continue_compilation = false;
            let go_further: boolean = false;
            do {

                go_further = false;
                for (let i in actual_node.outgoing) {
                    let outgoing: VarDAGNode = actual_node.outgoing[i] as VarDAGNode;

                    if (outgoing.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED)) {
                        continue;
                    }

                    if ((!outgoing.ongoing_update) && (outgoing.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED_AT_LEAST_ONCE))) {
                        continue;
                    }

                    // On doit compute un noeud, on s'en occuppe
                    nodes_path.unshift(actual_node);
                    actual_node = outgoing;
                    go_further = true;
                    break;
                }
            } while (go_further);

            // On doit pouvoir compute à ce stade
            VarsServerController.getInstance().getVarControllerById(actual_node.param.var_id).computeValue(actual_node, this.varDAG);

            this.post_computeNode(actual_node);

            if (nodes_path.length > 0) {
                actual_node = nodes_path.shift();
                continue_compilation = true;
            }
        }
    }

    private post_computeNode(node: VarDAGNode) {

        if (this.registered_var_callbacks[node.name] && this.registered_var_callbacks[node.name].length) {

            let remaining_callbacks: VarUpdateCallback[] = [];

            for (let i in this.registered_var_callbacks[node.name]) {
                let callback = this.registered_var_callbacks[node.name][i];

                if (!!callback.callback) {
                    callback.callback(node.var_data);
                }

                if (callback.type == VarUpdateCallback.TYPE_EVERY) {
                    remaining_callbacks.push(callback);
                }
            }
            this.registered_var_callbacks[node.name] = remaining_callbacks;
        }

        node.ongoing_update = false;
        node.addMarker(VarDAG.VARDAG_MARKER_COMPUTED, this.varDAG);
    }

    private clean_var_dag() {
        // On va commencer par nettoyer l'arbre, en supprimant tous les noeuds non registered
        for (let i in this.varDAG.nodes) {
            let node: VarDAGNode = this.varDAG.nodes[i];

            if (node.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_DELETION)) {
                continue;
            }

            if (node.hasIncoming) {
                continue;
            }

            if (node.hasMarker(VarDAG.VARDAG_MARKER_REGISTERED)) {
                continue;
            }

            //  On peut supprimer un noeud à condition qu'il soit :
            //      - Pas registered
            //      - Un root


            // Suppression en 2 étapes, on marque pour suppression et on demande la suppression des noeuds marqués
            let visitor = new VarDAGMarkForDeletion(VarDAG.VARDAG_MARKER_MARKED_FOR_DELETION, this.varDAG);

            let nodes: VarDAGNode[] = [node];

            while (nodes && nodes.length) {

                let next_nodes: VarDAGNode[] = [];

                for (let j in nodes) {
                    let node_to_visit = nodes[j];

                    let can_continue = visitor.visitNode(node_to_visit);

                    if (!can_continue) {
                        continue;
                    }

                    for (let k in node_to_visit.outgoingNames) {
                        next_nodes.push(this.varDAG.nodes[node_to_visit.outgoingNames[k]]);
                    }
                }

                nodes = next_nodes;
            }
        }
        this.varDAG.deleteMarkedNodes(VarDAG.VARDAG_MARKER_MARKED_FOR_DELETION);
    }

    private async updateDatasWrapper() {
        // Il faut stocker une info de type sémaphore pour refuser de lancer l'update pendant qu'il est en cours
        // Mais du coup quand l'update est terminé, il est important de vérifier si de nouvelles demandes de mise à jour ont eues lieues.
        //  et si oui relancer une mise à jour.
        // ATTENTION : Risque d'explosion de la pile des appels si on a un temps trop élevé de résolution des variables, par rapport à une mise
        //  à jour automatique par exemple à intervale régulier, plus court que le temps de mise à jour.
        if (this.updateSemaphore) {
            return;
        }
        this.updateSemaphore_needs_reload = false;
        this.updateSemaphore = true;
        try {
            if (!this.is_waiting) {
                await this.updateDatas();
            }

            if (this.is_waiting) {
                this.updateSemaphore_needs_reload = true;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        this.updateSemaphore = false;

        if ((!!this.actions_waiting_for_release_of_update_semaphore) && (this.actions_waiting_for_release_of_update_semaphore.length)) {
            for (let i in this.actions_waiting_for_release_of_update_semaphore) {
                let action = this.actions_waiting_for_release_of_update_semaphore[i];

                await action();
            }
        }

        this.actions_waiting_for_release_of_update_semaphore = [];

        if (this.updateSemaphore_needs_reload) {
            // Si on a eu des demandes pendant ce calcul on relance le plus vite possible
            this.updateSemaphore_needs_reload = false;
            this.debouncedUpdateDatas();
        }
    }

    private debouncedUpdateDatas() {

        if (this.updateSemaphore) {
            // ça veut dire qu'on demande un update alors qu'un est déjà en cours.
            // Il faut pouvoir revenir s'en occuper
            this.updateSemaphore_needs_reload = true;
            return;
        }

        this.debounced_updatedatas_wrapper();
    }
}