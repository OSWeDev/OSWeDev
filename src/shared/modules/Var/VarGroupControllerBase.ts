import IVarDataParamVOBase from './interfaces/IVarDataParamVOBase';
import IVarDataVOBase from './interfaces/IVarDataVOBase';
import VarCacheBase from './VarCacheBase';
import VarDataParamControllerBase from './VarDataParamControllerBase';
import VarsController from './VarsController';
import VarGroupConfVOBase from './vos/VarGroupConfVOBase';

export default abstract class VarGroupControllerBase<TData extends IVarDataVOBase, TDataParam extends IVarDataParamVOBase, TCache extends VarCacheBase> {

    protected cache: { [UID: number]: TCache } = {};

    protected constructor(
        public varGroupConf: VarGroupConfVOBase,
        public varDataParamController: VarDataParamControllerBase<TDataParam>) {
    }

    public async initialize() {
        this.varGroupConf = await VarsController.getInstance().registerVarGroup(this.varGroupConf, this);
        await this.registerVars();
    }
    public abstract async registerVars();

    public abstract getOrderedVarsNames(): string[];

    get orderedVarsNames(): string[] {
        return this.getOrderedVarsNames();
    }

    public async abstract updateData(param: TDataParam);

    protected startUpdateSoldes(UID: number): void {
        this.cache[UID] = {} as TCache;
    }
    protected endUpdateSoldes(UID: number): void {
        if (!!this.cache) {

            delete this.cache[UID];
        }
    }
}