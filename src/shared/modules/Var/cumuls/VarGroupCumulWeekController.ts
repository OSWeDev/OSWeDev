import VarGroupControllerBase from '../VarGroupControllerBase';
import IVarDataVOBase from '../interfaces/IVarDataVOBase';
import IVarDataParamVOBase from '../interfaces/IVarDataParamVOBase';
import VarCacheBase from '../VarCacheBase';
import VarsController from '../VarsController';
import VarGroupConfVOBase from '../vos/VarGroupConfVOBase';
import VarDataParamControllerBase from '../VarDataParamControllerBase';
import IDateIndexedVarDataParam from '../interfaces/IDateIndexedVarDataParam';

export default class VarGroupCumulWeekController<TData extends IVarDataVOBase, TDataParam extends IDateIndexedVarDataParam, TCache extends VarCacheBase> extends VarGroupControllerBase<TData, TDataParam, TCache> {

    protected cache: { [UID: number]: TCache } = {};

    protected constructor(
        varGroupConfToCumul: VarGroupConfVOBase,
        varDataParamController: VarDataParamControllerBase<TDataParam>) {
        super(varGroupConfToCumul, varDataParamController);
    }

    public async initialize() {

        // On part de la conf de la data à cumuler et on en fait un cumul week
        let varGroupConf: VarGroupConfVOBase = Object.assign({}, this.varGroupConf);
        varGroupConf.id = null;
        varGroupConf.name =
            this.varGroupConf = await VarsController.getInstance().registerVarGroup(this.varGroupConf, this);
        await this.registerVars();
    }
    public abstract async registerVars();

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