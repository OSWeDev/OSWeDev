import * as debounce from 'lodash/debounce';
import ObjectHandler from '../../tools/ObjectHandler';
import TimeSegmentHandler from '../../tools/TimeSegmentHandler';
import TSRangeHandler from '../../tools/TSRangeHandler';
import ModuleDAO from '../DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../DAO/vos/InsertOrDeleteQueryResult';
import TSRange from '../DataRender/vos/TSRange';
import DataSourcesController from '../DataSource/DataSourcesController';
import IDataSourceController from '../DataSource/interfaces/IDataSourceController';
import IDistantVOBase from '../IDistantVOBase';
import MatroidController from '../Matroid/MatroidController';
import MatroidCutResult from '../Matroid/vos/MatroidCutResult';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import VOsTypesManager from '../VOsTypesManager';
import CumulativVarController from './CumulativVarController';
import VarDAG from './graph/var/VarDAG';
import VarDAGNode from './graph/var/VarDAGNode';
import VarDAGDefineNodeDeps from './graph/var/visitors/VarDAGDefineNodeDeps';
import VarDAGDefineNodePropagateRequest from './graph/var/visitors/VarDAGDefineNodePropagateRequest';
import VarDAGMarkForDeletion from './graph/var/visitors/VarDAGMarkForDeletion';
import VarDAGMarkForNextUpdate from './graph/var/visitors/VarDAGMarkForNextUpdate';
import IDateIndexedVarDataParam from './interfaces/IDateIndexedVarDataParam';
import ISimpleNumberVarMatroidData from './interfaces/ISimpleNumberVarMatroidData';
import ITSRangesVarDataParam from './interfaces/ITSRangesVarDataParam';
import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import IVarMatroidDataParamVO from './interfaces/IVarMatroidDataParamVO';
import IVarMatroidDataVO from './interfaces/IVarMatroidDataVO';
import SimpleVarConfVO from './simple_vars/SimpleVarConfVO';
import VarControllerBase from './VarControllerBase';
import VarConfVOBase from './vos/VarConfVOBase';
import VarUpdateCallback from './vos/VarUpdateCallback';
import moment = require('moment');
import TimeHandler from '../../tools/TimeHandler';
import ThreadHandler from '../../tools/ThreadHandler';

export default class VarsController {

    public static VALUE_TYPE_LABELS: string[] = ['var_data.value_type.import', 'var_data.value_type.computed'];
    public static VALUE_TYPE_IMPORT: number = 0;
    public static VALUE_TYPE_COMPUTED: number = 1;
    public static VALUE_TYPE_MIXED: number = 2;

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

    public var_debouncer: number = 300;


    public registered_var_callbacks: { [index: string]: VarUpdateCallback[] } = {};

    public registered_var_data_api_types: { [api_type: string]: boolean } = {};
    public imported_datas_by_index: { [index: string]: IVarDataVOBase } = {};
    public imported_datas_by_var_id: { [var_id: number]: { [index: string]: IVarDataVOBase } } = {};

    public set_dependencies_heatmap_version: (dependencies_heatmap_version: number) => void = null;

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

    private registered_vars_controller_: { [name: string]: VarControllerBase<any, any> } = {};

    private setUpdatingDatas: (updating: boolean) => void = null;

    private setIsWaiting: (isWaiting: boolean) => void = null;

    private getUpdatingParamsByVarsIds: { [index: string]: boolean } = null;
    private setUpdatingParamsByVarsIds: (updating_params_by_vars_ids: { [index: string]: boolean }) => void = null;


    private loaded_imported_datas_of_vars_ids: { [index: string]: boolean } = {};

    // private waitingForUpdate: { [paramIndex: string]: IVarDataParamVOBase } = {};

    private updateSemaphore: boolean = false;
    private updateSemaphore_needs_reload: boolean = false;

    /**
     * This is meant to handle the datas before sending it the store to avoid multiple overloading problems
     */
    private varDatasBATCHCache: { [index: string]: IVarDataVOBase } = {};


