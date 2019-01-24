import IVarDataVOBase from '../interfaces/IVarDataVOBase';
import IVarDataParamVOBase from '../interfaces/IVarDataParamVOBase';
import VarCacheBase from '../VarCacheBase';
import VarsController from '../VarsController';
import VarDataParamControllerBase from '../VarDataParamControllerBase';
import VarsCumulsController from './VarsCumulsController';
import ISimpleNumberVarData from '../interfaces/ISimpleNumberVarData';
import IDateIndexedVarDataParam from '../interfaces/IDateIndexedVarDataParam';
import VarConfVOBase from '../vos/VarConfVOBase';
import VarControllerBase from '../VarControllerBase';

export default class VarCumulControllerBase<TData extends ISimpleNumberVarData, TDataParam extends IDateIndexedVarDataParam, TCache extends VarCacheBase> extends VarControllerBase<TData, TDataParam, TCache> {

    protected cache: { [UID: number]: TCache } = {};

    protected constructor(
        varConfToCumulate: VarConfVOBase,
        protected cumulType: string,
        varDataParamController: VarDataParamControllerBase<TDataParam>) {
        super(varConfToCumulate, varDataParamController);
    }

    public async initialize() {

        // On part de la conf de la data à cumuler et on en fait un cumul week
        let varConf: VarConfVOBase = Object.assign({}, this.varConf);
        varConf.id = null;
        varConf.name = VarsCumulsController.getInstance().getCumulaticName(varConf.name, this.cumulType);

        // TODO VARS : il faut déclarer les vos correspondants en base sur les modules serveurs, là c'est juste de la nommenclature....
        varConf.var_data_vo_type = VarsCumulsController.getInstance().getCumulaticName(varConf.var_data_vo_type, this.cumulType);
        varConf.var_imported_data_vo_type = VarsCumulsController.getInstance().getCumulaticName(varConf.var_imported_data_vo_type, this.cumulType);

        this.varConf = await VarsController.getInstance().registerVar(varConf, this);
        await this.registerVars();
    }

    public async registerVars() {
        // TODO VARS : pour chaque var on veut pouvoir créer

    }

    public abstract getOrderedVarsNames(): string[];

    get orderedVarsNames(): string[] {
        return this.getOrderedVarsNames();
    }

    public async abstract begin_batch(BATCH_UID: number, vars_params: TDataParam[]);
    public async abstract end_batch(BATCH_UID: number, vars_params: TDataParam[]);

    /**
     * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
     * @param BATCH_UID
     * @param param
     */
    public async abstract getDependencies(BATCH_UID: number, param: TDataParam): Promise<TDataParam[]>;

    public async abstract updateData(BATCH_UID: number, param: TDataParam);

    protected startUpdateSoldes(UID: number): void {
        this.cache[UID] = {} as TCache;
    }
    protected endUpdateSoldes(UID: number): void {
        if (!!this.cache) {

            delete this.cache[UID];
        }
    }
}