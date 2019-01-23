import ModuleDAO from '../DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../DAO/vos/InsertOrDeleteQueryResult';
import VarGroupControllerBase from './VarGroupControllerBase';
import IImportedVarDataVOBase from './interfaces/IImportedVarDataVOBase';
import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import VarGroupConfVOBase from './vos/VarGroupConfVOBase';
import VarConfVOBase from './vos/VarConfVOBase';
import * as debounce from 'lodash/debounce';
import VarDataParamControllerBase from './VarDataParamControllerBase';

export default class VarsController {
    public static getInstance(): VarsController {
        if (!VarsController.instance) {
            VarsController.instance = new VarsController();
        }
        return VarsController.instance;
    }

    private static instance: VarsController = null;

    private setVarData_: (varData: IVarDataVOBase) => void = null;
    private varDatas: { [paramIndex: string]: IVarDataVOBase } = null;

    private waitingForUpdate: { [paramIndex: string]: IVarDataParamVOBase } = {};

    private registeredDatasParamsIndexes: { [paramIndex: string]: number } = {};
    private registeredDatasParams: { [paramIndex: string]: IVarDataParamVOBase } = {};

    private registered_vars_groups: { [name: string]: VarGroupConfVOBase } = {};
    private registered_vars_groups_by_ids: { [id: number]: VarGroupConfVOBase } = {};

    private registered_vars: { [name: string]: VarConfVOBase } = {};
    private registered_vars_by_ids: { [id: number]: VarConfVOBase } = {};

    private registered_vars_groups_controller: { [name: string]: VarGroupControllerBase<any, any, any> } = {};

    private updateSemaphore: boolean = false;

    private setUpdatingDatas: (updating: boolean) => void = null;

    private varDatasStaticCache: { [index: string]: IVarDataVOBase } = {};

    protected constructor() {
    }

    public setVarData<T extends IVarDataVOBase>(varData: T) {

        if ((!this.registered_vars_groups_controller) || (!this.registered_vars_groups_by_ids) ||
            (!varData) || (!varData.var_group_id) || (!this.registered_vars_groups_by_ids[varData.var_group_id])
            || (!this.registered_vars_groups_controller[this.registered_vars_groups_by_ids[varData.var_group_id].name])
            || (!this.registered_vars_groups_controller[this.registered_vars_groups_by_ids[varData.var_group_id].name].varDataParamController)) {
            return null;
        }
        let index: string = this.registered_vars_groups_controller[this.registered_vars_groups_by_ids[varData.var_group_id].name].varDataParamController.getIndex(varData);

        if (!!this.registeredDatasParamsIndexes[index]) {
            this.setVarData_(varData);
        } else {
            this.varDatasStaticCache[index] = varData;
        }
    }

