import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import VarDAGNode from '../../../../../../shared/modules/Var/graph/var/VarDAGNode';
import ISimpleNumberVarData from '../../../../../../shared/modules/Var/interfaces/ISimpleNumberVarData';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import './VarDataSumComponent.scss';
import moment = require('moment');

@Component({
    template: require('./VarDataSumComponent.pug')
})
export default class VarDataSumComponent extends VueComponentBase {
    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: IVarDataVOBase };
    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;
    @ModuleVarGetter
    public isDescMode: boolean;
    @ModuleVarGetter
    public getUpdatingParamsByVarsIds: { [index: string]: boolean };

    @Prop()
    public var_params: IVarDataParamVOBase[];

    @Prop({ default: null })
    public filter: () => any;

    @Prop({ default: null })
    public filter_additional_params: any[];

    @Prop({ default: false })
    public reload_on_mount: boolean;

    @Prop({ default: null })
    public prefix: string;

    @Prop({ default: null })
    public suffix: string;

    @Prop({ default: null })
    public null_value_replacement: string;

    @Prop({ default: null })
    public zero_value_replacement: string;

    @Prop({ default: false })
    public consider_zero_value_as_null: boolean;

    get is_being_updated(): boolean {

        for (let i in this.var_params) {
            let var_param = this.var_params[i];

            if ((!!this.getUpdatingParamsByVarsIds) && (!!var_param) &&
                (!!this.getUpdatingParamsByVarsIds[VarsController.getInstance().getIndex(var_param)])) {
                return true;
            }
        }

        return false;
    }

    get filtered_value() {

        if (!this.var_datas) {
            return null;
        }

        let res: number = 0;
        for (let i in this.var_datas) {
            let var_data = this.var_datas[i];
            res += (var_data as ISimpleNumberVarData).value;
        }

        if (!this.filter) {

            return res;
        }

        let params = [res];

        if (!!this.filter_additional_params) {
            params = params.concat(this.filter_additional_params);
        }

        return this.filter.apply(null, params);
    }

    get is_selected_var(): boolean {
        if (!this.isDescMode) {
            return false;
        }

        for (let i in this.var_params) {
            let var_param = this.var_params[i];

            if (this.getDescSelectedIndex == VarsController.getInstance().getIndex(var_param)) {
                return true;
            }
        }
        return false;
    }

    get is_selected_var_dependency(): boolean {
        if (!this.isDescMode) {
            return false;
        }

        let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedIndex];

        if (!selectedNode) {
            return false;
        }

        for (let i in this.var_params) {
            let var_param = this.var_params[i];

            if (this.is_selected_var_dependency_rec(selectedNode, VarsController.getInstance().varDAG.nodes[VarsController.getInstance().getIndex(var_param)], false)) {
                return true;
            }
        }
        return false;
    }

    public is_selected_var_dependency_rec(selectedNode: VarDAGNode, test_node: VarDAGNode, test_incoming: boolean): boolean {
        // On traverse les deps de même var_id en considérant que c'est à plat. Ca permet de voir une
        //  dep de type cumul au complet et pas juste le jour de demande du cumul
        if ((!test_node) || (!selectedNode)) {
            return false;
        }
        if (!!test_incoming) {

            if ((!!test_node.incomingNames) && (test_node.incomingNames.indexOf(VarsController.getInstance().getIndex(selectedNode.param)) >= 0)) {
                return true;
            }

            for (let i in test_node.incoming) {
                let incoming: VarDAGNode = test_node.incoming[i] as VarDAGNode;


                if (incoming.param.var_id == selectedNode.param.var_id) {
                    if (this.is_selected_var_dependency_rec(selectedNode, incoming, test_incoming)) {
                        return true;
                    }
                }
            }
        } else {

            if ((!!test_node.outgoingNames) && (test_node.outgoingNames.indexOf(VarsController.getInstance().getIndex(selectedNode.param)) >= 0)) {
                return true;
            }

            for (let i in test_node.outgoing) {
                let outgoing: VarDAGNode = test_node.outgoing[i] as VarDAGNode;


                if (outgoing.param.var_id == selectedNode.param.var_id) {
                    if (this.is_selected_var_dependency_rec(selectedNode, outgoing, test_incoming)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    get is_selected_var_dependent(): boolean {
        if (!this.isDescMode) {
            return false;
        }

        let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedIndex];

        if ((!selectedNode) || (!selectedNode.outgoingNames)) {
            return false;
        }

        for (let i in this.var_params) {
            let var_param = this.var_params[i];

            if (this.is_selected_var_dependency_rec(selectedNode, VarsController.getInstance().varDAG.nodes[VarsController.getInstance().getIndex(var_param)], true)) {
                return true;
            }
        }
        return false;
    }

    get var_datas(): IVarDataVOBase[] {

        if ((!this.getVarDatas) || (!this.var_params) || (!this.var_params.length)) {
            return null;
        }

        let res: IVarDataVOBase[] = [];

        for (let i in this.var_params) {
            let var_param = this.var_params[i];
            let var_data = this.getVarDatas[VarsController.getInstance().getIndex(var_param)];

            if (!!var_data) {

                res.push(var_data);
            }
        }

        return res.length ? res : null;
    }

    public destroyed() {

        for (let i in this.var_params) {
            let var_param = this.var_params[i];
            VarsController.getInstance().unregisterDataParam(var_param);
        }
    }


    @Watch('var_param', { immediate: true })
    private onChangeVarParam(new_var_param: IVarDataParamVOBase, old_var_param: IVarDataParamVOBase) {

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.getInstance().isSameParam(new_var_param, old_var_param)) {
            return;
        }

        if (old_var_param) {
            VarsController.getInstance().unregisterDataParam(old_var_param);
        }

        if (new_var_param) {
            VarsController.getInstance().registerDataParam(new_var_param, this.reload_on_mount);
        }
    }
}