    private datasource_deps_defined: boolean = false;

    private actions_waiting_for_release_of_update_semaphore: Array<() => Promise<void>> = [];

    // Imporssible de stocker dans le var_param qui est souvent copié avcec object.assign.... ou alors faut blocker et passer par une factory (mais en js on peut ps bloquer en fait object.assign ...)
    private checked_var_indexes: { [index: string]: boolean } = {};

    private debounced_updatedatas_wrapper = debounce(this.updateDatasWrapper, this.var_debouncer);


    private get_cardinal_time: number = 0;
    private intesect_time: number = 0;



    protected constructor() {
    }

    get registered_vars_controller(): { [name: string]: VarControllerBase<any, any> } {
        return this.registered_vars_controller_;
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

        return this.getVarDataByIndex(index, search_in_batch_cache);
    }

    public getVarDataByIndex<T extends IVarDataVOBase>(index: string, search_in_batch_cache: boolean = false): T {

        if (!index) {
            return null;
        }

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
        if (index && (!!this.varDAG.nodes[index]) && this.varDatas) {

            if (!this.varDatas[index]) {
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
        setStepNumber: (step_number: number) => void,
        set_dependencies_heatmap_version: (dependencies_heatmap_version: number) => void) {
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

        this.set_dependencies_heatmap_version = set_dependencies_heatmap_version;
    }

    public define_datasource_deps() {

        if (!this.datasource_deps_defined) {

            for (let i in this.registered_vars_controller_) {
                let registered_var_controller = this.registered_vars_controller_[i];

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

    public stageUpdateData<TDataParam extends IVarDataParamVOBase>(param: TDataParam, force_reload_if_updating: boolean = false) {

        let index: string = this.getIndex(param);
        if ((!index) || (!this.varDAG.nodes[index])) {
            return;
        }

        let node = this.varDAG.nodes[index];
        // Si en cours d'update, on marque pour le prochain batch et on ne demande pas la mise à jour ça sert à rien
        if ((this.step_number != 1) && (!force_reload_if_updating)) {

            if ((!node.hasMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE)) && (!node.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE)) &&
                (!node.hasMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE))) {
                node.addMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE, this.varDAG);
            }
        } else {
            node.addMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, this.varDAG);
            this.debouncedUpdateDatas();
        }
    }

    public stageUpdateDataAndReloadImports<TDataParam extends IVarDataParamVOBase>(param: TDataParam, remove_import: boolean = false) {

        let index: string = this.getIndex<TDataParam>(param);
        if ((!index) || (!this.varDAG.nodes[index])) {
            return;
        }

        this.varDAG.nodes[index].removeMarker(VarDAG.VARDAG_MARKER_loadImportedOrPrecompiledDatas_ok, this.varDAG, true);

        this.varDAG.nodes[index].removeMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED, this.varDAG, true);
        this.varDAG.nodes[index].addMarker(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING, this.varDAG);

        this.loaded_imported_datas_of_vars_ids[param.var_id] = false;

        if (remove_import) {
            if (this.imported_datas_by_var_id) {
                if (this.imported_datas_by_var_id[param.var_id]) {
                    delete this.imported_datas_by_var_id[param.var_id][index];
                }

                delete this.imported_datas_by_index[index];
            }

            this.varDAG.nodes[index].setImportedData(null, this.varDAG);
        }

