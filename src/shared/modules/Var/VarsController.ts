import * as debounce from 'lodash/debounce';
import ModuleDAO from '../DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../DAO/vos/InsertOrDeleteQueryResult';
import DataSourcesController from '../DataSource/DataSourcesController';
import IDataSourceController from '../DataSource/interfaces/IDataSourceController';
import IDistantVOBase from '../IDistantVOBase';
import PerfMonFunction from '../PerfMon/annotations/PerfMonFunction';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import VOsTypesManager from '../VOsTypesManager';
import VarDAG from './graph/var/VarDAG';
import VarDAGNode from './graph/var/VarDAGNode';
import VarDAGVisitorDefineNodeDeps from './graph/var/visitors/VarDAGVisitorDefineNodeDeps';
import VarDAGVisitorDefineNodePropagateRequest from './graph/var/visitors/VarDAGVisitorDefineNodePropagateRequest';
import VarDAGVisitorMarkForNextUpdate from './graph/var/visitors/VarDAGVisitorMarkForNextUpdate';
import VarDAGVisitorUnmarkComputed from './graph/var/visitors/VarDAGVisitorUnmarkComputed';
import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import SimpleVarConfVO from './simple_vars/SimpleVarConfVO';
import VarControllerBase from './VarControllerBase';
import VarConfVOBase from './vos/VarConfVOBase';
import VarDAGVisitorMarkForDeletion from './graph/var/visitors/VarDAGVisitorMarkForDeletion';
import VarUpdateCallback from './vos/VarUpdateCallback';
import IDateIndexedVarDataParam from './interfaces/IDateIndexedVarDataParam';
import TimeSegmentHandler from '../../tools/TimeSegmentHandler';
import moment = require('moment');

export default class VarsController {

    public static getInstance(): VarsController {
        if (!VarsController.instance) {
            VarsController.instance = new VarsController();
        }
        return VarsController.instance;
    }

    private static VARS_DESC_TRANSLATABLE_PREFIXES: string = "var.desc.";
    private static BATCH_UID: number = 0;

    private static instance: VarsController = null;

    public varDAG: VarDAG = new VarDAG(
        (name: string, dag: VarDAG, param: IVarDataParamVOBase) => new VarDAGNode(name, dag, param),
        this.onVarDAGNodeRemoval.bind(this));

    // public registeredDatasParamsIndexes: { [paramIndex: string]: number } = {};
    // public registeredDatasParams: { [paramIndex: string]: IVarDataParamVOBase } = {};

    // public dependencies_by_param: { [paramIndex: string]: IVarDataParamVOBase[] } = {};
    // public impacts_by_param: { [paramIndex: string]: IVarDataParamVOBase[] } = {};

    public datasource_deps_by_var_id: { [var_id: number]: Array<IDataSourceController<any, any>> } = {};
    // public BATCH_UIDs_by_var_id: { [var_id: number]: number } = {};

    public steps_names: { [step_number: number]: string } = {
        1: ''
    };

    public step_number: number = 1;
    public is_stepping: boolean = false;
    public is_waiting: boolean = false;

    public registered_var_callbacks: { [index: string]: VarUpdateCallback[] } = {};

    public registered_var_data_api_types: { [api_type: string]: boolean } = {};
    public imported_datas_by_index: { [index: string]: IVarDataVOBase } = {};
    public imported_datas_by_var_id: { [var_id: number]: { [index: string]: IVarDataVOBase } } = {};

    private varDatasStaticCache: { [index: string]: IVarDataVOBase } = {};

    // private last_batch_dependencies_by_param: { [paramIndex: string]: IVarDataParamVOBase[] } = {};
    // private last_batch_param_by_index: { [paramIndex: string]: IVarDataParamVOBase } = {};

    private setVarData_: (varData: IVarDataVOBase) => void = null;
    private removeVarData: (varDataParam: IVarDataParamVOBase) => void = null;
    private setStepNumber: (step_number: number) => void = null;
    private varDatas: { [paramIndex: string]: IVarDataVOBase } = null;

    private registered_vars: { [name: string]: VarConfVOBase } = {};
    private registered_vars_by_ids: { [id: number]: VarConfVOBase } = {};

    private registered_vars_controller: { [name: string]: VarControllerBase<any, any> } = {};

    private setUpdatingDatas: (updating: boolean) => void = null;

    private setIsWaiting: (isWaiting: boolean) => void = null;

    private getUpdatingParamsByVarsIds: { [index: string]: boolean } = null;
    private setUpdatingParamsByVarsIds: (updating_params_by_vars_ids: { [index: string]: boolean }) => void = null;

    // private waitingForUpdate: { [paramIndex: string]: IVarDataParamVOBase } = {};

    private updateSemaphore: boolean = false;
    private updateSemaphore_needs_reload: boolean = false;

    /**
     * This is meant to handle the datas before sending it the store to avoid multiple overloading problems
     */
    private varDatasBATCHCache: { [index: string]: IVarDataVOBase } = {};


    private datasource_deps_defined: boolean = false;

    protected constructor() {
    }

    // /**
    //  * pour UnitTest TestUnit uniquement
    //  */
    // get varDatasStaticCache_(): { [index: string]: IVarDataVOBase } {
    //     return this.varDatasStaticCache;
    // }

    // /**
    //  * pour UnitTest TestUnit uniquement
    //  */
    // get waitingForUpdate_(): { [paramIndex: string]: IVarDataParamVOBase } {
    //     return this.waitingForUpdate;
    // }

    /**
     * pour UnitTest TestUnit uniquement
     */
    get updateSemaphore_(): boolean {
        return this.updateSemaphore;
    }

    // /**
    //  * pour UnitTest TestUnit uniquement
    //  */
    // get varDatasBATCHCache_(): { [BATCH_UID: number]: { [index: string]: IVarDataVOBase } } {
    //     return this.varDatasBATCHCache;
    // }

    // /**
    //  * pour UnitTest TestUnit uniquement
    //  */
    // get BATCH_UIDs_by_var_id_(): { [var_id: number]: number } {
    //     return this.BATCH_UIDs_by_var_id;
    // }


    // /**
    //  * TODO TestUnit : on doit indiquer si un impact va avoir lieu sur les registered quand on change un param
    //  */
    // public impacts_registered_vars(param: IVarDataParamVOBase): boolean {

