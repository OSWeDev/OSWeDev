import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import ISimpleNumberVarData from '../../../../../../shared/modules/Var/interfaces/ISimpleNumberVarData';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import './VarDataIfComponent.scss';
import moment = require('moment');

@Component({
    template: require('./VarDataIfComponent.pug')
})
export default class VarDataIfComponent extends VueComponentBase {
    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: IVarDataVOBase };
    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;
    @ModuleVarGetter
    public isDescMode: boolean;
    @ModuleVarGetter
    public getUpdatingParamsByVarsIds: { [var_id: number]: { [index: string]: IVarDataParamVOBase } };

    @Prop()
    public var_param: IVarDataParamVOBase;

    @Prop({ default: null })
    public condition: (value: IVarDataVOBase) => boolean;

    @Prop({ default: false })
    public reload_on_mount: boolean;

    get var_index(): string {
        if ((!this.var_param) || (!VarsController.getInstance().getVarControllerById(this.var_param.var_id))) {
            return null;
        }

        return VarsController.getInstance().getVarControllerById(this.var_param.var_id).varDataParamController.getIndex(this.var_param);
    }

    get var_data(): IVarDataVOBase {

        if ((!this.getVarDatas) || (!this.var_param)) {
            return null;
        }

        return this.getVarDatas[this.var_index];
    }

    public destroyed() {

        VarsController.getInstance().unregisterDataParam(this.var_param);
    }

    @Watch('var_param', { immediate: true })
    private onChangeVarParam(new_var_param: IVarDataParamVOBase, old_var_param: IVarDataParamVOBase) {

        if (old_var_param) {
            VarsController.getInstance().unregisterDataParam(old_var_param);
        }

        if (new_var_param) {
            VarsController.getInstance().registerDataParam(new_var_param, this.reload_on_mount);
        }
    }

    get condition_is_true(): boolean {
        if (!this.condition) {
            return false;
        }

        return this.condition(this.var_data);
    }
}