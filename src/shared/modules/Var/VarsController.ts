import ModuleDAO from '../DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../DAO/vos/InsertOrDeleteQueryResult';
import VarControllerBase from './VarControllerBase';
import IImportedVarDataVOBase from './interfaces/IImportedVarDataVOBase';
import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import VarConfVOBase from './vos/VarConfVOBase';
import * as debounce from 'lodash/debounce';
import VarDataParamControllerBase from './VarDataParamControllerBase';
import ObjectHandler from '../../tools/ObjectHandler';

export default class VarsController {

    public static getInstance(): VarsController {
        if (!VarsController.instance) {
            VarsController.instance = new VarsController();
        }
        return VarsController.instance;
    }

    private static BATCH_UID: number = 0;

    private static instance: VarsController = null;

    private setVarData_: (varData: IVarDataVOBase) => void = null;
    private varDatas: { [paramIndex: string]: IVarDataVOBase } = null;

    private waitingForUpdate: { [paramIndex: string]: IVarDataParamVOBase } = {};

    private registeredDatasParamsIndexes: { [paramIndex: string]: number } = {};
    private registeredDatasParams: { [paramIndex: string]: IVarDataParamVOBase } = {};

    private registered_vars: { [name: string]: VarConfVOBase } = {};
    private registered_vars_by_ids: { [id: number]: VarConfVOBase } = {};

    private registered_vars_controller: { [name: string]: VarControllerBase<any, any> } = {};

    private updateSemaphore: boolean = false;

    private setUpdatingDatas: (updating: boolean) => void = null;

    private varDatasStaticCache: { [index: string]: IVarDataVOBase } = {};

    /**
     * This is meant to handle the datas before sending it the store to avoid multiple overloading problems
     */
    private varDatasBATCHCache: { [BATCH_UID: number]: { [index: string]: IVarDataVOBase } } = {};

    protected constructor() {
    }

    /**
     * Pushes all BatchCached datas of this Batch_uid to the store and clears the cache
     */
    public flushVarsDatas(BATCH_UID: number) {
        if ((!this.varDatasBATCHCache) || (!this.varDatasBATCHCache[BATCH_UID])) {
            return;
        }

        for (let index in this.varDatasBATCHCache[BATCH_UID]) {
            let varData: IVarDataVOBase = this.varDatasBATCHCache[BATCH_UID][index];

            // Set the data finally
            this.setVarData(varData);
        }

        delete this.varDatasBATCHCache[BATCH_UID];
    }

    public setVarData<T extends IVarDataVOBase>(varData: T, BATCH_UID: number = null) {

        if ((!varData) || (!this.getVarControllerById(varData.var_id)) || (!this.getVarControllerById(varData.var_id).varDataParamController)) {
            return null;
        }
        let index: string = this.getVarControllerById(varData.var_id).varDataParamController.getIndex(varData);

        // WARNING : Might be strange some day when the static cache is updated by a BATCH since it should only
        //  be updated after the end of the batch, but the batch sometimes uses methods that need data that
        //  are being created by the batch itself.... if some funny datas are being calculated, you might want to check that thing
        this.varDatasStaticCache[index] = varData;

        if (BATCH_UID != null) {
            if (!this.varDatasBATCHCache[BATCH_UID]) {
                this.varDatasBATCHCache[BATCH_UID] = {};
            }
            this.varDatasBATCHCache[BATCH_UID][index] = varData;

            return;
        }

        if (!!this.registeredDatasParamsIndexes[index]) {
            this.setVarData_(varData);
        }
    }

