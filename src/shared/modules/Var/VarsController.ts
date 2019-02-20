import * as debounce from 'lodash/debounce';
import ObjectHandler from '../../tools/ObjectHandler';
import ThreadHandler from '../../tools/ThreadHandler';
import ModuleDAO from '../DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../DAO/vos/InsertOrDeleteQueryResult';
import DataSourcesController from '../DataSource/DataSourcesController';
import IDataSourceController from '../DataSource/interfaces/IDataSourceController';
import IDistantVOBase from '../IDistantVOBase';
import PerfMonFunction from '../PerfMon/annotations/PerfMonFunction';
import DefaultTranslation from '../Translation/vos/DefaultTranslation';
import VOsTypesManager from '../VOsTypesManager';
import DAGVisitorSimpleMarker from './graph/dag/visitors/DAGVisitorSimpleMarker';
import DAGVisitorSimpleUnmarker from './graph/dag/visitors/DAGVisitorSimpleUnmarker';
import VarDAG from './graph/var/VarDAG';
import VarDAGNode from './graph/var/VarDAGNode';
import VarDAGVisitorCompute from './graph/var/visitors/VarDAGVisitorCompute';
import VarDAGVisitorDefineDeps from './graph/var/visitors/VarDAGVisitorDefineDeps';
import VarDAGVisitorLoadDataSources from './graph/var/visitors/VarDAGVisitorLoadDataSources';
import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import SimpleVarConfVO from './simple_vars/SimpleVarConfVO';
import VarControllerBase from './VarControllerBase';
import VarConfVOBase from './vos/VarConfVOBase';
import VarDAGVisitorUnloadDataSources from './graph/var/visitors/VarDAGVisitorUnloadDataSources';
import VarDAGVisitorMarkForOngoingUpdate from './graph/var/visitors/VarDAGVisitorMarkForOngoingUpdate';

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

    public varDAG: VarDAG = new VarDAG((name: string, dag: VarDAG, param: IVarDataParamVOBase) => new VarDAGNode(name, dag, param));

    // public registeredDatasParamsIndexes: { [paramIndex: string]: number } = {};
    // public registeredDatasParams: { [paramIndex: string]: IVarDataParamVOBase } = {};

    // public dependencies_by_param: { [paramIndex: string]: IVarDataParamVOBase[] } = {};
    // public impacts_by_param: { [paramIndex: string]: IVarDataParamVOBase[] } = {};

    public datasource_deps_by_var_id: { [var_id: number]: Array<IDataSourceController<any, any>> } = {};
    // public BATCH_UIDs_by_var_id: { [var_id: number]: number } = {};

    public step_number: number = null;
    public is_stepping: boolean = null;
    public is_waiting: boolean = null;

    private varDatasStaticCache: { [index: string]: IVarDataVOBase } = {};

    // private last_batch_dependencies_by_param: { [paramIndex: string]: IVarDataParamVOBase[] } = {};
    // private last_batch_param_by_index: { [paramIndex: string]: IVarDataParamVOBase } = {};

    private setVarData_: (varData: IVarDataVOBase) => void = null;
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

        for (let i in this.registered_vars_by_ids) {
            this.registered_vars[this.registered_vars_by_ids[i].name] = this.registered_vars_by_ids[i];
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
            // let BATCH_UID: number = this.BATCH_UIDs_by_var_id[varData.var_id];

            // if (!((BATCH_UID != null) && (typeof BATCH_UID != 'undefined'))) {
            //     console.error('setVarData:Tried set data in unknown batch'); // est-ce si grave ?
            //     return;
            // }

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
        setUpdatingDatas: (updating: boolean) => void,
        getUpdatingParamsByVarsIds: { [index: string]: boolean },
        setUpdatingParamsByVarsIds: (updating_params_by_vars_ids: { [index: string]: boolean }) => void,
        // isStepping: boolean,
        // isWaiting: boolean,
        setIsWaiting: (isWaiting: boolean) => void) {
        this.varDatas = getVarData;
        this.setVarData_ = setVarData;
        this.setUpdatingDatas = setUpdatingDatas;
        this.getUpdatingParamsByVarsIds = getUpdatingParamsByVarsIds;
        this.setUpdatingParamsByVarsIds = setUpdatingParamsByVarsIds;

        // this.isStepping = isStepping;
        // this.isWaiting = isWaiting;
        this.setIsWaiting = setIsWaiting;
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

        // // On ajoute les deps des vars dont on est dep :
        // let var_dep_ids: number[] = controller.getVarsIdsDependencies();

        // for (let j in var_dep_ids) {
        //     let var_dep_id: number = var_dep_ids[j];

        //     let var_dep_datasource_deps: Array<IDataSourceController<any, any>> = this.get_datasource_deps(this.getVarControllerById(var_dep_id));
        //     datasource_deps = datasource_deps.concat(var_dep_datasource_deps);
        // }
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

    @PerfMonFunction
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
        if (node.hasMarker(VarDAG.VARDAG_MARKER_ONGOING_UPDATE)) {
            node.addMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE, this.varDAG);
        } else {
            node.addMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, this.varDAG);
            this.debouncedUpdateDatas();
        }
    }

    // @PerfMonFunction
    // public registerDataParam<TDataParam extends IVarDataParamVOBase>(param: TDataParam, reload_on_register: boolean = true) {
    //     if (!this.registeredDatasParamsIndexes) {
    //         this.registeredDatasParamsIndexes = {};
    //         this.registeredDatasParams = {};
    //     }

    //     if ((!param) || (!this.getVarControllerById(param.var_id)) || (!this.getVarControllerById(param.var_id).varDataParamController) ||
    //         (!this.getVarControllerById(param.var_id).varDataParamController.getIndex)) {
    //         return;
    //     }

    //     let param_index: string = this.getVarControllerById(param.var_id).varDataParamController.getIndex(param);
    //     if (!this.registeredDatasParamsIndexes[param_index]) {
    //         this.registeredDatasParamsIndexes[param_index] = 1;
    //     } else {
    //         this.registeredDatasParamsIndexes[param_index]++;
    //     }
    //     this.registeredDatasParams[param_index] = param;

    //     let actual_value = this.getVarData(param);
    //     if (reload_on_register || (!actual_value)) {
    //         this.stageUpdateData(param);
    //     }
    // }

    @PerfMonFunction
    public registerDataParam<TDataParam extends IVarDataParamVOBase>(param: TDataParam, reload_on_register: boolean = false) {

        this.varDAG.registerParams([param]);

        let actual_value = this.getVarData(param);
        if (reload_on_register || (!actual_value)) {
            this.stageUpdateData(param);
        }
    }

    // @PerfMonFunction
    // public unregisterDataParam<TDataParam extends IVarDataParamVOBase>(param: TDataParam) {
    //     if (!this.registeredDatasParamsIndexes) {
    //         this.registeredDatasParamsIndexes = {};
    //         this.registeredDatasParams = {};
    //         return;
    //     }

    //     if ((!param) || (!this.getVarControllerById(param.var_id)) || (!this.getVarControllerById(param.var_id).varDataParamController) ||
    //         (!this.getVarControllerById(param.var_id).varDataParamController.getIndex)) {
    //         return;
    //     }

    //     let param_index: string = this.getVarControllerById(param.var_id).varDataParamController.getIndex(param);
    //     if ((this.registeredDatasParamsIndexes[param_index] == null) || (typeof this.registeredDatasParamsIndexes[param_index] == 'undefined')) {
    //         return;
    //     }

    //     this.registeredDatasParamsIndexes[param_index]--;
    //     if (this.registeredDatasParamsIndexes[param_index] <= 0) {
    //         delete this.registeredDatasParamsIndexes[param_index];
    //         delete this.registeredDatasParams[param_index];
    //     }
    // }

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
                if (!!this.setUpdatingDatas) {
                    this.setUpdatingDatas(true);
                }

                // On marque tous les noeuds en attente comme en cours d'update, pour que les prochaines demandes d'update indiquent
                //  une demande pour le prochain batch
                this.varDAG.visitAllMarkedOrUnmarkedNodes(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, true, (dag: VarDAG) => new VarDAGVisitorMarkForOngoingUpdate(dag));

                // this.BATCH_UIDs_by_var_id = {};
                this.varDatasBATCHCache = {};

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 2;
                    break;
                }

            case 2:
                // On charge les données importées si c'est pas encore fait (une mise à jour de donnée importée devra être faite via registration de dao
                //  ou manuellement en éditant le noeud du varDAG)
                await this.loadImportedDatas();

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 3;
                    break;
                }

            case 3:
                // Si des deps restent à résoudre, on les gère à ce niveau. On part du principe maintenant qu'on interdit une dep à un datasource pour le
                //  chargement des deps. ça va permettre de booster très fortement les chargements de données. Si un switch impact une dep de var, il
                //  faut l'avoir en param d'un constructeur de var et le changement du switch sera à prendre en compte dans la var au cas par cas.
                // TODO FIXME VARS les deps on les charge quand on ajoute des vars en fait c'est pas mieux ici et on devrait pas avoir à reparcourir l'arbre
                // à ce stade
                await this.solveDeps();

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 4;
                    break;
                }

            case 4:
                // Une fois les deps à jour, on propage la demande de mise à jour à travers les deps
                await this.propagateUpdateRequest();

                // On indique dans le store la mise à jour des vars
                this.setUpdatingParamsToStore();

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 5;
                    break;
                }

            case 5:
                // La demande est propagée jusqu'aux feuilles, on peut demander le chargement de toutes les datas nécessaires, en visitant des feuilles vers le top
                await this.varDAG.visitAllFromRootsOrLeafs((dag: VarDAG) => new VarDAGVisitorLoadDataSources(dag));

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 6;
                    break;
                }

            case 6:
                // On visite pour résoudre les calculs
                await this.varDAG.visitAllFromRootsOrLeafs((dag: VarDAG) => new VarDAGVisitorCompute(dag));

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 7;
                    break;
                }

            case 7:
                // Enfin on décharge les datasources
                await this.varDAG.visitAllFromRootsOrLeafs((dag: VarDAG) => new VarDAGVisitorUnloadDataSources(dag));

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 8;
                    break;
                }

            case 8:
                // On peut nettoyer directement le graph des markers de chargement de visite
                await this.varDAG.visitAllFromRootsOrLeafs((dag: VarDAG) => new DAGVisitorSimpleUnmarker(dag, true, VarDAG.VARDAG_MARKER_BATCH_DATASOURCE_LOADED, true));

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 9;
                    break;
                }

            case 9:
                await this.varDAG.visitAllFromRootsOrLeafs((dag: VarDAG) => new DAGVisitorSimpleUnmarker(dag, true, VarDAG.VARDAG_MARKER_BATCH_DATASOURCE_UNLOADED, true));

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 10;
                    break;
                }

            case 10:
                await this.varDAG.visitAllFromRootsOrLeafs((dag: VarDAG) => new DAGVisitorSimpleUnmarker(dag, true, VarDAG.VARDAG_MARKER_COMPUTED, true));

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 11;
                    break;
                }

            case 11:
                if (!!this.setUpdatingParamsByVarsIds) {
                    this.setUpdatingParamsByVarsIds({});
                }

                // On supprime le marquage ongoing update et si on a des vars qui sont en attente de mise à jour pour next update, on les passe en attente normale
                //  avant de lancer la récursion
                await this.varDAG.visitAllFromRootsOrLeafs((dag: VarDAG) => new DAGVisitorSimpleUnmarker(dag, true, VarDAG.VARDAG_MARKER_ONGOING_UPDATE, true));

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 12;
                    break;
                }

            case 12:
                let needs_new_batch: boolean = false;
                for (let i in this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE]) {
                    let node: VarDAGNode = this.varDAG.nodes[this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE][i]];

                    node.removeMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_NEXT_UPDATE, this.varDAG);
                    node.addMarker(VarDAG.VARDAG_MARKER_MARKED_FOR_UPDATE, this.varDAG);
                    needs_new_batch = true;
                }

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 13;
                    break;
                }

            case 13:
                this.flushVarsDatas();

                if (!!this.is_stepping) {
                    this.setIsWaiting(true);
                    this.step_number = 14;
                    break;
                }

            case 14:
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

        this.setUpdatingParamsByVarsIds(res);
    }

    @PerfMonFunction
    private async loadImportedDatas() {

        // But : tout charger en un minimum de requête
        // On récupère la liste des type de vos qu'il faut charger et pour ces types de données, on charge tout pour le moment.
        // FIXME QUICK & DIRTY tout charger n'est certainement pas la bonne solution / pas idéale en tout cas
        let var_imported_data_vo_types: string[] = [];
        let var_ids_by_imported_data_vo_types: { [var_imported_data_vo_type: string]: number[] } = {};
        for (let i in this.varDAG.nodes) {
            let node: VarDAGNode = this.varDAG.nodes[i];
            let param: IVarDataParamVOBase = node.param;
            let varConf: VarConfVOBase = this.getVarConfById(param.var_id);

            if (var_imported_data_vo_types.indexOf(varConf.var_data_vo_type) < 0) {
                var_imported_data_vo_types.push(varConf.var_data_vo_type);
                var_ids_by_imported_data_vo_types[varConf.var_data_vo_type] = [];
            }

            if (var_ids_by_imported_data_vo_types[varConf.var_data_vo_type].indexOf(param.var_id) < 0) {
                var_ids_by_imported_data_vo_types[varConf.var_data_vo_type].push(param.var_id);
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

                    // On importe potentiellement des choses inutiles, on les stocke pas
                    if (!!this.varDAG.nodes[importedIndex]) {
                        this.varDAG.nodes[importedIndex].setImportedData(imported, this.varDAG);
                    }
                }
            }
        }
    }

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

    @PerfMonFunction
    private async solveDeps() {

        if (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED] &&
            (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED].length == this.varDAG.nodes_names.length)) {
            // tout est déjà chargé
            return;
        }

        // On charge les deps de toutes les roots
        await this.varDAG.visitAllFromRootsOrLeafs((dag: VarDAG) => new VarDAGVisitorDefineDeps(dag));

        if ((!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED]) ||
            (this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED].length != this.varDAG.nodes_names.length)) {
            console.error('VARDAG incohérence : Le nombre de noeuds chargés est différent du nombre de noeuds total:' +
                this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_DEPS_LOADED].length + ":" + this.varDAG.nodes_names.length);
        }
    }

    @PerfMonFunction
    private async propagateUpdateRequest() {

        if (!this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_ONGOING_UPDATE]) {
            return;
        }

        for (let i in this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_ONGOING_UPDATE]) {
            let marked_for_update: VarDAGNode = this.varDAG.nodes[this.varDAG.marked_nodes_names[VarDAG.VARDAG_MARKER_ONGOING_UPDATE][i]];

            // On visite dans les 2 sens (bottom/up et up/bottom) puisqu'on veut les deps mais aussi les impacts
            await marked_for_update.visit(new DAGVisitorSimpleMarker(this.varDAG, true, VarDAG.VARDAG_MARKER_ONGOING_UPDATE, false, marked_for_update.name, true));
            await marked_for_update.visit(new DAGVisitorSimpleMarker(this.varDAG, false, VarDAG.VARDAG_MARKER_ONGOING_UPDATE, false, marked_for_update.name, true));
        }
    }
}