    public getVarData<T extends IVarDataVOBase>(param: IVarDataParamVOBase): T {

        if ((!this.registered_vars_groups_controller) || (!this.registered_vars_groups_by_ids) ||
            (!param) || (!param.var_group_id) || (!this.registered_vars_groups_by_ids[param.var_group_id])
            || (!this.registered_vars_groups_controller[this.registered_vars_groups_by_ids[param.var_group_id].name])
            || (!this.registered_vars_groups_controller[this.registered_vars_groups_by_ids[param.var_group_id].name].varDataParamController)) {
            return null;
        }
        let index: string = this.registered_vars_groups_controller[this.registered_vars_groups_by_ids[param.var_group_id].name].varDataParamController.getIndex(param);

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

        if ((!param) || (!param.var_group_id) || (!this.registered_vars_by_ids[param.var_group_id]) ||
            (!this.registered_vars_by_ids[param.var_group_id].name) ||
            (!this.registered_vars_groups_controller[this.registered_vars_by_ids[param.var_group_id].name]) ||
            (!this.registered_vars_groups_controller[this.registered_vars_by_ids[param.var_group_id].name].varDataParamController) ||
            (!this.registered_vars_groups_controller[this.registered_vars_by_ids[param.var_group_id].name].varDataParamController.getIndex)) {
            return;
        }

        let param_controller: VarDataParamControllerBase<TDataParam> = this.registered_vars_groups_controller[this.registered_vars_by_ids[param.var_group_id].name].varDataParamController;
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

        if ((!param) || (!param.var_group_id) || (!this.registered_vars_by_ids[param.var_group_id]) ||
            (!this.registered_vars_by_ids[param.var_group_id].name) ||
            (!this.registered_vars_groups_controller[this.registered_vars_by_ids[param.var_group_id].name]) ||
            (!this.registered_vars_groups_controller[this.registered_vars_by_ids[param.var_group_id].name].varDataParamController) ||
            (!this.registered_vars_groups_controller[this.registered_vars_by_ids[param.var_group_id].name].varDataParamController.getIndex)) {
            return;
        }

        let param_index: string = this.registered_vars_groups_controller[this.registered_vars_by_ids[param.var_group_id].name].varDataParamController.getIndex(param);
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

        if ((!param) || (!param.var_group_id) || (!this.registered_vars_by_ids[param.var_group_id]) ||
            (!this.registered_vars_by_ids[param.var_group_id].name) ||
            (!this.registered_vars_groups_controller[this.registered_vars_by_ids[param.var_group_id].name]) ||
            (!this.registered_vars_groups_controller[this.registered_vars_by_ids[param.var_group_id].name].varDataParamController) ||
            (!this.registered_vars_groups_controller[this.registered_vars_by_ids[param.var_group_id].name].varDataParamController.getIndex)) {
            return;
        }

        let param_index: string = this.registered_vars_groups_controller[this.registered_vars_by_ids[param.var_group_id].name].varDataParamController.getIndex(param);
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

    public getImportedVarsByIndexFromArray<TImportedData extends IImportedVarDataVOBase>(
        compteursValeursImportees: TImportedData[]): { [var_id: number]: { [param_index: string]: TImportedData } } {
        let res: { [var_id: number]: { [param_index: string]: TImportedData } } = {};

        for (let i in compteursValeursImportees) {
            let importedData: TImportedData = compteursValeursImportees[i];

            if ((!importedData) || (!importedData.var_group_id) || (!this.registered_vars_by_ids[importedData.var_group_id]) ||
                (!this.registered_vars_by_ids[importedData.var_group_id].name) ||
                (!this.registered_vars_groups_controller[this.registered_vars_by_ids[importedData.var_group_id].name]) ||
                (!this.registered_vars_groups_controller[this.registered_vars_by_ids[importedData.var_group_id].name].varDataParamController) ||
                (!this.registered_vars_groups_controller[this.registered_vars_by_ids[importedData.var_group_id].name].varDataParamController.getIndex)) {
                continue;
            }

            let param_index: string = this.registered_vars_groups_controller[this.registered_vars_by_ids[importedData.var_group_id].name].varDataParamController.getIndex(
                importedData
            );

            if (!res[importedData.var_id]) {
                res[importedData.var_id] = {};
            }

            res[importedData.var_id][param_index] = importedData;
        }

        return res;
    }

    public getVarConf(name: string): VarConfVOBase {
        return this.registered_vars ? (this.registered_vars[name] ? this.registered_vars[name] : null) : null;
    }

    public getVarGroupConf(group_name: string): VarGroupConfVOBase {
        return this.registered_vars_groups ? (this.registered_vars_groups[group_name] ? this.registered_vars_groups[group_name] : null) : null;
    }

    public getVarGroupController(group_name: string): VarGroupControllerBase<any, any, any> {
        return this.registered_vars_groups_controller ? (this.registered_vars_groups_controller[group_name] ? this.registered_vars_groups_controller[group_name] : null) : null;
    }

    public getVarGroupControllerById(group_id: number): VarGroupControllerBase<any, any, any> {
        if ((!this.registered_vars_groups_by_ids) || (!this.registered_vars_groups_by_ids[group_id]) ||
            (!this.registered_vars_groups_controller)) {
            return null;
        }

        let res = this.registered_vars_groups_controller[this.registered_vars_groups_by_ids[group_id].name];
        return res ? res : null;
    }

    public async registerVar(varConf: VarConfVOBase): Promise<VarConfVOBase> {

        if (this.registered_vars && this.registered_vars[varConf.name]) {
            return this.registered_vars[varConf.name];
        }

        let daoVarConf: VarConfVOBase = await ModuleDAO.getInstance().getNamedVoByName<VarConfVOBase>(varConf._type, varConf.name);

        if (daoVarConf) {
            await this.setVar(daoVarConf);
            return daoVarConf;
        }
        console.error(daoVarConf + ":" + varConf._type + ":" + varConf.name);
        console.error(JSON.stringify(await ModuleDAO.getInstance().getVos(varConf._type)));

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(varConf);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            return null;
        }

        varConf.id = parseInt(insertOrDeleteQueryResult.id.toString());
        await this.setVar(varConf);

        return varConf;
    }

