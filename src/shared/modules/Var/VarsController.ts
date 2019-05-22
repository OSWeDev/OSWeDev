import * as debounce from 'lodash/debounce';
import TimeSegmentHandler from '../../tools/TimeSegmentHandler';
import ModuleDAO from '../DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../DAO/vos/InsertOrDeleteQueryResult';
import DataSourcesController from '../DataSource/DataSourcesController';
import IDataSourceController from '../DataSource/interfaces/IDataSourceController';
import IDistantVOBase from '../IDistantVOBase';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import VOsTypesManager from '../VOsTypesManager';
import VarDAG from './graph/var/VarDAG';
import VarDAGNode from './graph/var/VarDAGNode';
import VarDAGVisitorDefineNodeDeps from './graph/var/visitors/VarDAGVisitorDefineNodeDeps';
import VarDAGVisitorDefineNodePropagateRequest from './graph/var/visitors/VarDAGVisitorDefineNodePropagateRequest';
import VarDAGVisitorMarkForDeletion from './graph/var/visitors/VarDAGVisitorMarkForDeletion';
import VarDAGVisitorMarkForNextUpdate from './graph/var/visitors/VarDAGVisitorMarkForNextUpdate';
import VarDAGVisitorUnmarkComputed from './graph/var/visitors/VarDAGVisitorUnmarkComputed';
import IDateIndexedVarDataParam from './interfaces/IDateIndexedVarDataParam';
import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import SimpleVarConfVO from './simple_vars/SimpleVarConfVO';
import VarControllerBase from './VarControllerBase';
import VarConfVOBase from './vos/VarConfVOBase';
import VarUpdateCallback from './vos/VarUpdateCallback';
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
    private setIsStepping: (is_stepping: boolean) => void = null;
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

    private actions_waiting_for_release_of_update_semaphore: Array<() => Promise<void>> = [];

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

    public setVarData<T extends IVarDataVOBase>(varData: T, set_in_batch_cache: boolean = false) {

        if ((!varData) || (!this.getVarControllerById(varData.var_id)) || (!this.getVarControllerById(varData.var_id).varDataParamController)) {
            return;
        }
        let index: string = this.getIndex(varData);

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
                if (!!this.varDAG.nodes[this.getIndex(imported_data)]) {
                    if (!!this.setVarData_) {
                        this.setVarData_(imported_data);
                    }
                }
            }
        }
    }

    public getVarData<T extends IVarDataVOBase>(param: IVarDataParamVOBase, search_in_batch_cache: boolean = false): T {

        if ((!param) || (!this.getVarControllerById(param.var_id)) || (!this.getVarControllerById(param.var_id).varDataParamController)) {
            return null;
        }
        let index: string = this.getIndex(param);

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
        setIsStepping: (is_stepping: boolean) => void,
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

        this.setIsStepping = setIsStepping;
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

    public registerDataParam<TDataParam extends IVarDataParamVOBase>(param: TDataParam, reload_on_register: boolean = false, var_callbacks: VarUpdateCallback[] = null) {

        // On check la validité de la date si daté
        this.checkDateIndex(param);

        if (this.updateSemaphore) {
            let self = this;
            this.actions_waiting_for_release_of_update_semaphore.push(async () => {
                self.registerDataParam(param, reload_on_register, var_callbacks);
            });
            return false;
        }

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

        // Si la var est déjà calculée, on doit lancer le callback directement
        if ((!reload_on_register) && (!!actual_value)) {
            this.run_callbacks(param, this.getIndex(param));
        }
    }


    public getInclusiveEndParamTimeSegment<TDataParam extends IVarDataParamVOBase>(param: TDataParam): moment.Moment {

        if (!(param as any as IDateIndexedVarDataParam).date_index) {
            return null;
        }

        let date_index: string = (param as any as IDateIndexedVarDataParam).date_index;
        return TimeSegmentHandler.getInstance().getInclusiveEndTimeSegment(TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment(date_index), this.getVarControllerById(param.var_id).segment_type));
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

    public unregisterDataParam<TDataParam extends IVarDataParamVOBase>(param: TDataParam) {

        let index: string = this.getIndex(param);
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

            if ((!!self.actions_waiting_for_release_of_update_semaphore) && (self.actions_waiting_for_release_of_update_semaphore.length)) {
                for (let i in self.actions_waiting_for_release_of_update_semaphore) {
                    let action = self.actions_waiting_for_release_of_update_semaphore[i];

                    await action();
                }
            }

            self.actions_waiting_for_release_of_update_semaphore = [];

            if (self.updateSemaphore_needs_reload) {
                // Si on a eu des demandes pendant ce calcul on relance le plus vite possible
                self.updateSemaphore_needs_reload = false;
                self.debouncedUpdateDatas();
            }
        }, 500);
    }

    public getImportedVarsDatasByIndexFromArray<TImportedData extends IVarDataVOBase>(
        compteursValeursImportees: TImportedData[]): { [var_id: number]: { [param_index: string]: TImportedData } } {
        let res: { [var_id: number]: { [param_index: string]: TImportedData } } = {};

        for (let i in compteursValeursImportees) {
            let importedData: TImportedData = compteursValeursImportees[i];

            if ((!importedData) || (!this.getVarControllerById(importedData.var_id)) || (!this.getVarControllerById(importedData.var_id).varDataParamController)) {
                continue;
            }

            let param_index: string = this.getIndex(
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

        this.checkDateIndex(param);

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
    public unregisterVar(varConf: VarConfVOBase) {
        if (this.registered_vars && varConf && this.registered_vars[varConf.name]) {
            delete this.registered_vars[varConf.name];
            delete this.registered_vars_controller[varConf.name];
            delete this.registered_vars_by_ids[varConf.id];
            delete this.datasource_deps_by_var_id[varConf.id];
        }
    }

    /**
     * Compare params. Return true if same
     * @param p1
     * @param p2
     */
    public isSameParam(p1: IVarDataParamVOBase, p2: IVarDataParamVOBase): boolean {
        return VarsController.getInstance().getIndex(p1) == VarsController.getInstance().getIndex(p2);
    }

    /**
     * Compare params. Return true if same and in same order
     * @param ps1
     * @param ps2
     */
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

    /**
     * On va chercher à dépiler toutes les demandes en attente,
     *  et dans un ordre définit par le controller du type de var group
     */
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

    private async solveDeps() {

        let all_ok: boolean = (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED] &&
            (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED].length == this.varDAG.nodes_names.length)) ||
            ((!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING]) ||
                (!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING].length));

        while (!all_ok) {

            // On ajoute la gestion des chargements de datasources pre_deps
            //  Si on a pas tout chargé, et qu'on a des noeuds qui attendent un chargement de datasource, on lance ces chargement et on indique que la dep doit être résolue
            //  On demande à nouveau la résolution des deps
            //  et ainsi de suite, si on a encore d'autres deps à charger pour pouvoir avancer

            let nodes_names: string[] = Array.from(this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING]);

            while (nodes_names && nodes_names.length) {

                let new_nodes: VarDAGNode[] = [];
                for (let i in nodes_names) {
                    let node_name = nodes_names[i];

                    let new_nodes_: VarDAGNode[] = await VarDAGVisitorDefineNodeDeps.defineNodeDeps(this.varDAG.nodes[node_name], this.varDAG);

                    if ((!!new_nodes_) && (!!new_nodes_.length)) {
                        new_nodes = new_nodes.concat(new_nodes_);
                    }
                }

                nodes_names = [];
                for (let i in new_nodes) {
                    nodes_names.push(new_nodes[i].name);
                }
            }

            // await this.varDAG.visitAllMarkedOrUnmarkedNodes(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING, true, new VarDAGVisitorDefineNodeDeps(this.varDAG));

            all_ok = (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED] &&
                (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED].length == this.varDAG.nodes_names.length)) ||
                ((!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING]) ||
                    (!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING].length));

            if (!all_ok) {

                // On check qu'il y a des deps en attente
                if (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_PREDEPS_DATASOURCE_LOADING] &&
                    this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_PREDEPS_DATASOURCE_LOADING].length) {

                    // On doit récupérer les noeuds concernés et demander le chargement des datasources predeps
                    let nodes_names_to_preload: string[] = this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_NEEDS_PREDEPS_DATASOURCE_LOADING];

                    let datasources_batches: { [datasource_name: string]: { [index: string]: IVarDataParamVOBase } } = {};
                    let params: { [index: string]: IVarDataParamVOBase } = {};

                    for (let i in nodes_names_to_preload) {
                        let node_name_to_preload: string = nodes_names_to_preload[i];

                        let varDagNode: VarDAGNode = this.varDAG.nodes[node_name_to_preload];

                        let datasources_predeps: Array<IDataSourceController<any, any>> = VarsController.getInstance().getVarControllerById(varDagNode.param.var_id).getDataSourcesPredepsDependencies();

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

                        let datasource_controller: IDataSourceController<any, any> = DataSourcesController.getInstance().registeredDataSourcesController[i];
                        promises.push(datasource_controller.load_for_batch(datasource_batch));
                    }
                    await Promise.all(promises);

                    for (let node_name_to_preload in params) {
                        this.varDAG.nodes[node_name_to_preload].removeMarker(VarDAG.VARDAG_MARKER_NEEDS_PREDEPS_DATASOURCE_LOADING, this.varDAG, true);
                        this.varDAG.nodes[node_name_to_preload].addMarker(VarDAG.VARDAG_MARKER_PREDEPS_DATASOURCE_LOADED, this.varDAG);
                    }
                } else {
                    // Sinon on a pas tout ok, mais on sait pas résoudre, on indique une erreur
                    console.error('echec solveDeps:des deps restent, mais impossible de les charger');
                    return;
                }
            }
        }
    }

    private async solveDeps_batch(node: VarDAGNode) {

        let actual_node: VarDAGNode = node;
        let nodes_path: VarDAGNode[] = [];
        let continue_batch: boolean = true;

        if (node.hasMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED) || (!node.hasMarker(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING))) {
            return false;
        }

        while (continue_batch) {

            continue_batch = false;
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

                this.run_callbacks(actual_node.param, actual_node.name);
            }

            actual_node.removeMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE, this.varDAG, true);
            actual_node.addMarker(VarDAG.VARDAG_MARKER_COMPUTED, this.varDAG);

            if (nodes_path.length > 0) {
                actual_node = nodes_path.shift();
                continue_batch = true;
            }
        }
    }

    private run_callbacks(param: IVarDataParamVOBase, param_index: string) {
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

    private async propagateUpdateRequest() {

        if (!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE]) {
            return;
        }

        await this.varDAG.visitAllMarkedOrUnmarkedNodes(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, true, new VarDAGVisitorDefineNodePropagateRequest(this.varDAG));
    }

    /**
     * On charge les datas, en considérant tout l'arbre à plat, aucune dépendance et pas d'ordre de chargement
     */
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

    private async computeNode(node: VarDAGNode) {

        let actual_node: VarDAGNode = node;
        let nodes_path: VarDAGNode[] = [];
        let continue_compilation: boolean = true;

        if (node.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED)) {
            return;
        }

        if ((!node.hasMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE)) && (node.hasMarker(VarDAG.VARDAG_MARKER_COMPUTED_AT_LEAST_ONCE))) {
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