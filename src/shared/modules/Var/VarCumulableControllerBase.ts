import VarCumulControllerBase from './cumuls/VarCumulControllerBase';
import IDateIndexedSimpleNumberVarData from './interfaces/IDateIndexedSimpleNumberVarData';
import VarControllerBase from './VarControllerBase';
import VarDataParamControllerBase from './VarDataParamControllerBase';
import VarsController from './VarsController';
import VarConfVOBase from './vos/VarConfVOBase';
import IDateIndexedVarDataParam from './interfaces/IDateIndexedVarDataParam';

export default abstract class VarCumulableControllerBase<TData extends IDateIndexedSimpleNumberVarData, TDataParam extends IDateIndexedVarDataParam> extends VarControllerBase<TData, TDataParam> {

    protected constructor(
        public varConf: VarConfVOBase,
        public varDataParamController: VarDataParamControllerBase<TDataParam>,
        public cumuls_types: string[] = [],
        public var_data_constructor: () => TData = null) {
        super(varConf, varDataParamController);
    }

    public async initialize() {
        this.varConf = await VarsController.getInstance().registerVar(this.varConf, this);
        await this.configure_from_json_params();

        for (let i in this.cumuls_types) {
            let cumul_type: string = this.cumuls_types[i];

            await (new VarCumulControllerBase(
                this.varConf, cumul_type, this.var_data_constructor)).initialize();
        }
    }
}