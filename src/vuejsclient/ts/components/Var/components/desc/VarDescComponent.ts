import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import './VarDescComponent.scss';
import moment = require('moment');
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter, ModuleVarAction } from '../../store/VarStore';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarControllerBase from '../../../../../../shared/modules/Var/VarControllerBase';
import { watch } from 'fs';

@Component({
    template: require('./VarDescComponent.pug')
})
export default class VarDescComponent extends VueComponentBase {

    @Prop()
    public var_param: IVarDataParamVOBase;
    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;

    private openDeps: boolean = false;

    get is_selected_var(): boolean {
        return this.getDescSelectedIndex == this.var_index;
    }

    get var_index(): string {
        if (!this.var_param) {
            return null;
        }

        return VarsController.getInstance().getVarControllerById(this.var_param.var_id).varDataParamController.getIndex(this.var_param);
    }

    get var_name(): string {
        if (!this.var_param) {
            return null;
        }

        return this.t(VarsController.getInstance().get_translatable_name_code(VarsController.getInstance().getVarControllerById(this.var_param.var_id).varConf), this.var_param);
    }

    get var_description(): string {
        if (!this.var_param) {
            return null;
        }

        return this.t(VarsController.getInstance().get_translatable_description_code(VarsController.getInstance().getVarControllerById(this.var_param.var_id).varConf), this.var_param);
    }

    get var_params_desc(): string {
        if (!this.var_param) {
            return null;
        }

        return this.t(VarsController.getInstance().get_translatable_params_desc_code(VarsController.getInstance().getVarControllerById(this.var_param.var_id).varConf), this.var_param);
    }

    get var_deps(): IVarDataParamVOBase[] {
        if (!this.var_param) {
            return null;
        }

        return VarsController.getInstance().last_batch_dependencies_by_param[
            VarsController.getInstance().getVarControllerById(this.var_param.var_id).varDataParamController.getIndex(this.var_param)];
    }

    private select_var() {
        this.setDescSelectedIndex(this.var_index);
    }

    private un_select_var() {
        this.setDescSelectedIndex(null);
    }

    @Watch('var_param')
    private on_change_param() {
        this.openDeps = false;
    }
}