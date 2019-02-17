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
import VarDAGNode from '../../../../../../shared/modules/Var/graph/var/VarDAGNode';

@Component({
    template: require('./VarDescComponent.pug')
})
export default class VarDescComponent extends VueComponentBase {

    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;
    @ModuleVarGetter
    public isDescDepsOpened: boolean;
    @ModuleVarAction
    public setDescDepsOpened: (desc_deps_opened: boolean) => void;

    @Prop()
    public var_param: IVarDataParamVOBase;
    @Prop({ default: 0 })
    public depth: number;
    @Prop({ default: 2 })
    public max_depth: number;

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

        return this.t(VarsController.getInstance().get_translatable_name_code(this.var_param.var_id));
    }

    get var_description(): string {
        if (!this.var_param) {
            return null;
        }

        return this.t(VarsController.getInstance().get_translatable_description_code(this.var_param.var_id));
    }

    get var_params_desc(): string {
        if (!this.var_param) {
            return null;
        }

        return this.t(VarsController.getInstance().get_translatable_params_desc_code(this.var_param.var_id), this.var_param);
    }

    get var_deps(): { [name: string]: VarDAGNode } {
        if (!this.var_param) {
            return null;
        }

        return VarsController.getInstance().varDAG.nodes[
            VarsController.getInstance().getVarControllerById(this.var_param.var_id).varDataParamController.getIndex(this.var_param)].outgoing;
    }

    private select_var() {
        this.setDescSelectedIndex(this.var_index);
    }

    private un_select_var() {
        this.setDescSelectedIndex(null);
    }
}