        this.stageUpdateData(param, true);
    }

    public checkDateIndex<TDataParam extends IVarDataParamVOBase>(param: TDataParam): void {
        // FIXME DIRTY test sur le date_index
        if ((!param) || (!(param as any as IDateIndexedVarDataParam).date_index) || (this.checked_var_indexes[this._getIndex(param)]) || (!this.getVarControllerById(param.var_id))) {
            return;
        }

        let date_indexed: IDateIndexedVarDataParam = param as any as IDateIndexedVarDataParam;
        date_indexed.date_index = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment(date_indexed.date_index), this.getVarControllerById(param.var_id).segment_type).dateIndex;
        this.checked_var_indexes[this._getIndex(date_indexed)] = true;
    }

    public registerDataParam<TDataParam extends IVarDataParamVOBase>(
        param: TDataParam,
        reload_on_register: boolean = false,
        var_callbacks: VarUpdateCallback[] = null,
        ignore_unvalidated_datas: boolean = false) {

        if (!param) {
            return false;
        }

        // On check la validité de la date si daté
        this.checkDateIndex(param);
        // Idem pour les compteurs matroids
        this.check_tsrange_on_resetable_var(param);

        if (this.updateSemaphore) {
            let self = this;
            this.actions_waiting_for_release_of_update_semaphore.push(async () => {
                self.registerDataParam(param, reload_on_register, var_callbacks);
            });
            return false;
        }

        this.varDAG.registerParams([param], ignore_unvalidated_datas);

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

        if (!param) {
            return false;
        }

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

    public async registerDataParamAndReturnVarData<TDataParam extends IVarDataParamVOBase>(
        param: TDataParam, reload_on_register: boolean = false, ignore_unvalidated_datas: boolean = false): Promise<IVarDataVOBase> {

        /**
         * Quand on recalcule des vars, on peut avoir des index qui changent pas mais des ids qui évoluent, il faut reprendre le nouveau
         *  si on dit explicitement que c'est un rechargement
         */
        if (reload_on_register) {
            let index = this.getIndex(param);

            if ((!!this.varDAG.nodes[index]) && (!!this.varDAG.nodes[index].param) && (this.varDAG.nodes[index].param.id != param.id)) {
                this.varDAG.nodes[index].param.id = param.id;
            }
        }

        this.changeTsRanges(param);
        // On check la validité de la date si daté
        this.checkDateIndex(param);
        // Idem pour les compteurs matroids
        this.check_tsrange_on_resetable_var(param);

        let self = this;
        return new Promise<IVarDataVOBase>((accept, reject) => {

            try {

                let var_callback_once = VarUpdateCallback.newCallbackOnce(this.getIndex(param), (varData: IVarDataVOBase) => {
                    self.unregisterDataParam(param);
                    accept(varData);
                });

                self.registerDataParam(param, reload_on_register, [var_callback_once], ignore_unvalidated_datas);
            } catch (error) {
                console.error(error);
                reject(error);
            }
        });
    }

    public async registerDataParamsAndReturnVarDatas<TDataParam extends IVarDataParamVOBase, TData extends TDataParam & IVarDataVOBase>(
        params: TDataParam[], reload_on_register: boolean = false, ignore_unvalidated_datas: boolean = false): Promise<TData[]> {

        let res: TData[] = [];

        try {
            let promises = [];

            for (let i in params) {
                promises.push((async () => {
                    await this.registerDataParamAndReturnVarData(params[i], reload_on_register, ignore_unvalidated_datas);
                })());
            }
            await Promise.all(promises);

            for (let i in params) {
                let param = params[i];

                let data: TData = this.getVarData(param, true);

                if (!!data) {
                    res.push(data);
                }
            }
        } catch (error) {
            return null;
        }

        return (res && res.length) ? res : null;
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
        if (!param) {
            return null;
        }

        this.checkDateIndex(param);
        // TODO FIXME ASAP : A supprimer si on voit qu'il n'y a pas de problème
        //  le but est de limiter ce contrôle qui peut couter cher
        // this.check_tsrange_on_resetable_var(param);

        return this._getIndex(param);
    }

    // public getParam<TDataParam extends IVarDataParamVOBase>(param_index: string): TDataParam {

    //     if (!param_index) {
    //         return null;
    //     }

    //     let regexp = /^([0-9]+)_.*$/;
    //     if (!regexp.test(param_index)) {
    //         return null;
    //     }

    //     let res = regexp.exec(param_index);
    //     try {

    //         let var_id: number = res && res.length ? parseInt(res[0]) : null;
    //         if (var_id == null) {
    //             return null;
    //         }

    //         return this.getVarControllerById(var_id).varDataParamController.getParam(param_index);
    //     } catch (error) {
    //     }
    //     return null;
    // }

    /**
     * FIXME TODO ASAP VARS TU
     * Fonction qui permet de définir avec une date le tsrange qu'on veut vraiment calculer dans le cas d'un compteur
     *  par exemple un compteur de solde d'heures veut la somme des soldes quotidiens depuis le dernier reset ou imports mais
     *  ils sont gérés plus tard
     */
    public get_tsrange_on_resetable_var(var_id: number, target: moment.Moment, min_inclusiv: boolean, max_inclusiv: boolean, segment_type: number): TSRange {

        let controller = VarsController.getInstance().getVarControllerById(var_id);

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

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[conf.var_data_vo_type];
        if (!moduletable.isMatroidTable) {
            return null;
        }

        if (max_inclusiv) {
            TimeSegmentHandler.getInstance().incMoment(target, controller.segment_type, 1);
            TimeSegmentHandler.getInstance().forceStartSegment(target, controller.segment_type);
        }
        min_inclusiv = true;
        max_inclusiv = false;

        let closest_earlier_reset_date: moment.Moment = CumulativVarController.getInstance().getClosestPreviousCompteurResetDate(
            target, false, conf.has_yearly_reset, conf.yearly_reset_day_in_month, conf.yearly_reset_month);
        return TSRange.createNew(closest_earlier_reset_date, target, min_inclusiv, max_inclusiv, segment_type);
    }

    public changeTsRanges(param: IVarDataParamVOBase): void {
        if (!param) {
            return;
        }

        let controller = VarsController.getInstance().getVarControllerById(param.var_id);

        if (!controller) {
            return;
        }

        let conf = controller.varConf;

        if (!conf) {
            return;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[conf.var_data_vo_type];
        if (!moduletable.isMatroidTable) {
            return;
        }

        let tsranged_param = param as ITSRangesVarDataParam;
        if (!tsranged_param.ts_ranges) {
            return;
        }

        for (let i in tsranged_param.ts_ranges) {
            let ts_range = tsranged_param.ts_ranges[i];

            let end_range = TSRangeHandler.getInstance().getSegmentedMax(ts_range, controller.segment_type);
            let start_range = TSRangeHandler.getInstance().getSegmentedMin(ts_range, controller.segment_type);

            if ((start_range == null) || (end_range == null)) {
                return null;
            }

            TimeSegmentHandler.getInstance().incMoment(end_range, controller.segment_type, 1);
            TimeSegmentHandler.getInstance().forceStartSegment(end_range, controller.segment_type);

            if ((!ts_range.min_inclusiv) || (ts_range.max_inclusiv) ||
                (!ts_range.min.isSame(start_range)) || (!ts_range.max.isSame(end_range))) {
                ts_range.min = start_range;
                ts_range.max = end_range;
                ts_range.min_inclusiv = true;
                ts_range.max_inclusiv = false;
            }
        }
    }

    /**
     * FIXME TODO ASAP VARS TU
     * Fonction qui permet de vérifier que le range de date n'inclut pas un reset de compteur, auquel cas on enlève la partie qui dépasse
     * La fonction vérifie qu'on est bien sur un matroid avec un reset
     * On ajoute les notions de tests sur les segmentations (jour / mois / semaine / année) pour agrandir les ranges en conséquence si nécessaire
     *  ça permet d'avoir des ranges uniformes pour parler toujours des mêmes choses
     *  pour l'instant on fait pour année 2019 : (2019, 2019, true, true) et pas (2019, 2020, true, false) a voir si c'est pertinent. au moins c'est cohérent avec les autres fonctions atuellement
     */
    public check_tsrange_on_resetable_var(param: IVarDataParamVOBase): boolean {
        if (!param) {
            return false;
        }

        let controller = VarsController.getInstance().getVarControllerById(param.var_id);

        if (!controller) {
            return false;
        }

        let conf = controller.varConf;

        if (!conf) {
            return false;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[conf.var_data_vo_type];
        if (!moduletable.isMatroidTable) {
            return true;
        }

        let tsranged_param = param as ITSRangesVarDataParam;
        if (!tsranged_param.ts_ranges) {
            return true;
        }

        if (!!conf.has_yearly_reset) {
            for (let i in tsranged_param.ts_ranges) {
                let ts_range = tsranged_param.ts_ranges[i];

                let end_range = TSRangeHandler.getInstance().getSegmentedMax(ts_range, controller.segment_type);
                // TimeSegmentHandler.getInstance().incMoment(end_range, controller.segment_type, 1);
                let closest_earlier_reset_date: moment.Moment = CumulativVarController.getInstance().getClosestPreviousCompteurResetDate(
                    end_range, false, conf.has_yearly_reset, conf.yearly_reset_day_in_month, conf.yearly_reset_month).utc(true);

                if (TSRangeHandler.getInstance().elt_intersects_range(closest_earlier_reset_date, ts_range)) {
                    ts_range.min = closest_earlier_reset_date;
                    ts_range.min_inclusiv = true;
                }
            }
        }

        let ts_ranges_: TSRange[] = [];
        for (let i in tsranged_param.ts_ranges) {
            let ts_range = tsranged_param.ts_ranges[i];

            // A REGARDER
            // // TODO JNE - A CHECKER
            // if (ts_range.max_inclusiv) {
            //     TimeSegmentHandler.getInstance().incMoment(end_range, controller.segment_type, 1);
            // }

            // // if ((!ts_range.min_inclusiv) || (!ts_range.max_inclusiv) ||
            // //     (!ts_range.min.isSame(start_range)) || (!ts_range.max.isSame(end_range))) {
            // ts_range.min = start_range;
            // ts_range.max = end_range;
            // ts_range.min_inclusiv = true;
            // ts_range.max_inclusiv = false;
            // }

            ts_ranges_.push(ts_range);
        }

        if (!ts_ranges_.length) {
            return false;
        }
        tsranged_param.ts_ranges = ts_ranges_;
        return true;
    }

    public getVarConf(var_name: string): VarConfVOBase {
        return this.registered_vars ? (this.registered_vars[var_name] ? this.registered_vars[var_name] : null) : null;
    }

    public getVarConfById(var_id: number): VarConfVOBase {
        return this.registered_vars_by_ids ? (this.registered_vars_by_ids[var_id] ? this.registered_vars_by_ids[var_id] : null) : null;
    }

    public getVarController(var_name: string): VarControllerBase<any, any> {
        return this.registered_vars_controller_ ? (this.registered_vars_controller_[var_name] ? this.registered_vars_controller_[var_name] : null) : null;
    }

    public getVarControllerById(var_id: number): VarControllerBase<any, any> {
        if ((!this.registered_vars_by_ids) || (!this.registered_vars_by_ids[var_id]) ||
            (!this.registered_vars_controller_)) {
            return null;
        }

        let res = this.registered_vars_controller_[this.registered_vars_by_ids[var_id].name];
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
        this.registered_vars_controller_[varConf.name] = controller;
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

                // On indique dans le store la mise à jour des vars
                await this.setUpdatingParamsToStore();

                if ((!!this.is_stepping) && this.setStepNumber) {
                    this.setIsWaiting(true);
                    this.setStepNumber(40);
                    break;
                }

            case 40:

                this.clean_var_dag();

                // On indique dans le store la mise à jour des vars
                await this.setUpdatingParamsToStore();

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
                while (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_ONGOING_UPDATE] && this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_ONGOING_UPDATE].length) {
                    await this.computeNode(this.varDAG.nodes[this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_ONGOING_UPDATE][0]]);
                }

                if ((!!this.is_stepping) && this.setStepNumber) {
                    this.setIsWaiting(true);
                    this.setStepNumber(70);
                    break;
                }

            case 70:

                while (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_COMPUTED] && this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_COMPUTED].length) {
                    let node = this.varDAG.nodes[this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_COMPUTED][0]];
                    node.addMarker(VarDAG.VARDAG_MARKER_COMPUTED_AT_LEAST_ONCE, this.varDAG);
                    node.removeMarker(VarDAG.VARDAG_MARKER_COMPUTED, this.varDAG, true);
                }

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

                    let visitor = new VarDAGMarkForNextUpdate(this.varDAG);
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

                        visitor.visitNode(this.varDAG.nodes[node_name]);
                    }

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

    private async setUpdatingParamsToStore() {
        if (!!this.setUpdatingParamsByVarsIds) {
            let res: { [index: string]: boolean } = {};

            for (let i in this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_ONGOING_UPDATE]) {
                let index: string = this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_ONGOING_UPDATE][i];

                res[index] = true;
            }

            this.setUpdatingParamsByVarsIds(res);

            // await ThreadHandler.getInstance().sleep(100);
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

    private markNoeudsAGererImportMatroids(marker_todo: string, marker_ok: string) {
        for (let marker_name in this.varDAG.marked_nodes_names) {
            if (!marker_name.startsWith(VarDAG.VARDAG_MARKER_VAR_ID)) {
                continue;
            }

            let var_id: number = parseInt(marker_name.replace(VarDAG.VARDAG_MARKER_VAR_ID, ""));

            let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.getVarConfById(var_id).var_data_vo_type];

            if (!moduletable.isMatroidTable) {
                continue;
            }

            for (let j in this.varDAG.marked_nodes_names[marker_name]) {
                let node_index: string = this.varDAG.marked_nodes_names[marker_name][j];
                let node = this.varDAG.nodes[node_index];

                if (node.hasMarker(marker_ok)) {
                    continue;
                }

                this.varDAG.nodes[node_index].addMarker(marker_todo, this.varDAG);
            }
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

            let isroot = true;
            if (node.hasIncoming) {

                // On part du principe qu'un matroid dépend obligatoirement d'un matroid, donc on ne devrait pas avoir besoin de faire une remontée récursive
                for (let j in node.incoming) {
                    let incoming = node.incoming[j];

                    if (nodes_by_name[incoming.name]) {
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

        for (let i in nodes) {
            let node = nodes[i];

            promises.push((async () => {

                let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.getVarConfById(node.param.var_id).var_data_vo_type];
                let matroids_inscrits: ISimpleNumberVarMatroidData[] = await ModuleDAO.getInstance().filterVosByMatroids<ISimpleNumberVarMatroidData, IVarDataParamVOBase>(moduletable.vo_type, [node.param], {});

                if (!matroids_inscrits) {
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
                let matroids_list: ISimpleNumberVarMatroidData[] = [];

                let cardinaux: { [id: number]: number } = {};

                // let before = moment();
                for (let j in matroids_inscrits) {
                    let matroid_inscrit = matroids_inscrits[j];
                    cardinaux[matroid_inscrit.id] = MatroidController.getInstance().get_cardinal(matroid_inscrit);
                }
                matroids_inscrits.sort((a: ISimpleNumberVarMatroidData, b: ISimpleNumberVarMatroidData) =>
                    cardinaux[b.id] - cardinaux[a.id]);
                // this.get_cardinal_time += moment().diff(before);

                // before = moment();
                for (let j in matroids_inscrits) {
                    let matroid_inscrit = matroids_inscrits[j];

                    if (MatroidController.getInstance().matroid_intersects_any_matroid(matroid_inscrit, matroids_list)) {
                        continue;
                    }
                    matroids_list.push(matroid_inscrit);
                }
                // this.intesect_time += moment().diff(before);

                // console.log('CARD:' + this.get_cardinal_time + ':INTERS:' + this.intesect_time + ':');
                // await ThreadHandler.getInstance().sleep(50);

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

    private async updateMatroidsAfterImport(nodes: { [node_name: string]: VarDAGNode }) {

        for (let i in nodes) {
            let node: VarDAGNode = nodes[i];

            let matroids_list: ISimpleNumberVarMatroidData[] = node.loaded_datas_matroids as ISimpleNumberVarMatroidData[];

            node.loaded_datas_matroids_sum_value = null;
            let remaining_matroids = [MatroidController.getInstance().cloneFrom(node.param as IVarMatroidDataParamVO)];


            for (let j in matroids_list) {
                let matroid = matroids_list[j];

                if ((matroid.value == null) || (typeof matroid.value == "undefined")) {
                    continue;
                }

                if (node.loaded_datas_matroids_sum_value == null) {
                    node.loaded_datas_matroids_sum_value = matroid.value;
                } else {
                    node.loaded_datas_matroids_sum_value += matroid.value;
                }

                let cut_results: Array<MatroidCutResult<IVarMatroidDataParamVO>> = MatroidController.getInstance().cut_matroids(matroid, remaining_matroids);
                remaining_matroids = [];
                for (let k in cut_results) {
                    remaining_matroids = remaining_matroids.concat(cut_results[k].remaining_items);
                }
            }

            node.computed_datas_matroids = remaining_matroids as IVarMatroidDataVO[];
        }
    }

    private async updateDepssAfterImport(nodes: { [node_name: string]: VarDAGNode }, marker_todo: string) {

        for (let i in nodes) {
            let node: VarDAGNode = nodes[i];

            // Si on a rien de chargé, on a rien à changer, sauf si on a pas de deps loaded
            if (node.hasMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED)) {
                if ((!node.loaded_datas_matroids) || (!node.loaded_datas_matroids.length)) {
                    continue;
                }
            }

            // ça veut dire aussi qu'on se demande ici quels params on doit vraiment charger en deps de ce params pour pouvoir calculer
            //  et on doit modifier l'arbre en conséquence
            let node_controller = VarsController.getInstance().getVarControllerById(node.param.var_id);

            VarDAGDefineNodeDeps.clear_node_deps(node, this.varDAG);

            // On doit faire un fake vardagnode pour chaque matroid à calculer (donc résultant de la coupe) et on additionnera les résultats
            for (let j in node.computed_datas_matroids) {
                let computed_datas_matroid = node.computed_datas_matroids[j];

                let fake_vardagnode = new VarDAGNode(VarsController.getInstance().getIndex(computed_datas_matroid), null, computed_datas_matroid);
                let deps: IVarDataParamVOBase[] = await node_controller.getSegmentedParamDependencies(fake_vardagnode, this.varDAG);

                VarDAGDefineNodeDeps.add_node_deps(node, this.varDAG, deps, {});

                for (let k in node.outgoing) {
                    let outgoing = node.outgoing[k];

                    outgoing.addMarker(marker_todo, this.varDAG);

                    // On doit aussi rajouter tous les marqueurs qu'un noeud doit avoir à cette étape
                    outgoing.addMarker(VarDAG.VARDAG_MARKER_DATASOURCES_LIST_LOADED, this.varDAG);
                    // outgoing.removeMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, this.varDAG, true);
                    outgoing.addMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, this.varDAG);
                    // outgoing.addMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE, this.varDAG);
                }
            }

            if (!node.hasMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED)) {
                node.removeMarker(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING, this.varDAG, true);
                node.addMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED, this.varDAG);
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

        let marker_todo = VarDAG.VARDAG_MARKER_loadImportedOrPrecompiledDatas_todo;
        let marker_ok = VarDAG.VARDAG_MARKER_loadImportedOrPrecompiledDatas_ok;

        // On initialise d'abord la liste des noeuds à gérer
        this.markNoeudsAGererImportMatroids(marker_todo, marker_ok);
        let noeuds_a_gerer: { [node_name: string]: VarDAGNode } = this.getNoeudsAGererImportMatroids(marker_todo);

        while (ObjectHandler.getInstance().hasAtLeastOneAttribute(noeuds_a_gerer)) {

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
                roots_locaux[i].removeMarker(marker_todo, this.varDAG);
                roots_locaux[i].addMarker(marker_ok, this.varDAG);
            }

            //  4- Vérifier les noeuds enfants. Pour chaque noeud :
            //      0- Si les parents ne sont pas tous chargés, on ignore
            //      a- Si l'enfant a plusieurs parents, et pour chaque matroid à calculer différent chez les parents, on duplique l'enfant, et on adapte pour chacun le nouveau matroid demandé
            //          ATTENTION la copie concerne le noeud et tout l'arbre qui en découle => donc peut impacter plusieurs matroids aussi en dessous
            //      b- Sinon on applique le matroid à calculer parent
            await this.updateMatroidsAfterImport(roots_locaux);
            await this.updateDepssAfterImport(roots_locaux, marker_todo);

            //  5- On recommence avec la liste des noeuds à gérer mise à jour
            noeuds_a_gerer = this.getNoeudsAGererImportMatroids(marker_todo);
        }
    }

    /**
     * Troisième version : on charge toutes les datas de toutes les var_ids présents dans l'arbre ou dont dépendent des éléments de l'arbre
     * Attention, on ne recharge plus les datasd importées de vars déjà chargées. Il faut les mettre à jour au besoin par ailleurs
     */
    private async loadImportedDatas() {

        let var_ids: number[] = [];
        let all_ids: number[] = [];
        for (let marker_name in this.varDAG.marked_nodes_names) {
            if (!marker_name.startsWith(VarDAG.VARDAG_MARKER_VAR_ID)) {
                continue;
            }

            let var_id: number = parseInt(marker_name.replace(VarDAG.VARDAG_MARKER_VAR_ID, ""));

            if (!!this.loaded_imported_datas_of_vars_ids[var_id]) {
                continue;
            }

            if (all_ids.indexOf(var_id) < 0) {

                all_ids.push(var_id);

                let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.getVarConfById(var_id).var_data_vo_type];
                if (moduletable && moduletable.isMatroidTable) {
                    continue;
                }

                var_ids.push(var_id);
                this.loaded_imported_datas_of_vars_ids[var_id] = true;
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

        let promises = [];
        for (let i in var_imported_data_vo_types) {
            let var_imported_data_vo_type: string = var_imported_data_vo_types[i];

            promises.push((async () => {
                await this.loadVarImportedDataVoType(var_imported_data_vo_type, var_ids_by_imported_data_vo_types[var_imported_data_vo_type]);
            })());
        }
        await Promise.all(promises);
    }

    private async loadVarImportedDataVoType(var_imported_data_vo_type: string, var_ids: number[]): Promise<void> {
        let importeds: IVarDataVOBase[] = await ModuleDAO.getInstance().getVosByRefFieldIds<IVarDataVOBase>(
            var_imported_data_vo_type, 'var_id', var_ids);

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

    private async solveDeps() {

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

                    if (node.hasMarker(VarDAG.VARDAG_MARKER_DEPS_LOADED) || (!node.hasMarker(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING))) {
                        continue;
                    }
                    await VarDAGDefineNodeDeps.defineNodeDeps(node, this.varDAG, new_nodes);
                }
                nodes_names = Object.keys(new_nodes);
            }

            // await this.varDAG.visitAllMarkedOrUnmarkedNodes(VarDAG.VARDAG_MARKER_NEEDS_DEPS_LOADING, true, new VarDAGVisitorDefineNodeDeps(this.varDAG));

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
                    console.error('echec solveDeps:des deps restent, mais impossible de les charger');
                    return;
                }
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

            promises.push((async () => {
                await ds_controller.load_for_batch(var_params_by_source_deps[ds_name]);
            })());
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
            await VarsController.getInstance().getVarControllerById(actual_node.param.var_id).computeValue(actual_node, this.varDAG);

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

    private _getIndex<TDataParam extends IVarDataParamVOBase>(param: TDataParam): string {
        if ((!param) || (!this.getVarControllerById(param.var_id)) || (!this.getVarControllerById(param.var_id).varDataParamController)) {
            return null;
        }

        return this.getVarControllerById(param.var_id).varDataParamController.getIndex(param);
    }

    private async  updateDatasWrapper() {
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
            console.error(error);
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