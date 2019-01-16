import * as moment from 'moment';
import { Moment } from 'moment';
import VarCacheBase from './VarCacheBase';
import VarsController from './VarsController';
import VarDataVOBase from './vos/VarDataVOBase';
import VarGroupConfVOBase from './vos/VarGroupConfVOBase';
import VarDataParamVOBase from './vos/VarDataParamVOBase';
import VarDataParamControllerBase from './VarDataParamControllerBase';

export default abstract class VarGroupControllerBase<TData extends VarDataVOBase, TDataParam extends VarDataParamVOBase, TCache extends VarCacheBase> {

    private static UID: number = 0;

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

    protected async abstract updateData(param: TDataParam);

    protected startUpdateSoldes(UID: number): void {
        this.cache[UID] = {} as TCache;
    }
    protected endUpdateSoldes(UID: number): void {
        if (!!this.cache) {

            delete this.cache[UID];
        }
    }
}