    //     let index: string = this.getIndex(param);
    //     if ((!!this.impacts_by_param[index]) && (this.impacts_by_param[index].length > 0)) {
    //         return true;
    //     }
    // }

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
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + this.getVarConfById(varConf_id).name + '.translatable_name' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_description_code(varConf_id: number): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + this.getVarConfById(varConf_id).name + '.translatable_description' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_params_desc_code(varConf_id: number): string {
        return VarsController.VARS_DESC_TRANSLATABLE_PREFIXES + this.getVarConfById(varConf_id).name + '.translatable_params_desc' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    /**
     * Pushes all BatchCached datas of this Batch_uid to the store and clears the cache
     */
    @PerfMonFunction
    public flushVarsDatas() {
        if (!this.varDatasBATCHCache) {
            return;
        }

        for (let index in this.varDatasBATCHCache) {
            let varData: IVarDataVOBase = this.varDatasBATCHCache[index];

            // Set the data finally
            this.setVarData(varData);
        }

        this.varDatasBATCHCache = {};
    }

    @PerfMonFunction
    public setVarData<T extends IVarDataVOBase>(varData: T, set_in_batch_cache: boolean = false) {

        if ((!varData) || (!this.getVarControllerById(varData.var_id)) || (!this.getVarControllerById(varData.var_id).varDataParamController)) {
            return;
        }
        let index: string = this.getVarControllerById(varData.var_id).varDataParamController.getIndex(varData);

        // WARNING : Might be strange some day when the static cache is updated by a BATCH since it should only
        //  be updated after the end of the batch, but the batch sometimes uses methods that need data that
        //  are being created by the batch itself.... if some funny datas are being calculated, you might want to check that thing
        this.varDatasStaticCache[index] = varData;

        if (set_in_batch_cache) {

            this.varDatasBATCHCache[index] = varData;

            return;
        }

        if (!!this.varDAG.nodes[index]) {
            if (!!this.setVarData_) {
                this.setVarData_(varData);
            }
        }
    }

    /**
     * 2 objectifs : mettre à jour le cache du batch en cours, et mettre à jour le store pour les datas qui sont affichées
     * @param imported_datas
     */
    @PerfMonFunction
    public setImportedDatas<T extends IVarDataVOBase>(imported_datas: { [var_id: number]: { [param_index: string]: T } }) {

        if (!imported_datas) {
            return null;
        }

        for (let var_id_s in imported_datas) {
            let var_id: number = parseInt(var_id_s.toString());

            // let BATCH_UID: number = this.BATCH_UIDs_by_var_id[var_id];

            // if (!((BATCH_UID != null) && (typeof BATCH_UID != 'undefined'))) {
            //     console.error('setImportedDatasInBatchCache:Tried set datas in unknown batch');
            //     return;
            // }

            this.varDatasBATCHCache = imported_datas[var_id_s];

            // On met à jour le store pour l'affichage directement ici par ce qu'on peut déjà afficher les datas issues d'un import
            for (let j in imported_datas[var_id_s]) {
                let imported_data: T = imported_datas[var_id_s][j];
                if (!!this.varDAG.nodes[this.getVarControllerById(imported_data.var_id).varDataParamController.getIndex(imported_data)]) {
                    if (!!this.setVarData_) {
                        this.setVarData_(imported_data);
                    }
                }
            }
        }
    }

    @PerfMonFunction
    public getVarData<T extends IVarDataVOBase>(param: IVarDataParamVOBase, search_in_batch_cache: boolean = false): T {

        if ((!param) || (!this.getVarControllerById(param.var_id)) || (!this.getVarControllerById(param.var_id).varDataParamController)) {
            return null;
        }
        let index: string = this.getVarControllerById(param.var_id).varDataParamController.getIndex(param);

        if (search_in_batch_cache) {
            // // On sait qu'on doit chercher dans les datas des batchs actuels, mais en fait l'id du batch est intimement lié
            // //  au type de contenu demandé
            // let BATCH_UID: number = this.BATCH_UIDs_by_var_id[param.var_id];

            // if ((BATCH_UID != null) && (typeof BATCH_UID != 'undefined') && this.varDatasBATCHCache &&
            //     this.varDatasBATCHCache[BATCH_UID] && this.varDatasBATCHCache[BATCH_UID][index]) {
            if (!!this.varDatasBATCHCache[index]) {
                return this.varDatasBATCHCache[index] as T;
            }
            // }
        }

        // Si on doit l'afficher il faut que ce soit synchro dans le store, sinon on utilise le cache static
        let varData: T = null;
        if (!!this.varDAG.nodes[index]) {

            if (!(index && this.varDatas && this.varDatas[index])) {
                return null;
            }

            varData = this.varDatas[index] as T;
        } else {
            if (!(index && this.varDatasStaticCache && this.varDatasStaticCache[index])) {
                return null;
            }

            varData = this.varDatasStaticCache[index] as T;
        }
        if (!varData) {
            return null;
        }
        return varData;
    }

    public registerStoreHandlers<TData extends IVarDataVOBase>(
        getVarData: { [paramIndex: string]: TData },
        setVarData: (varData: IVarDataVOBase) => void,
        removeVarData: (varDataParam: IVarDataParamVOBase) => void,
        setUpdatingDatas: (updating: boolean) => void,
        getUpdatingParamsByVarsIds: { [index: string]: boolean },
        setUpdatingParamsByVarsIds: (updating_params_by_vars_ids: { [index: string]: boolean }) => void,
        // isStepping: boolean,
        // isWaiting: boolean,
        setIsWaiting: (isWaiting: boolean) => void,
        setStepNumber: (step_number: number) => void) {
        this.varDatas = getVarData;
        this.setVarData_ = setVarData;
        this.removeVarData = removeVarData;
        this.setUpdatingDatas = setUpdatingDatas;
        this.getUpdatingParamsByVarsIds = getUpdatingParamsByVarsIds;
        this.setUpdatingParamsByVarsIds = setUpdatingParamsByVarsIds;

        // this.isStepping = isStepping;
        // this.isWaiting = isWaiting;
        this.setIsWaiting = setIsWaiting;

        this.setStepNumber = setStepNumber;
    }

    public define_datasource_deps() {

        if (!this.datasource_deps_defined) {

            for (let i in this.registered_vars_controller) {
                let registered_var_controller = this.registered_vars_controller[i];

                let datasource_deps: Array<IDataSourceController<any, any>> = this.get_datasource_deps(registered_var_controller);
                datasource_deps = (!!datasource_deps) ? datasource_deps : [];
                this.datasource_deps_by_var_id[registered_var_controller.varConf.id] = datasource_deps;
            }
            this.datasource_deps_defined = true;
        }
    }

    public get_datasource_deps(controller: VarControllerBase<any, any>): Array<IDataSourceController<any, any>> {
        let datasource_deps: Array<IDataSourceController<any, any>> = controller.getDataSourcesDependencies();
        datasource_deps = (!!datasource_deps) ? datasource_deps : [];

        return datasource_deps;
    }

    @PerfMonFunction
    public stageUpdateVoUpdate(vo_before_update: IDistantVOBase, vo_after_update: IDistantVOBase) {

        this.define_datasource_deps();

        let res: { [index: string]: IVarDataParamVOBase } = DataSourcesController.getInstance().getUpdatedParamsFromVoUpdate(vo_before_update, vo_after_update);

        if (!res) {
            return;
        }

        for (let i in res) {
            this.stageUpdateData(res[i]);
        }
    }

    // @PerfMonFunction
    // public stageUpdateData<TDataParam extends IVarDataParamVOBase>(param: TDataParam) {
    //     if (!this.waitingForUpdate) {
    //         this.waitingForUpdate = {};
    //     }

    //     if ((!param) || (!this.getVarControllerById(param.var_id)) || (!this.getVarControllerById(param.var_id).varDataParamController) ||
    //         (!this.getVarControllerById(param.var_id).varDataParamController.getIndex)) {
    //         return;
    //     }

    //     let param_controller: VarDataParamControllerBase<TDataParam> = this.getVarControllerById(param.var_id).varDataParamController;
    //     let param_index: string = param_controller.getIndex(param);
    //     if (!this.waitingForUpdate[param_index]) {
    //         this.waitingForUpdate[param_index] = param;
    //     }

    //     // On demande au controller si on doit invalider d'autres params (par exemple un solde recalculé au 02/01 remet en cause celui du 03/01 et 05/01, ...)
    //     let params_needing_update: TDataParam[] = param_controller.getImpactedParamsList(param, this.registeredDatasParams as { [index: string]: TDataParam });
    //     if (params_needing_update && params_needing_update.length) {
    //         for (let i in params_needing_update) {
    //             let param_needing_update: TDataParam = params_needing_update[i];

    //             param_index = param_controller.getIndex(param_needing_update);
    //             if (!this.waitingForUpdate[param_index]) {
    //                 this.waitingForUpdate[param_index] = param_needing_update;
    //             }
    //         }
    //     }

    //     this.debouncedUpdateDatas();
    // }

    @PerfMonFunction
    public stageUpdateData<TDataParam extends IVarDataParamVOBase>(param: TDataParam) {

        let index: string = this.getIndex(param);
        if ((!index) || (!this.varDAG.nodes[index])) {
            return;
        }

        let node = this.varDAG.nodes[index];
        // Si en cours d'update, on marque pour le prochain batch et on ne demande pas la mise à jour ça sert à rien
        if (this.step_number != 1) {
            if ((!node.hasMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE)) && (!node.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE)) &&
                (!node.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE))) {
                node.addMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE, this.varDAG);
            }
        } else {
            node.addMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, this.varDAG);
            this.debouncedUpdateDatas();
        }
    }

    public checkDateIndex<TDataParam extends IVarDataParamVOBase>(param: TDataParam): void {
        if ((!param) || (!(param as any as IDateIndexedVarDataParam).date_index)) {
            return;
        }

        let date_indexed: IDateIndexedVarDataParam = param as any as IDateIndexedVarDataParam;
        date_indexed.date_index = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment(date_indexed.date_index), this.getVarControllerById(param.var_id).segment_type).dateIndex;
    }

    @PerfMonFunction
    public registerDataParam<TDataParam extends IVarDataParamVOBase>(param: TDataParam, reload_on_register: boolean = false, var_callbacks: VarUpdateCallback[] = null) {

        // On check la validité de la date si daté
        this.checkDateIndex(param);

        this.varDAG.registerParams([param]);

        if (!!var_callbacks) {

            let param_index = this.getIndex(param);
            for (let i in var_callbacks) {
                let var_callback = var_callbacks[i];

                if (!this.registered_var_callbacks[param_index]) {
                    this.registered_var_callbacks[param_index] = [];
                }
                this.registered_var_callbacks[param_index].push(var_callback);
            }
        }

        let actual_value = this.getVarData(param);
        if (reload_on_register || (!actual_value)) {
            this.stageUpdateData(param);
        }
    }

    public unregisterCallbacks<TDataParam extends IVarDataParamVOBase>(param: TDataParam, var_callbacks_uids: number[]) {

        let param_index = this.getIndex(param);
        let remaining_callbacks: VarUpdateCallback[] = [];

        for (let j in this.registered_var_callbacks[param_index]) {
            let registered_var_callback = this.registered_var_callbacks[param_index][j];

            if (var_callbacks_uids.indexOf(registered_var_callback.UID) < 0) {
                remaining_callbacks.push(registered_var_callback);
            }
        }

        this.registered_var_callbacks[param_index] = remaining_callbacks;
    }

    public async registerDataParamAndReturnVarData<TDataParam extends IVarDataParamVOBase>(param: TDataParam, reload_on_register: boolean = false): Promise<IVarDataVOBase> {

        // On check la validité de la date si daté
        this.checkDateIndex(param);

        let self = this;
        return new Promise<IVarDataVOBase>((accept, reject) => {

            try {

                let var_callback_once = VarUpdateCallback.newCallbackOnce(this.getIndex(param), (varData: IVarDataVOBase) => {
                    accept(varData);
                });

                self.registerDataParam(param, reload_on_register, [var_callback_once]);
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    }

    public onVarDAGNodeRemoval(node: VarDAGNode) {

        if ((!node) || (!node.param)) {
            return;
        }
        let index: string = this.getIndex(node.param);

        if (!!this.varDatasStaticCache[index]) {
            delete this.varDatasStaticCache[index];
        }
        if (!!this.setVarData_) {
            this.removeVarData(node.param);
        }
    }

    @PerfMonFunction
    public unregisterDataParam<TDataParam extends IVarDataParamVOBase>(param: TDataParam) {

        let index: string = this.getIndex(param);
        if (!index) {
            return;
        }

        this.varDAG.unregisterIndexes([index]);
    }

    get debouncedUpdateDatas() {

        if (this.updateSemaphore) {
            // ça veut dire qu'on demande un update alors qu'un est déjà en cours.
            // Il faut pouvoir revenir s'en occuper
            this.updateSemaphore_needs_reload = true;
            return () => { };
        }

        let self = this;
        return debounce(async () => {
            // Il faut stocker une info de type sémaphore pour refuser de lancer l'update pendant qu'il est en cours
            // Mais du coup quand l'update est terminé, il est important de vérifier si de nouvelles demandes de mise à jour ont eues lieues.
            //  et si oui relancer une mise à jour.
            // ATTENTION : Risque d'explosion de la pile des appels si on a un temps trop élevé de résolution des variables, par rapport à une mise
            //  à jour automatique par exemple à intervale régulier, plus court que le temps de mise à jour.
            if (self.updateSemaphore) {
                return;
            }
            self.updateSemaphore_needs_reload = false;
            self.updateSemaphore = true;
            try {
                if (!self.is_waiting) {
                    await self.updateDatas();
                }

                if (self.is_waiting) {
                    self.updateSemaphore_needs_reload = true;
                }
            } catch (error) {
                console.error(error);
            }

            self.updateSemaphore = false;
            if (self.updateSemaphore_needs_reload) {
                // Si on a eu des demandes pendant ce calcul on relance le plus vite possible
                self.updateSemaphore_needs_reload = false;
                self.debouncedUpdateDatas();
            }
        }, 100);
    }

    @PerfMonFunction
    public getImportedVarsDatasByIndexFromArray<TImportedData extends IVarDataVOBase>(
        compteursValeursImportees: TImportedData[]): { [var_id: number]: { [param_index: string]: TImportedData } } {
        let res: { [var_id: number]: { [param_index: string]: TImportedData } } = {};

        for (let i in compteursValeursImportees) {
            let importedData: TImportedData = compteursValeursImportees[i];

            if ((!importedData) || (!this.getVarControllerById(importedData.var_id)) || (!this.getVarControllerById(importedData.var_id).varDataParamController) ||
                (!this.getVarControllerById(importedData.var_id).varDataParamController.getIndex)) {
                continue;
            }

            let param_index: string = this.getVarControllerById(importedData.var_id).varDataParamController.getIndex(
                importedData
            );

            if (!res[importedData.var_id]) {
                res[importedData.var_id] = {};
            }

            res[importedData.var_id][param_index] = importedData;
        }

        return res;
    }

    public getIndex<TDataParam extends IVarDataParamVOBase>(param: TDataParam): string {
        if ((!param) || (!this.getVarControllerById(param.var_id)) || (!this.getVarControllerById(param.var_id).varDataParamController)) {
            return null;
        }

        return this.getVarControllerById(param.var_id).varDataParamController.getIndex(param);
    }

    public getParam<TDataParam extends IVarDataParamVOBase>(param_index: string): TDataParam {

        if (!param_index) {
            return null;
        }

        let regexp = /^([0-9]+)_.*$/;
        if (!regexp.test(param_index)) {
            return null;
        }

        let res = regexp.exec(param_index);
        try {

            let var_id: number = res && res.length ? parseInt(res[0]) : null;
            if (var_id == null) {
                return null;
            }

            return this.getVarControllerById(var_id).varDataParamController.getParam(param_index);
        } catch (error) {
        }
        return null;
    }

    public getVarConf(var_name: string): VarConfVOBase {
        return this.registered_vars ? (this.registered_vars[var_name] ? this.registered_vars[var_name] : null) : null;
    }

    public getVarConfById(var_id: number): VarConfVOBase {
        return this.registered_vars_by_ids ? (this.registered_vars_by_ids[var_id] ? this.registered_vars_by_ids[var_id] : null) : null;
    }

    public getVarController(var_name: string): VarControllerBase<any, any> {
        return this.registered_vars_controller ? (this.registered_vars_controller[var_name] ? this.registered_vars_controller[var_name] : null) : null;
    }

    public getVarControllerById(var_id: number): VarControllerBase<any, any> {
        if ((!this.registered_vars_by_ids) || (!this.registered_vars_by_ids[var_id]) ||
            (!this.registered_vars_controller)) {
            return null;
        }

        let res = this.registered_vars_controller[this.registered_vars_by_ids[var_id].name];
        return res ? res : null;
    }

    @PerfMonFunction
    public async registerVar(varConf: VarConfVOBase, controller: VarControllerBase<any, any>): Promise<VarConfVOBase> {
        if ((!varConf) || (!controller)) {
            return null;
        }

        if (this.registered_vars && this.registered_vars[varConf.name]) {
            this.setVar(this.registered_vars[varConf.name], controller);
            return this.registered_vars[varConf.name];
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

    /**
     * Utilisé pour les tests unitaires
     */
    @PerfMonFunction
    public unregisterVar(varConf: VarConfVOBase) {
        if (this.registered_vars && varConf && this.registered_vars[varConf.name]) {
            delete this.registered_vars[varConf.name];
            delete this.registered_vars_controller[varConf.name];
            delete this.registered_vars_by_ids[varConf.id];
            delete this.datasource_deps_by_var_id[varConf.id];
        }
    }

    // /**
    //  * Public pour TestUnit TODO TESTUNIT UNITTEST
    //  */
    // @PerfMonFunction
    // public addDepsToBatch(params_copy: { [paramIndex: string]: IVarDataParamVOBase }): { [paramIndex: string]: IVarDataParamVOBase } {
    //     let res: { [paramIndex: string]: IVarDataParamVOBase } = Object.assign({}, params_copy);
    //     let todo_list: { [paramIndex: string]: IVarDataParamVOBase } = Object.assign({}, params_copy);

    //     // Il faut une map des datas registered pour voir parmis elles lesquelles sont à déclencher en tant que voisine.
    //     let registeredDatasParams_by_var_id: { [var_id: number]: { [paramIndex: string]: IVarDataParamVOBase } } = {};
    //     for (let index in this.registeredDatasParams) {
    //         let registeredDatasParam: IVarDataParamVOBase = this.registeredDatasParams[index];

    //         if (!registeredDatasParams_by_var_id[registeredDatasParam.var_id]) {
    //             registeredDatasParams_by_var_id[registeredDatasParam.var_id] = {};
    //         }
    //         registeredDatasParams_by_var_id[registeredDatasParam.var_id][index] = registeredDatasParam;
    //     }


    //     while (ObjectHandler.getInstance().hasAtLeastOneAttribute(todo_list)) {

    //         let new_todo_list: { [paramIndex: string]: IVarDataParamVOBase } = {};
    //         let todo_list_by_var_id: { [var_id: number]: IVarDataParamVOBase[] } = {};
    //         for (let param_index in todo_list) {
    //             let param: IVarDataParamVOBase = todo_list[param_index];

    //             if (!todo_list_by_var_id[param.var_id]) {
    //                 todo_list_by_var_id[param.var_id] = [];
    //             }
    //             todo_list_by_var_id[param.var_id].push(param);

    //             if (this.impacts_by_param[param_index]) {
    //                 for (let i in this.impacts_by_param[param_index]) {
    //                     let impact_param: IVarDataParamVOBase = this.impacts_by_param[param_index][i];
    //                     let impact_index: string = this.getVarControllerById(impact_param.var_id).varDataParamController.getIndex(impact_param);

    //                     if (!res[impact_index]) {
    //                         res[impact_index] = impact_param;
    //                         new_todo_list[impact_index] = impact_param;
    //                     }
    //                 }
    //             }
    //         }

    //         // TODO FIXME : à voir c'est peut-etre la meilleure solution, juste pas parfait sur le papier
    //         //  on devrait savoir précisément qui dépend de quoi même en transverse.
    //         //  ici on passe par la notion de daté et cumulé, et on demande alors parmis tous les éléments qui
    //         //  sont en cache et dans le store si on doit recharger du coup ou pas
    //         //  En fait on va demander au contrôleur, et lui peut utiliser des infos d'imports, ou de reset
    //         //  pour décider de pas impacter toute la terre...
    //         for (let var_id_s in todo_list_by_var_id) {
    //             let var_id: number = parseInt(var_id_s.toString());
    //             let params: IVarDataParamVOBase[] = todo_list_by_var_id[var_id];

    //             let impacteds_self: IVarDataParamVOBase[] = this.getVarControllerById(var_id).getSelfImpacted(params, registeredDatasParams_by_var_id[var_id]);

    //             for (let i in impacteds_self) {
    //                 let impacted_self: IVarDataParamVOBase = impacteds_self[i];
    //                 let impacted_self_index: string = this.getVarControllerById(impacted_self.var_id).varDataParamController.getIndex(impacted_self);

    //                 if (!res[impacted_self_index]) {
    //                     res[impacted_self_index] = impacted_self;
    //                     new_todo_list[impacted_self_index] = impacted_self;
    //                 }
    //             }
    //         }

    //         todo_list = new_todo_list;
    //     }

    //     return res;
    // }


    // /**
    //  * Public pour TestUnit TODO TESTUNIT UNITTEST
    //  */
    // @PerfMonFunction
    // public getDataParamsByVarId(
    //     params: { [paramIndex: string]: IVarDataParamVOBase },
    //     imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } }): { [var_id: number]: { [index: string]: IVarDataParamVOBase } } {
    //     let ordered_params_by_vars_ids: { [var_id: number]: { [index: string]: IVarDataParamVOBase } } = {};

    //     // On organise un peu les datas
    //     for (let paramIndex in params) {
    //         let param: IVarDataParamVOBase = params[paramIndex];

    //         if (imported_datas && imported_datas[param.var_id] && imported_datas[param.var_id][paramIndex]) {
    //             // Si la data est importée, on a pas besoin de l'inclure dans le batch
    //             continue;
    //         }

    //         let index: string = this.getVarControllerById(param.var_id).varDataParamController.getIndex(param);

    //         if (!ordered_params_by_vars_ids[param.var_id]) {
    //             ordered_params_by_vars_ids[param.var_id] = {};
    //         }
    //         ordered_params_by_vars_ids[param.var_id][index] = param;
    //     }

    //     return ordered_params_by_vars_ids;
    // }

    // /**
    //  * Public pour TestUnit TODO TESTUNIT UNITTEST
    //  */
    // @PerfMonFunction
    // public sortDataParamsForUpdate(params_by_vars_ids: { [var_id: number]: { [index: string]: IVarDataParamVOBase } }) {

    //     // On demande l'ordre dans lequel résoudre les params
    //     for (let i in params_by_vars_ids) {
    //         let ordered_params: { [index: string]: IVarDataParamVOBase } = params_by_vars_ids[i];
    //         let var_id: number = parseInt(i.toString());

    //         if ((!this.getVarControllerById(var_id)) || (!this.getVarControllerById(var_id).varDataParamController) ||
    //             (!this.getVarControllerById(var_id).varDataParamController.sortParams)) {
    //             continue;
    //         }
    //         this.getVarControllerById(var_id).varDataParamController.sortParams(ordered_params);
    //     }
    // }

    // /**
    //  * Public pour TestUnit TODO TESTUNIT UNITTEST
    //  */
    // @PerfMonFunction
    // public async loadVarsDatasAndLoadParamsDeps(
    //     ordered_params_by_vars_ids: { [var_id: number]: { [index: string]: IVarDataParamVOBase } },
    //     deps_by_var_id: { [from_var_id: number]: number[] },
    //     imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } }
    // ) {
    //     this.last_batch_dependencies_by_param = {};
    //     this.last_batch_param_by_index = {};

    //     let deps_by_var_id_copy: { [from_var_id: number]: number[] } = Object.assign({}, deps_by_var_id);
    //     while (deps_by_var_id_copy && ObjectHandler.getInstance().hasAtLeastOneAttribute(deps_by_var_id_copy)) {

    //         let has_resolved_something: boolean = false;

    //         let next_deps_by_var_id_copy: { [from_var_id: number]: number[] } = {};
    //         for (let index in deps_by_var_id_copy) {
    //             let var_id: number = parseInt(index.toString());
    //             let deps_vars_id: number[] = deps_by_var_id_copy[var_id];

    //             if (this.hasDependancy(var_id, deps_by_var_id_copy)) {
    //                 next_deps_by_var_id_copy[var_id] = deps_vars_id;
    //                 continue;
    //             }

    //             has_resolved_something = true;

    //             // Charger les datas et les params dépendants pour les ajouter à la liste en attente
    //             if (!this.getVarControllerById(var_id)) {
    //                 throw new Error('loadDatasVars: controller registering check failed:' + var_id);
    //             }

    //             await this.getVarControllerById(var_id).begin_batch(
    //                 this.BATCH_UIDs_by_var_id[var_id],
    //                 ordered_params_by_vars_ids[var_id],
    //                 imported_datas
    //             );

    //             for (let i in ordered_params_by_vars_ids[var_id]) {

    //                 let param: IVarDataParamVOBase = ordered_params_by_vars_ids[var_id][i];

    //                 let dependencies: IVarDataParamVOBase[] = await this.getVarControllerById(var_id).getParamsDependencies(
    //                     this.BATCH_UIDs_by_var_id[var_id],
    //                     param,
    //                     ordered_params_by_vars_ids,
    //                     imported_datas
    //                 );

    //                 let cleaned_dependencies: IVarDataParamVOBase[] = [];
    //                 for (let j in dependencies) {
    //                     let dependency: IVarDataParamVOBase = dependencies[j];
    //                     let dependency_index: string = this.getVarControllerById(dependency.var_id).varDataParamController.getIndex(dependency);

    //                     if (imported_datas && imported_datas[dependency.var_id] && imported_datas[dependency.var_id][dependency_index]) {
    //                         // La data est importée, inutile de l'ajouter au batch
    //                         // Par contre ça veut dire aussi qu'il faut ajouter ces datas importées dans les caches dans le départ
    //                         continue;
    //                     }

    //                     if (!ordered_params_by_vars_ids[dependency.var_id]) {
    //                         ordered_params_by_vars_ids[dependency.var_id] = {};
    //                     }
    //                     ordered_params_by_vars_ids[dependency.var_id][dependency_index] = dependency;
    //                     cleaned_dependencies.push(dependency);
    //                 }
    //                 let param_index: string = this.getVarControllerById(var_id).varDataParamController.getIndex(param);
    //                 this.last_batch_param_by_index[param_index] = param;
    //                 this.last_batch_dependencies_by_param[param_index] = cleaned_dependencies;
    //             }
    //         }
    //         deps_by_var_id_copy = next_deps_by_var_id_copy;

    //         if (!has_resolved_something) {
    //             throw new Error('loadDatasVars: dep check failed:' + JSON.stringify(deps_by_var_id_copy));
    //         }
    //     }
    // }

    /**
     * Compare params. Return true if same
     * @param p1
     * @param p2
     */
    @PerfMonFunction
    public isSameParam(p1: IVarDataParamVOBase, p2: IVarDataParamVOBase): boolean {
        return VarsController.getInstance().getIndex(p1) == VarsController.getInstance().getIndex(p2);
    }

    /**
     * Compare params. Return true if same and in same order
     * @param ps1
     * @param ps2
     */
    @PerfMonFunction
    public isSameParamArray(ps1: IVarDataParamVOBase[], ps2: IVarDataParamVOBase[]): boolean {
        ps1 = (!!ps1) ? ps1 : [];
        ps2 = (!!ps2) ? ps2 : [];

        if (ps1.length != ps2.length) {
            return false;
        }

        for (let i in ps1) {
            let p1: IVarDataParamVOBase = ps1[i];
            let p2: IVarDataParamVOBase = ps2[i];

            if (VarsController.getInstance().getIndex(p1) != VarsController.getInstance().getIndex(p2)) {
                return false;
            }
        }
        return true;
    }

    @PerfMonFunction
    private setVar(varConf: VarConfVOBase, controller: VarControllerBase<any, any>) {
        this.registered_vars[varConf.name] = varConf;
        this.registered_vars_controller[varConf.name] = controller;
        this.registered_vars_by_ids[varConf.id] = varConf;
        this.registered_var_data_api_types[varConf.var_data_vo_type] = true;

        let datasource_deps: Array<IDataSourceController<any, any>> = controller.getDataSourcesDependencies();
        datasource_deps = (!!datasource_deps) ? datasource_deps : [];
        datasource_deps.forEach((datasource_dep) => {
            datasource_dep.registerDataSource();
        });
    }

    // /**
    //  * On va chercher à dépiler toutes les demandes en attente,
    //  *  et dans un ordre définit par le controller du type de var group
    //  */
    // @PerfMonFunction
    // private async updateDatas() {

    //     if (!!this.setUpdatingDatas) {
    //         this.setUpdatingDatas(true);
    //     }

    //     // On passe par une copie pour ne pas dépendre des demandes de mise à jour en cours
    //     //  et on réinitialise immédiatement les waiting for update, comme ça on peut voir ce qui a été demandé pendant qu'on
    //     //  mettait à jour (important pour éviter des bugs assez difficiles à identifier potentiellement)
    //     let params_copy: { [paramIndex: string]: IVarDataParamVOBase } = Object.assign({}, this.waitingForUpdate);
    //     this.BATCH_UIDs_by_var_id = {};
    //     this.waitingForUpdate = {};

    //     // On ajoute au batch de mise à jour les calculs qui dépendent des vars actuellement prévues en mise à jour
    //     params_copy = this.addDepsToBatch(params_copy);

    //     // On résoud les deps par group_id avant de chercher à savoir de quel param exactement on dépend
    //     let deps_by_var_id: { [from_var_id: number]: number[] } = await this.solveVarsDependencies(params_copy);

    //     // FIXME TODO DATASOURCES : En attendant les datasources propres
    //     //  On a besoin pour lister les params deps de imports de chaque type de vars
    //     //  Quand on a toutes les deps a priori on peut charger les datas importées (a condition de pas s'intéresser aux params)
    //     let imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } } = await this.loadAllDatasImported(deps_by_var_id);
    //     this.setImportedDatas(imported_datas);

    //     let ordered_params_by_vars_ids: { [var_id: number]: { [index: string]: IVarDataParamVOBase } } = this.getDataParamsByVarId(params_copy, imported_datas);

    //     // On met à jour le store une première fois pour informer qu'on lance un update ciblé
    //     if (!!this.setUpdatingParamsByVarsIds) {
    //         this.setUpdatingParamsByVarsIds(ordered_params_by_vars_ids);
    //         // L'objectif en vrai c'est d'attendre le nexttick de vuejs, donc à voir comment on peut faire, le sleep 1 semble inefficace
    //         await ThreadHandler.getInstance().sleep(1);
    //     }

    //     // On demande le chargement des datas par ordre inverse de dépendance et dès qu'on a chargé les datas sources
    //     //  on peut demander les dépendances du niveau suivant et avancer dans l'arbre
    //     await this.loadVarsDatasAndLoadParamsDeps(ordered_params_by_vars_ids, deps_by_var_id, imported_datas);

    //     this.sortDataParamsForUpdate(ordered_params_by_vars_ids);

    //     // On met à jour le store une deuxième fois pour informer qu'on fait un update des datas impactées également
    //     if (!!this.setUpdatingParamsByVarsIds) {
    //         this.setUpdatingParamsByVarsIds(ordered_params_by_vars_ids);
    //         // L'objectif en vrai c'est d'attendre le nexttick de vuejs, donc à voir comment on peut faire, le sleep 1 semble inefficace
    //         await ThreadHandler.getInstance().sleep(1);
    //     }

    //     // Et une fois que tout est propre, on lance la mise à jour de chaque élément
    //     await this.updateEachData(deps_by_var_id, ordered_params_by_vars_ids, imported_datas);

    //     // Enfin quand toutes les datas sont à jour on pousse sur le store
    //     for (let i in this.BATCH_UIDs_by_var_id) {
    //         this.flushVarsDatas(this.BATCH_UIDs_by_var_id[i]);
    //     }
    //     this.mergeDeps();

    //     if (!!this.setUpdatingParamsByVarsIds) {
    //         this.setUpdatingParamsByVarsIds({});
    //     }

    //     if (!!this.setUpdatingDatas) {
    //         this.setUpdatingDatas(false);
    //     }
    // }

    /**
     * On va chercher à dépiler toutes les demandes en attente,
     *  et dans un ordre définit par le controller du type de var group
     */
    @PerfMonFunction
    private async updateDatas() {

        switch (this.step_number) {
            default:
            case null:
            case 1:

                let marked_for_updates = this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE];
                if ((!marked_for_updates) || (!marked_for_updates.length)) {
                    return;
                }

                if (!!this.setUpdatingDatas) {
                    this.setUpdatingDatas(true);
                }

                // On charge les données importées si c'est pas encore fait (une mise à jour de donnée importée devra être faite via registration de dao
                //  ou manuellement en éditant le noeud du varDAG)
                await this.loadImportedDatas();

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
                // à ce stade
                await this.solveDeps();

                if ((!!this.is_stepping) && this.setStepNumber) {
                    this.setIsWaiting(true);
                    this.setStepNumber(30);
                    break;
                }

            case 30:

                // Une fois les deps à jour, on propage la demande de mise à jour à travers les deps
                await this.propagateUpdateRequest();

                // On indique dans le store la mise à jour des vars
                this.setUpdatingParamsToStore();

                if ((!!this.is_stepping) && this.setStepNumber) {
                    this.setIsWaiting(true);
                    this.setStepNumber(40);
                    break;
                }

            case 40:

                this.clean_var_dag();

                // On indique dans le store la mise à jour des vars
                this.setUpdatingParamsToStore();

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

                // // On visite pour résoudre les calculs
                for (let i in this.varDAG.roots) {
                    await this.computeNode(this.varDAG.roots[i]);
                }

                if ((!!this.is_stepping) && this.setStepNumber) {
                    this.setIsWaiting(true);
                    this.setStepNumber(70);
                    break;
                }

            case 70:

                await this.varDAG.visitAllMarkedOrUnmarkedNodes(VarDAG.VARDAG_MARKER_COMPUTED, true, new VarDAGVisitorUnmarkComputed(this.varDAG));

                if ((!!this.is_stepping) && this.setStepNumber) {
                    this.setIsWaiting(true);
                    this.setStepNumber(80);
                    break;
                }

            case 80:

                this.flushVarsDatas();

                if (!!this.setUpdatingParamsByVarsIds) {
                    this.setUpdatingParamsByVarsIds({});
                }

                if ((!!this.is_stepping) && this.setStepNumber) {
                    this.setIsWaiting(true);
                    this.setStepNumber(90);
                    break;
                }

            case 90:

                let needs_new_batch: boolean = false;

                if ((!!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE]) &&
                    (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE].length > 0)) {

                    await this.varDAG.visitAllMarkedOrUnmarkedNodes(
                        VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE, true, new VarDAGVisitorMarkForNextUpdate(this.varDAG));
                    needs_new_batch = true;
                }

                if ((!!this.is_stepping) && this.setStepNumber) {
                    this.setIsWaiting(true);
                    this.setStepNumber(1);
                    break;
                }

                if (needs_new_batch) {

                    await this.updateDatas();
                }
                //

                if (!!this.setUpdatingDatas) {
                    this.setUpdatingDatas(false);
                }
        }
    }

    private setUpdatingParamsToStore() {
        let res: { [index: string]: boolean } = {};

        for (let i in this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_ONGOING_UPDATE]) {
            let index: string = this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_ONGOING_UPDATE][i];

            res[index] = true;
        }

        if (!!this.setUpdatingParamsByVarsIds) {
            this.setUpdatingParamsByVarsIds(res);
        }
    }

    @PerfMonFunction
    private populateListVarIds(current_var_id: number, var_id_list: number[]) {

        let controller: VarControllerBase<any, any> = this.getVarControllerById(current_var_id);

        let deps_ids: number[] = controller.getVarsIdsDependencies();

        for (let i in deps_ids) {
            let dep_id = deps_ids[i];

            if (var_id_list.indexOf(dep_id) < 0) {
                var_id_list.push(dep_id);
                this.populateListVarIds(dep_id, var_id_list);
            }
        }
    }

    /**
     * Troisième version : on charge toutes les datas de toutes les var_ids présents dans l'arbre ou dont dépendent des éléments de l'arbre
     */
    @PerfMonFunction
    private async loadImportedDatas() {

        let var_ids: number[] = [];
        for (let marker_name in this.varDAG.marked_nodes_names) {
            if (!marker_name.startsWith(VarDAG.VARDAG_MARKER_VAR_ID)) {
                continue;
            }

            let var_id: number = parseInt(marker_name.replace(VarDAG.VARDAG_MARKER_VAR_ID, ""));
            if (var_ids.indexOf(var_id) < 0) {

                var_ids.push(var_id);
                this.populateListVarIds(var_id, var_ids);
            }
        }

        let var_imported_data_vo_types: string[] = [];
        let var_ids_by_imported_data_vo_types: { [var_imported_data_vo_type: string]: number[] } = {};
        for (let i in var_ids) {
            let varConf: VarConfVOBase = this.getVarConfById(var_ids[i]);

            if (var_imported_data_vo_types.indexOf(varConf.var_data_vo_type) < 0) {
                var_imported_data_vo_types.push(varConf.var_data_vo_type);
                var_ids_by_imported_data_vo_types[varConf.var_data_vo_type] = [];
            }

            if (var_ids_by_imported_data_vo_types[varConf.var_data_vo_type].indexOf(var_ids[i]) < 0) {

                var_ids_by_imported_data_vo_types[varConf.var_data_vo_type].push(var_ids[i]);
            }
        }

        for (let i in var_imported_data_vo_types) {
            let var_imported_data_vo_type: string = var_imported_data_vo_types[i];

            let importeds: IVarDataVOBase[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IVarDataVOBase>(
                var_imported_data_vo_type, 'var_id', var_ids_by_imported_data_vo_types[var_imported_data_vo_type]);

            if (importeds) {
                for (let j in importeds) {
                    let imported: IVarDataVOBase = importeds[j];
                    let importedIndex: string = this.getIndex(imported);

                    // Stocke tout et si on peut on met à jour les nodes existants
                    if (!!this.varDAG.nodes[importedIndex]) {
                        this.varDAG.nodes[importedIndex].setImportedData(imported, this.varDAG);
                    }

                    if (!this.imported_datas_by_var_id[imported.var_id]) {
                        this.imported_datas_by_var_id[imported.var_id] = {};
                    }
                    this.imported_datas_by_var_id[imported.var_id][importedIndex] = imported;
                    this.imported_datas_by_index[importedIndex] = imported;
                }
            }
        }
    }

    // @PerfMonFunction
    // private async loadImportedDatas() {

    //     // But : tout charger en un minimum de requête
    //     // On récupère la liste des type de vos qu'il faut charger et pour ces types de données, on charge tout pour le moment.
    //     // FIXME QUICK & DIRTY tout charger n'est certainement pas la bonne solution / pas idéale en tout cas
    //     let var_imported_data_vo_types: string[] = [];
    //     let var_ids_by_imported_data_vo_types: { [var_imported_data_vo_type: string]: number[] } = {};
    //     for (let i in this.varDAG.nodes) {
    //         let node: VarDAGNode = this.varDAG.nodes[i];
    //         let param: IVarDataParamVOBase = node.param;
    //         let varConf: VarConfVOBase = this.getVarConfById(param.var_id);

    //         // A cette étape on ne sait pas qui doit être chargé ou pas
    //         // if (!node.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE)) {
    //         //     continue;
    //         // }

    //         if (var_imported_data_vo_types.indexOf(varConf.var_data_vo_type) < 0) {
    //             var_imported_data_vo_types.push(varConf.var_data_vo_type);
    //             var_ids_by_imported_data_vo_types[varConf.var_data_vo_type] = [];
    //         }

    //         if (var_ids_by_imported_data_vo_types[varConf.var_data_vo_type].indexOf(param.var_id) < 0) {
    //             var_ids_by_imported_data_vo_types[varConf.var_data_vo_type].push(param.var_id);
    //         }
    //     }

    //     for (let i in var_imported_data_vo_types) {
    //         let var_imported_data_vo_type: string = var_imported_data_vo_types[i];

    //         let importeds: IVarDataVOBase[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IVarDataVOBase>(
    //             var_imported_data_vo_type, 'var_id', var_ids_by_imported_data_vo_types[var_imported_data_vo_type]);

    //         if (importeds) {
    //             for (let j in importeds) {
    //                 let imported: IVarDataVOBase = importeds[j];
    //                 let importedIndex: string = this.getIndex(imported);

    //                 // On importe potentiellement des choses inutiles, on les stocke pas
    //                 if (!!this.varDAG.nodes[importedIndex]) {
    //                     this.varDAG.nodes[importedIndex].setImportedData(imported, this.varDAG);
    //                 }
    //             }
    //         }
    //     }
    // }

    // @PerfMonFunction
    // private async loadAllDatasImported(deps_by_var_id: { [from_var_id: number]: number[] }): Promise<{ [var_id: number]: { [param_index: string]: IVarDataVOBase } }> {

    //     // But : tout charger en un minimum de requête
    //     // On récupère la liste des type de vos qu'il faut charger et pour ces types de données, on charge tout pour le moment.
    //     // FIXME QUICK & DIRTY tout charger n'est certainement pas la bonne solution / pas idéale en tout cas
    //     let var_imported_data_vo_types: string[] = [];
    //     let var_ids_by_imported_data_vo_types: { [var_imported_data_vo_type: string]: number[] } = {};
    //     for (let i in deps_by_var_id) {
    //         let var_id: number = parseInt(i.toString());

    //         if (var_imported_data_vo_types.indexOf(this.registered_vars_by_ids[var_id].var_data_vo_type) < 0) {
    //             var_imported_data_vo_types.push(this.registered_vars_by_ids[var_id].var_data_vo_type);
    //             var_ids_by_imported_data_vo_types[this.registered_vars_by_ids[var_id].var_data_vo_type] = [];
    //         }
    //         var_ids_by_imported_data_vo_types[this.registered_vars_by_ids[var_id].var_data_vo_type].push(var_id);
    //     }

    //     let importedDatas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } } = {};

    //     for (let i in var_imported_data_vo_types) {
    //         let var_imported_data_vo_type: string = var_imported_data_vo_types[i];

    //         let importeds: IVarDataVOBase[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IVarDataVOBase>(
    //             var_imported_data_vo_type, 'var_id', var_ids_by_imported_data_vo_types[var_imported_data_vo_type]);
    //         if (importeds) {
    //             for (let j in importeds) {
    //                 let imported: IVarDataVOBase = importeds[j];

    //                 if (!importedDatas[imported.var_id]) {
    //                     importedDatas[imported.var_id] = {};
    //                 }
    //                 importedDatas[imported.var_id][this.getVarControllerById(imported.var_id).varDataParamController.getIndex(imported)] = imported;
    //             }
    //         }
    //     }

    //     return importedDatas;
    // }

    // @PerfMonFunction
    // private async updateEachData(
    //     deps_by_var_id: { [from_var_id: number]: number[] },
    //     ordered_params_by_vars_ids: { [var_id: number]: { [index: string]: IVarDataParamVOBase } },
    //     imported_datas: { [var_id: number]: { [param_index: string]: IVarDataVOBase } }) {

    //     let solved_var_ids: number[] = [];
    //     let vars_ids_to_solve: number[] = ObjectHandler.getInstance().getNumberMapIndexes(ordered_params_by_vars_ids);

    //     // On doit résoudre en respectant l'ordre des deps
    //     while (vars_ids_to_solve && vars_ids_to_solve.length) {

    //         // Needed for the Q&D version of the tree resolution
    //         let solved_something: boolean = false;
    //         for (let i in vars_ids_to_solve) {
    //             let var_id: number = vars_ids_to_solve[i];

    //             if (deps_by_var_id[var_id] && deps_by_var_id[var_id].length) {
    //                 let dependency_check: boolean = true;
    //                 for (let j in deps_by_var_id[var_id]) {
    //                     if (solved_var_ids.indexOf(deps_by_var_id[var_id][j]) < 0) {
    //                         dependency_check = false;
    //                         break;
    //                     }
    //                 }

    //                 if (!dependency_check) {
    //                     continue;
    //                 }
    //             }

    //             let vars_params: { [index: string]: IVarDataParamVOBase } = ordered_params_by_vars_ids[var_id];

    //             // On peut vouloir faire des chargements de données groupés et les nettoyer après le calcul
    //             let BATCH_UID: number = this.BATCH_UIDs_by_var_id[var_id];
    //             let controller: VarControllerBase<any, any> = this.getVarControllerById(var_id);

    //             for (let j in vars_params) {
    //                 let var_param: IVarDataParamVOBase = vars_params[j];

    //                 await controller.updateData(BATCH_UID, var_param, imported_datas);
    //             }

    //             await controller.end_batch(BATCH_UID, vars_params, imported_datas);

    //             delete ordered_params_by_vars_ids[var_id];
    //             solved_var_ids.push(var_id);
    //             solved_something = true;
    //         }

    //         if (!solved_something) {
    //             // Plus rien qu'on puisse résoudre mais reste des choses en attente ...
    //             throw new Error('updateEachData:Dependencies check failed');
    //         }

    //         vars_ids_to_solve = ObjectHandler.getInstance().getNumberMapIndexes(ordered_params_by_vars_ids);
    //     }
    // }

    // @PerfMonFunction
    // private async solveDeps() {

    //     if (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED] &&
    //         (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED].length == this.varDAG.nodes_names.length)) {
    //         // tout est déjà chargé
    //         return;
    //     }

    //     // On charge les deps de toutes les roots
    //     await this.varDAG.visitAllFromRootsOrLeafs((dag: VarDAG) => new VarDAGVisitorDefineDeps(dag));

    //     if ((!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED]) ||
    //         (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED].length != this.varDAG.nodes_names.length)) {
    //         console.error('VARDAG incohérence : Le nombre de noeuds chargés est différent du nombre de noeuds total:' +
    //             this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED].length + ":" + this.varDAG.nodes_names.length);
    //     }
    // }

    @PerfMonFunction
    private async solveDeps() {

        if ((this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED] &&
            (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED].length == this.varDAG.nodes_names.length)) ||
            ((!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING]) ||
                (!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING].length))) {
            // tout est déjà chargé
            return;
        }

        await this.varDAG.visitAllMarkedOrUnmarkedNodes(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING, true, new VarDAGVisitorDefineNodeDeps(this.varDAG));
    }

    // @PerfMonFunction
    // private async propagateUpdateRequest() {

    //     if (!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE]) {
    //         return;
    //     }

    //     let markeds_for_update: string[] = Array.from(this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE]);
    //     for (let i in markeds_for_update) {
    //         let marked_for_update: VarDAGNode = this.varDAG.nodes[markeds_for_update[i]];

    //         // On visite dans les 2 sens (bottom/up et up/bottom) puisqu'on veut les deps mais aussi les impacts
    //         // Les impacts sont toujours marqués, alors que les deps ne sont marquées que si pas encore computed
    //         //  (on a pas demandé un update sur la dep donc pourquoi la recompiler ?)
    //         await marked_for_update.visit(new DAGVisitorSimpleMarker(
    //             this.varDAG, true, VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, false, marked_for_update.name, true, VarDAG.VARDAG_MARKER_COMPUTED_AT_LEAST_ONCE));
    //         await marked_for_update.visit(new DAGVisitorSimpleMarker(this.varDAG, false, VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, false, marked_for_update.name, true));
    //     }
    // }

    @PerfMonFunction
    private async propagateUpdateRequest() {

        if (!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE]) {
            return;
        }

        await this.varDAG.visitAllMarkedOrUnmarkedNodes(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, true, new VarDAGVisitorDefineNodePropagateRequest(this.varDAG));
    }

    /**
     * On charge les datas, en considérant tout l'arbre à plat, aucune dépendance et pas d'ordre de chargement
     */
    @PerfMonFunction
    private async loadDatasources() {

        // On doit charger toutes les datas dont dépendent les ongoing_update
        let node_names: string[] = Array.from(this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_ONGOING_UPDATE]);
        let source_deps_by_node_names: { [node_name: string]: string[] } = {};
        let var_params_by_source_deps: { [ds_name: string]: IVarDataParamVOBase[] } = {};

        for (let i in node_names) {
            let node_name: string = node_names[i];
            let node: VarDAGNode = this.varDAG.nodes[node_name];
            let controller: VarControllerBase<any, any> = this.getVarControllerById(node.param.var_id);
            let datasource_deps: Array<IDataSourceController<any, any>> = controller.getDataSourcesDependencies();

            source_deps_by_node_names[node_name] = [];
            for (let j in datasource_deps) {
                let datasource_dep: IDataSourceController<any, any> = datasource_deps[j];

                if (!var_params_by_source_deps[datasource_dep.name]) {
                    var_params_by_source_deps[datasource_dep.name] = [];
                }
                source_deps_by_node_names[node_name].push(datasource_dep.name);
                var_params_by_source_deps[datasource_dep.name].push(node.param);
            }
        }

        let promises: Array<Promise<any>> = [];
        for (let ds_name in var_params_by_source_deps) {
            let ds_controller: IDataSourceController<any, any> = DataSourcesController.getInstance().registeredDataSourcesController[ds_name];

            promises.push(ds_controller.load_for_batch(var_params_by_source_deps[ds_name]));
        }
        await Promise.all(promises);
    }

    // @PerfMonFunction
    // private async computeNode(node: VarDAGNode) {

    //     // Si le noeud est pas noté en ongoing update, on a rien à foutre ici
    //     if (!node.hasMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE)) {
    //         return;
    //     }

    //     // On peut compute un noeud si tous les outgoing sont soit computed, soit pas ongoing et computed_once[]
    //     // si un outgoing répond pas à ce descriptif, on doit le compute
    //     for (let i in node.outgoing) {
    //         let outgoing: VarDAGNode = node.outgoing[i] as VarDAGNode;

    //         if (outgoing.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED)) {
    //             continue;
    //         }

    //         if ((!outgoing.hasMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE)) && (outgoing.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED_AT_LEAST_ONCE))) {
    //             continue;
    //         }

    //         await this.computeNode(outgoing);
    //     }

    //     // On doit pouvoir compute à ce stade
    //     await VarsController.getInstance().getVarControllerById(node.param.var_id).updateData(node, this.varDAG);

    //     if (this.registered_var_callbacks_once[node.name] && this.registered_var_callbacks_once[node.name].length) {
    //         for (let i in this.registered_var_callbacks_once[node.name]) {
    //             let callback = this.registered_var_callbacks_once[node.name][i];

    //             if (callback) {
    //                 callback(this.getVarData(node.param, true));
    //             }
    //         }
    //         this.registered_var_callbacks_once[node.name] = null;
    //     }

    //     node.removeMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE, this.varDAG, true);
    //     node.addMarker(VarDAG.VARDAG_MARKER_COMPUTED, this.varDAG);
    // }

    @PerfMonFunction
    private async computeNode(node: VarDAGNode) {

        let actual_node: VarDAGNode = node;
        let nodes_path: VarDAGNode[] = [];
        let continue_compilation: boolean = true;

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

                    if ((!outgoing.hasMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE)) && (outgoing.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED_AT_LEAST_ONCE))) {
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
            await VarsController.getInstance().getVarControllerById(actual_node.param.var_id).updateData(actual_node, this.varDAG);

            if (this.registered_var_callbacks[actual_node.name] && this.registered_var_callbacks[actual_node.name].length) {

                let remaining_callbacks: VarUpdateCallback[] = [];

                for (let i in this.registered_var_callbacks[actual_node.name]) {
                    let callback = this.registered_var_callbacks[actual_node.name][i];

                    if (!!callback.callback) {
                        callback.callback(this.getVarData(actual_node.param, true));
                    }

                    if (callback.type == VarUpdateCallback.TYPE_EVERY) {
                        remaining_callbacks.push(callback);
                    }
                }
                this.registered_var_callbacks[actual_node.name] = remaining_callbacks;
            }

            actual_node.removeMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE, this.varDAG, true);
            actual_node.addMarker(VarDAG.VARDAG_MARKER_COMPUTED, this.varDAG);

            if (nodes_path.length > 0) {
                actual_node = nodes_path.shift();
                continue_compilation = true;
            }
        }
    }

    @PerfMonFunction
    private clean_var_dag() {
        // On va commencer par nettoyer l'arbre, en supprimant tous les noeuds non registered
        for (let i in this.varDAG.nodes) {
            let node: VarDAGNode = this.varDAG.nodes[i];

            //  On peut supprimer un noeud à condition qu'il soit :
            //      - Pas registered
            //      - Un root
            if ((!node.hasMarker(VarDAG.VARDAG_MARKER_REGISTERED)) &&
                (!node.hasIncoming)) {

                // Suppression en 2 étapes, on marque pour suppression et on demande la suppression des noeuds marqués
                node.visit(new VarDAGVisitorMarkForDeletion(VarDAG.VARDAG_MARKER_MARKED_FOR_DELETION, this.varDAG));
            }
        }
        this.varDAG.deleteMarkedNodes(VarDAG.VARDAG_MARKER_MARKED_FOR_DELETION);
    }
}