    public getVarData<T extends IVarDataVOBase>(param: IVarDataParamVOBase, BATCH_UID: number = null): T {

        if ((!param) || (!this.getVarControllerById(param.var_id)) || (!this.getVarControllerById(param.var_id).varDataParamController)) {
            return null;
        }
        let index: string = this.getVarControllerById(param.var_id).varDataParamController.getIndex(param);

        if (BATCH_UID != null) {
            if (this.varDatasBATCHCache && this.varDatasBATCHCache[BATCH_UID] && this.varDatasBATCHCache[BATCH_UID][index]) {
                return this.varDatasBATCHCache[BATCH_UID][index] as T;
            }
        }

        // Si on doit l'afficher il faut que ce soit synchro dans le store, sinon on utilise le cache static
        let varData: T = null;
        if (!!this.registeredDatasParamsIndexes[index]) {

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
        setUpdatingDatas: (updating: boolean) => void) {
        this.varDatas = getVarData;
        this.setVarData_ = setVarData;
        this.setUpdatingDatas = setUpdatingDatas;
    }

    public stageUpdateData<TDataParam extends IVarDataParamVOBase>(param: TDataParam) {
        if (!this.waitingForUpdate) {
            this.waitingForUpdate = {};
        }

        if ((!param) || (!this.getVarControllerById(param.var_id)) || (!this.getVarControllerById(param.var_id).varDataParamController) ||
            (!this.getVarControllerById(param.var_id).varDataParamController.getIndex)) {
            return;
        }

        let param_controller: VarDataParamControllerBase<TDataParam> = this.getVarControllerById(param.var_id).varDataParamController;
        let param_index: string = param_controller.getIndex(param);
        if (!this.waitingForUpdate[param_index]) {
            this.waitingForUpdate[param_index] = param;
        }

        // On demande au controller si on doit invalider d'autres params (par exemple un solde recalculé au 02/01 remet en cause celui du 03/01 et 05/01, ...)
        let params_needing_update: TDataParam[] = param_controller.getImpactedParamsList(param, this.registeredDatasParams as { [index: string]: TDataParam });
        if (params_needing_update && params_needing_update.length) {
            for (let i in params_needing_update) {
                let param_needing_update: TDataParam = params_needing_update[i];

                param_index = param_controller.getIndex(param_needing_update);
                if (!this.waitingForUpdate[param_index]) {
                    this.waitingForUpdate[param_index] = param_needing_update;
                }
            }
        }

        this.debouncedUpdateDatas();
    }

    public registerDataParam<TDataParam extends IVarDataParamVOBase>(param: TDataParam) {
        if (!this.registeredDatasParamsIndexes) {
            this.registeredDatasParamsIndexes = {};
            this.registeredDatasParams = {};
        }

        if ((!param) || (!this.getVarControllerById(param.var_id)) || (!this.getVarControllerById(param.var_id).varDataParamController) ||
            (!this.getVarControllerById(param.var_id).varDataParamController.getIndex)) {
            return;
        }

        let param_index: string = this.getVarControllerById(param.var_id).varDataParamController.getIndex(param);
        if (!this.registeredDatasParamsIndexes[param_index]) {
            this.registeredDatasParamsIndexes[param_index] = 1;
        } else {
            this.registeredDatasParamsIndexes[param_index]++;
        }
        this.registeredDatasParams[param_index] = param;

        this.stageUpdateData(param);
    }

    public unregisterDataParam<TDataParam extends IVarDataParamVOBase>(param: TDataParam) {
        if (!this.registeredDatasParamsIndexes) {
            this.registeredDatasParamsIndexes = {};
            this.registeredDatasParams = {};
            return;
        }

        if ((!param) || (!this.getVarControllerById(param.var_id)) || (!this.getVarControllerById(param.var_id).varDataParamController) ||
            (!this.getVarControllerById(param.var_id).varDataParamController.getIndex)) {
            return;
        }

        let param_index: string = this.getVarControllerById(param.var_id).varDataParamController.getIndex(param);
        if ((this.registeredDatasParamsIndexes[param_index] == null) || (typeof this.registeredDatasParamsIndexes[param_index] == 'undefined')) {
            return;
        }

        this.registeredDatasParamsIndexes[param_index]--;
        if (this.registeredDatasParamsIndexes[param_index] <= 0) {
            delete this.registeredDatasParamsIndexes[param_index];
            delete this.registeredDatasParams[param_index];
        }
    }

    get debouncedUpdateDatas() {
        let self = this;
        return debounce(async () => {
            // Il faut stocker une info de type sémaphore pour refuser de lancer l'update pendant qu'il est en cours
            // Mais du coup quand l'update est terminé, il est important de vérifier si de nouvelles demandes de mise à jour ont eues lieues.
            //  et si oui relancer une mise à jour.
            // ATTENTION : Risque d'explosion de la pile des appels si on a un temps trop élevé de résolution des variables, par rapport à une mise
            //  à jour automatique par exemple à intervale régulier, plus court que le temps de mise à jour.
            if (this.updateSemaphore) {
                return;
            }
            this.updateSemaphore = true;
            try {
                await self.updateDatas();
            } catch (error) {
                console.error(error);
            }
            this.updateSemaphore = false;
        }, 500);
    }

    public getImportedVarsDatasByIndexFromArray<TImportedData extends IImportedVarDataVOBase>(
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

    public getVarConf(var_name: string): VarConfVOBase {
        return this.registered_vars ? (this.registered_vars[var_name] ? this.registered_vars[var_name] : null) : null;
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
        if (this.registered_vars && this.registered_vars[varConf.name]) {
            return this.registered_vars[varConf.name];
        }

        let daoVarConf: VarConfVOBase = await ModuleDAO.getInstance().getNamedVoByName<VarConfVOBase>(varConf._type, varConf.name);

        if (daoVarConf) {
            await this.setVar(daoVarConf, controller);
            return daoVarConf;
        }
        console.error(daoVarConf + ":" + varConf._type + ":" + varConf.name);
        console.error(JSON.stringify(await ModuleDAO.getInstance().getVos(varConf._type)));

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(varConf);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            return null;
        }

        varConf.id = parseInt(insertOrDeleteQueryResult.id.toString());

        await this.setVar(varConf, controller);
        return varConf;
    }

    private async setVar(varConf: VarConfVOBase, controller: VarControllerBase<any, any>) {
        this.registered_vars[varConf.name] = varConf;
        this.registered_vars_controller[varConf.name] = controller;
        this.registered_vars_by_ids[varConf.id] = varConf;
    }

    /**
     * On va chercher à dépiler toutes les demandes en attente,
     *  et dans un ordre définit par le controller du type de var group
     */
    private async updateDatas() {

        this.setUpdatingDatas(true);

        // On passe par une copie pour ne pas dépendre des demandes de mise à jour en cours
        //  et on réinitialise immédiatement les waiting for update, comme ça on peut voir ce qui a été demandé pendant qu'on
        //  mettait à jour (important pour éviter des bugs assez difficiles à identifier potentiellement)
        let params_copy: { [paramIndex: string]: IVarDataParamVOBase } = Object.assign({}, this.waitingForUpdate);
        let BATCH_UIDs_by_var_id: { [var_id: number]: number } = {};
        this.waitingForUpdate = {};

        // On résoud les deps par group_id avant de chercher à savoir de quel param exactement on dépend
        let deps_by_var_id: { [from_var_id: number]: number[] } = await this.solveVarsDependencies(params_copy, BATCH_UIDs_by_var_id);

        let ordered_params_by_vars_ids: { [var_id: number]: { [index: string]: IVarDataParamVOBase } } = this.getDataParamsByVarId(params_copy);

        // On demande le chargement des datas par ordre inverse de dépendance et dès qu'on a chargé les datas sources
        //  on peut demander les dépendances du niveau suivant et avancer dans l'arbre
        await this.loadVarsDatasAndLoadParamsDeps(ordered_params_by_vars_ids, deps_by_var_id, BATCH_UIDs_by_var_id);

        this.sortDataParamsForUpdate(ordered_params_by_vars_ids);

        // Et une fois que tout est propre, on lance la mise à jour de chaque élément
        await this.updateEachData(deps_by_var_id, ordered_params_by_vars_ids, BATCH_UIDs_by_var_id);

        // Enfin quand toutes les datas sont à jour on pousse sur le store
        for (let i in BATCH_UIDs_by_var_id) {
            this.flushVarsDatas(BATCH_UIDs_by_var_id[i]);
        }

        this.setUpdatingDatas(false);
    }

    private async solveVarsDependencies(
        params: { [paramIndex: string]: IVarDataParamVOBase } = Object.assign({}, this.waitingForUpdate),
        BATCH_UIDs_by_var_id: { [var_id: number]: number }
    ): Promise<{ [from_var_id: number]: number[] }> {
        // On cherche les dépendances entre les variables uniquement
        // Et on construit en parralèle l'arbre de dépendances
        //  TODO : à ce niveau, il faudrait utiliser un vrai arbre et vérifier les deps circulaires, résoudre de manière optimale, ...
        //  ici on fait rien de tout çà, on essaie juste de résoudre les deps avant le var_id. Plus on aura de vars plus la
        //  perf sera impactée à ce niveau il faudra modifier ce système (QUICK AND DIRTY)
        let deps_by_var_id: { [from_var_id: number]: number[] } = {};
        let needs_check_deps: number[] = [];
        let all_vars_ids: number[] = [];

        for (let i in params) {
            let param: IVarDataParamVOBase = params[i];

            if (needs_check_deps.indexOf(param.var_id) < 0) {
                needs_check_deps.push(param.var_id);
                all_vars_ids.push(param.var_id);
            }
        }

        while (needs_check_deps && needs_check_deps.length) {

            let var_id: number = needs_check_deps.shift();

            if (!BATCH_UIDs_by_var_id[var_id]) {
                BATCH_UIDs_by_var_id[var_id] = VarsController.BATCH_UID++;
            }

            if (!this.getVarControllerById(var_id)) {
                throw new Error('solveVarsDependencies: Failed check controller:' + var_id);
            }

            let vars_dependencies_ids: number[] = await this.registered_vars_controller[this.registered_vars_by_ids[var_id].name].
                getVarsIdsDependencies(BATCH_UIDs_by_var_id[var_id]);

            if (!deps_by_var_id[var_id]) {
                deps_by_var_id[var_id] = [];
            }

            for (let i in vars_dependencies_ids) {
                let var_dependency_id: number = vars_dependencies_ids[i];
                if (all_vars_ids.indexOf(var_dependency_id) < 0) {
                    all_vars_ids.push(var_dependency_id);
                    needs_check_deps.push(var_dependency_id);
                }

                if (deps_by_var_id[var_id].indexOf(var_dependency_id) < 0) {
                    deps_by_var_id[var_id].push(var_dependency_id);
                }
            }
        }

        return deps_by_var_id;
    }

    /**
     * TODO TU UnitTest
     * La fonction renvoie true si le var_id est dépendant d'une autre var dans le deps by var
     */
    private hasDependancy(var_id: number, deps_by_var_id: { [from_var_id: number]: number[] }): boolean {
        for (let i in deps_by_var_id) {
            if (deps_by_var_id[i] && (deps_by_var_id[i].indexOf(var_id) >= 0)) {
                return true;
            }
        }
        return false;
    }

    private async loadVarsDatasAndLoadParamsDeps(
        ordered_params_by_vars_ids: { [var_id: number]: { [index: string]: IVarDataParamVOBase } },
        deps_by_var_id: { [from_var_id: number]: number[] },
        BATCH_UIDs_by_var_id: { [var_id: number]: number }
    ) {

        let deps_by_var_id_copy: { [from_var_id: number]: number[] } = Object.assign({}, deps_by_var_id);
        while (deps_by_var_id_copy && ObjectHandler.getInstance().hasAtLeastOneAttribute(deps_by_var_id_copy)) {

            let has_resolved_something: boolean = false;

            let next_deps_by_var_id_copy: { [from_var_id: number]: number[] } = {};
            for (let index in deps_by_var_id_copy) {
                let var_id: number = parseInt(index.toString());
                let deps_vars_id: number[] = deps_by_var_id_copy[var_id];

                if (this.hasDependancy(var_id, deps_by_var_id_copy)) {
                    next_deps_by_var_id_copy[var_id] = deps_vars_id;
                    continue;
                }

                has_resolved_something = true;

                // Charger les datas et les params dépendants pour les ajouter à la liste en attente
                if (!this.getVarControllerById(var_id)) {
                    throw new Error('loadDatasVars: controller registering check failed:' + var_id);
                }

                await this.getVarControllerById(var_id).begin_batch(
                    BATCH_UIDs_by_var_id[var_id],
                    ordered_params_by_vars_ids[var_id]
                );

                for (let i in ordered_params_by_vars_ids[var_id]) {

                    let param: IVarDataParamVOBase = ordered_params_by_vars_ids[var_id][i];

                    let dependencies: IVarDataParamVOBase[] = await this.getVarControllerById(var_id).getParamsDependencies(
                        BATCH_UIDs_by_var_id[var_id],
                        param,
                        ordered_params_by_vars_ids
                    );

                    for (let j in dependencies) {
                        let dependency: IVarDataParamVOBase = dependencies[j];

                        if (!ordered_params_by_vars_ids[dependency.var_id]) {
                            ordered_params_by_vars_ids[dependency.var_id] = {};
                        }
                        let dependency_index: string = this.getVarControllerById(dependency.var_id).varDataParamController.getIndex(dependency);
                        ordered_params_by_vars_ids[dependency.var_id][dependency_index] = dependency;
                    }
                }
            }
            deps_by_var_id_copy = next_deps_by_var_id_copy;

            if (!has_resolved_something) {
                throw new Error('loadDatasVars: dep check failed:' + JSON.stringify(deps_by_var_id_copy));
            }
        }
    }

    private getDataParamsByVarId(params: { [paramIndex: string]: IVarDataParamVOBase }): { [var_id: number]: { [index: string]: IVarDataParamVOBase } } {
        let ordered_params_by_vars_ids: { [var_id: number]: { [index: string]: IVarDataParamVOBase } } = {};

        // On organise un peu les datas
        for (let paramIndex in params) {
            let param: IVarDataParamVOBase = params[paramIndex];

            let index: string = this.getVarControllerById(param.var_id).varDataParamController.getIndex(param);

            if (!ordered_params_by_vars_ids[param.var_id]) {
                ordered_params_by_vars_ids[param.var_id] = {};
            }
            ordered_params_by_vars_ids[param.var_id][index] = param;
        }

        return ordered_params_by_vars_ids;
    }

    private sortDataParamsForUpdate(params_by_vars_ids: { [var_id: number]: { [index: string]: IVarDataParamVOBase } }) {

        // On demande l'ordre dans lequel résoudre les params
        for (let i in params_by_vars_ids) {
            let ordered_params: { [index: string]: IVarDataParamVOBase } = params_by_vars_ids[i];
            let var_id: number = parseInt(i.toString());

            if ((!this.getVarControllerById(var_id)) || (!this.getVarControllerById(var_id).varDataParamController) ||
                (!this.getVarControllerById(var_id).varDataParamController.sortParams)) {
                continue;
            }
            this.getVarControllerById(var_id).varDataParamController.sortParams(ordered_params);
        }
    }

    private async updateEachData(
        deps_by_var_id: { [from_var_id: number]: number[] },
        ordered_params_by_vars_ids: { [var_id: number]: { [index: string]: IVarDataParamVOBase } },
        BATCH_UIDs_by_var_id: { [var_id: number]: number }) {

        let solved_var_ids: number[] = [];
        let vars_ids_to_solve: number[] = ObjectHandler.getInstance().getNumberMapIndexes(ordered_params_by_vars_ids);

        // On doit résoudre en respectant l'ordre des deps
        while (vars_ids_to_solve && vars_ids_to_solve.length) {

            // Needed for the Q&D version of the tree resolution
            let solved_something: boolean = false;
            for (let i in vars_ids_to_solve) {
                let var_id: number = vars_ids_to_solve[i];

                if (deps_by_var_id[var_id] && deps_by_var_id[var_id].length) {
                    let dependency_check: boolean = true;
                    for (let j in deps_by_var_id[var_id]) {
                        if (solved_var_ids.indexOf(deps_by_var_id[var_id][j]) < 0) {
                            dependency_check = false;
                            break;
                        }
                    }

                    if (!dependency_check) {
                        continue;
                    }
                }

                let vars_params: { [index: string]: IVarDataParamVOBase } = ordered_params_by_vars_ids[var_id];

                // On peut vouloir faire des chargements de données groupés et les nettoyer après le calcul
                let BATCH_UID: number = BATCH_UIDs_by_var_id[var_id];
                let controller: VarControllerBase<any, any> = this.getVarControllerById(var_id);

                for (let j in vars_params) {
                    let var_param: IVarDataParamVOBase = vars_params[j];

                    await controller.updateData(BATCH_UID, var_param);
                }

                await controller.end_batch(BATCH_UID, vars_params);

                delete ordered_params_by_vars_ids[var_id];
                solved_var_ids.push(var_id);
                solved_something = true;
            }

            if (!solved_something) {
                // Plus rien qu'on puisse résoudre mais reste des choses en attente ...
                throw new Error('updateEachData:Dependencies check failed');
            }

            vars_ids_to_solve = ObjectHandler.getInstance().getNumberMapIndexes(ordered_params_by_vars_ids);
        }
    }
}