    public async registerVarGroup(varGroupConf: VarGroupConfVOBase, controller: VarGroupControllerBase<any, any, any>): Promise<VarGroupConfVOBase> {
        if (this.registered_vars_groups && this.registered_vars_groups[varGroupConf.name]) {
            return this.registered_vars_groups[varGroupConf.name];
        }

        let daoVarGroupConf: VarGroupConfVOBase = await ModuleDAO.getInstance().getNamedVoByName<VarGroupConfVOBase>(varGroupConf._type, varGroupConf.name);

        if (daoVarGroupConf) {
            await this.setVarGroup(daoVarGroupConf, controller);
            return daoVarGroupConf;
        }
        console.error(daoVarGroupConf + ":" + varGroupConf._type + ":" + varGroupConf.name);
        console.error(JSON.stringify(await ModuleDAO.getInstance().getVos(varGroupConf._type)));

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(varGroupConf);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            return null;
        }

        varGroupConf.id = parseInt(insertOrDeleteQueryResult.id.toString());

        await this.setVarGroup(varGroupConf, controller);
        return varGroupConf;
    }

    private async setVarGroup(varGroup: VarGroupConfVOBase, controller: VarGroupControllerBase<any, any, any>) {
        this.registered_vars_groups[varGroup.name] = varGroup;
        this.registered_vars_groups_controller[varGroup.name] = controller;
        this.registered_vars_groups_by_ids[varGroup.id] = varGroup;
        await controller.registerVars();
    }

    private async setVar(varConf: VarConfVOBase) {
        this.registered_vars[varConf.name] = varConf;
        this.registered_vars_by_ids[varConf.id] = varConf;
    }

    /**
     * On va chercher à dépiler toutes les demandes en attente,
     *  et dans un ordre définit par le controller du type de var group
     */
    private async updateDatas() {

        // On passe par une copie pour ne pas dépendre des demandes de mise à jour en cours
        //  et on réinitialise immédiatement les waiting for update, comme ça on peut voir ce qui a été demandé pendant qu'on
        //  mettait à jour (important pour éviter des bugs assez difficiles à identifier potentiellement)
        let params_copy: { [paramIndex: string]: IVarDataParamVOBase } = Object.assign({}, this.waitingForUpdate);
        this.waitingForUpdate = {};

        let ordered_params_by_var_group_ids: { [var_group_id: number]: IVarDataParamVOBase[] } = {};

        // On organise un peu les datas
        for (let paramIndex in params_copy) {
            let param: IVarDataParamVOBase = params_copy[paramIndex];

            if (!ordered_params_by_var_group_ids[param.var_group_id]) {
                ordered_params_by_var_group_ids[param.var_group_id] = [];
            }
            ordered_params_by_var_group_ids[param.var_group_id].push(param);
        }

        // On demande l'ordre dans lequel résoudre les params
        for (let var_group_id in ordered_params_by_var_group_ids) {
            let ordered_params: IVarDataParamVOBase[] = ordered_params_by_var_group_ids[var_group_id];

            if ((!this.registered_vars_groups_by_ids[var_group_id]) ||
                (!this.registered_vars_groups_by_ids[var_group_id].name) ||
                (!this.registered_vars_groups_controller[this.registered_vars_groups_by_ids[var_group_id].name]) ||
                (!this.registered_vars_groups_controller[this.registered_vars_groups_by_ids[var_group_id].name].varDataParamController) ||
                (!this.registered_vars_groups_controller[this.registered_vars_groups_by_ids[var_group_id].name].varDataParamController.sortParams)) {
                continue;
            }
            this.registered_vars_groups_controller[this.registered_vars_groups_by_ids[var_group_id].name].varDataParamController.sortParams(ordered_params);
        }

        // Et une fois que tout est propre, on lance la mise à jour de chaque élément
        for (let var_group_id in ordered_params_by_var_group_ids) {
            let vars_params: IVarDataParamVOBase[] = ordered_params_by_var_group_ids[var_group_id];

            for (let i in vars_params) {
                let var_params: IVarDataParamVOBase = vars_params[i];

                await this.registered_vars_groups_controller[this.registered_vars_groups_by_ids[var_group_id].name].updateData(var_params);
            }
        }
    }
}