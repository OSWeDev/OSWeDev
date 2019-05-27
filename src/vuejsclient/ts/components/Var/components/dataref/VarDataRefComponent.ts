import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import VarDAGNode from '../../../../../../shared/modules/Var/graph/var/VarDAGNode';
import ISimpleNumberVarData from '../../../../../../shared/modules/Var/interfaces/ISimpleNumberVarData';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import './VarDataRefComponent.scss';
import moment = require('moment');

@Component({
    template: require('./VarDataRefComponent.pug')
})
export default class VarDataRefComponent extends VueComponentBase {
    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: IVarDataVOBase };
    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarGetter
    public get_dependencies_heatmap_version: number;
    @ModuleVarAction
    public setDescSelectedIndex: (desc_selected_index: string) => void;
    @ModuleVarGetter
    public isDescMode: boolean;
    @ModuleVarGetter
    public getUpdatingParamsByVarsIds: { [index: string]: boolean };

    @Prop()
    public var_param: IVarDataParamVOBase;

    @Prop({ default: null })
    public var_value_callback: (var_value: IVarDataVOBase) => any;

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

    private entered_once: boolean = false;

    get is_being_updated(): boolean {

        // Si la var data est null on considère qu'elle est en cours de chargement. C'est certainement faux, souvent, mais ça peut aider beaucoup pour afficher au plus tôt le fait que la var est en attente de calcul
        if (!this.var_data) {
            return true;
        }

        return (!!this.getUpdatingParamsByVarsIds) && (!!this.var_param) &&
            (!!this.getUpdatingParamsByVarsIds[VarsController.getInstance().getIndex(this.var_param)]);
    }

    get filtered_value() {

        if (!this.var_data) {
            return null;
        }

        if (!this.filter) {
            return this.var_data_value;
        }

        let params = [this.var_data_value];

        if (!!this.filter_additional_params) {
            params = params.concat(this.filter_additional_params);
        }

        return this.filter.apply(null, params);
    }

    get var_data_value() {
        if (!this.var_data) {
            return null;
        }

        if (!this.var_value_callback) {
            return (this.var_data as ISimpleNumberVarData).value;
        }

        return this.var_value_callback(this.var_data);
    }

    get is_selected_var(): boolean {
        if (!this.isDescMode) {
            return false;
        }
        return this.getDescSelectedIndex == VarsController.getInstance().getIndex(this.var_param);
    }

    get is_selected_var_dependency(): boolean {
        if (!this.isDescMode) {
            return false;
        }

        let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedIndex];

        if (!selectedNode) {
            return false;
        }

        return this.is_selected_var_dependency_rec(selectedNode, VarsController.getInstance().varDAG.nodes[VarsController.getInstance().getIndex(this.var_param)], false);
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

    get is_dependencies_heatmap_lvl_0(): boolean {
        if (!this.isDescMode) {
            return false;
        }

        if (this.get_dependencies_heatmap_version <= 0) {
            return true;
        }

        if (!VarsController.getInstance().varDAG.dependencies_heatmap_lvl_1) {
            return true;
        }

        let vardagnode = VarsController.getInstance().varDAG.nodes[VarsController.getInstance().getIndex(this.var_param)];

        if (!vardagnode) {
            return false;
        }

        return vardagnode.dependencies_count < VarsController.getInstance().varDAG.dependencies_heatmap_lvl_1;
    }

    get is_dependencies_heatmap_lvl_1(): boolean {
        if (!this.isDescMode) {
            return false;
        }

        if (this.get_dependencies_heatmap_version <= 0) {
            return false;
        }

        if ((!VarsController.getInstance().varDAG.dependencies_heatmap_lvl_1) || (!VarsController.getInstance().varDAG.dependencies_heatmap_lvl_2)) {
            return false;
        }

        let vardagnode = VarsController.getInstance().varDAG.nodes[VarsController.getInstance().getIndex(this.var_param)];

        if (!vardagnode) {
            return false;
        }

        return (vardagnode.dependencies_count >= VarsController.getInstance().varDAG.dependencies_heatmap_lvl_1) &&
            (vardagnode.dependencies_count < VarsController.getInstance().varDAG.dependencies_heatmap_lvl_2);
    }

    get is_dependencies_heatmap_lvl_2(): boolean {
        if (!this.isDescMode) {
            return false;
        }

        if (this.get_dependencies_heatmap_version <= 0) {
            return false;
        }

        if ((!VarsController.getInstance().varDAG.dependencies_heatmap_lvl_2) || (!VarsController.getInstance().varDAG.dependencies_heatmap_lvl_3)) {
            return false;
        }

        let vardagnode = VarsController.getInstance().varDAG.nodes[VarsController.getInstance().getIndex(this.var_param)];

        if (!vardagnode) {
            return false;
        }

        return (vardagnode.dependencies_count >= VarsController.getInstance().varDAG.dependencies_heatmap_lvl_2) &&
            (vardagnode.dependencies_count < VarsController.getInstance().varDAG.dependencies_heatmap_lvl_3);
    }

    get is_dependencies_heatmap_lvl_3(): boolean {
        if (!this.isDescMode) {
            return false;
        }

        if (this.get_dependencies_heatmap_version <= 0) {
            return false;
        }

        if ((!VarsController.getInstance().varDAG.dependencies_heatmap_lvl_3) || (!VarsController.getInstance().varDAG.dependencies_heatmap_lvl_4)) {
            return false;
        }

        let vardagnode = VarsController.getInstance().varDAG.nodes[VarsController.getInstance().getIndex(this.var_param)];

        if (!vardagnode) {
            return false;
        }

        return (vardagnode.dependencies_count >= VarsController.getInstance().varDAG.dependencies_heatmap_lvl_3) &&
            (vardagnode.dependencies_count < VarsController.getInstance().varDAG.dependencies_heatmap_lvl_4);
    }

    get is_dependencies_heatmap_lvl_4(): boolean {
        if (!this.isDescMode) {
            return false;
        }

        if (this.get_dependencies_heatmap_version <= 0) {
            return false;
        }

        if ((!VarsController.getInstance().varDAG.dependencies_heatmap_lvl_4) || (!VarsController.getInstance().varDAG.dependencies_heatmap_lvl_5)) {
            return false;
        }

        let vardagnode = VarsController.getInstance().varDAG.nodes[VarsController.getInstance().getIndex(this.var_param)];

        if (!vardagnode) {
            return false;
        }

        return (vardagnode.dependencies_count >= VarsController.getInstance().varDAG.dependencies_heatmap_lvl_4) &&
            (vardagnode.dependencies_count < VarsController.getInstance().varDAG.dependencies_heatmap_lvl_5);
    }

    get is_dependencies_heatmap_lvl_5(): boolean {
        if (!this.isDescMode) {
            return false;
        }

        if (this.get_dependencies_heatmap_version <= 0) {
            return false;
        }

        if (!VarsController.getInstance().varDAG.dependencies_heatmap_lvl_5) {
            return false;
        }

        let vardagnode = VarsController.getInstance().varDAG.nodes[VarsController.getInstance().getIndex(this.var_param)];

        if (!vardagnode) {
            return false;
        }

        return vardagnode.dependencies_count >= VarsController.getInstance().varDAG.dependencies_heatmap_lvl_5;
    }

    get is_selected_var_dependent(): boolean {
        if (!this.isDescMode) {
            return false;
        }

        let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedIndex];

        if ((!selectedNode) || (!selectedNode.outgoingNames)) {
            return false;
        }

        return this.is_selected_var_dependency_rec(selectedNode, VarsController.getInstance().varDAG.nodes[VarsController.getInstance().getIndex(this.var_param)], true);
    }

    get var_data(): IVarDataVOBase {

        if ((!this.getVarDatas) || (!this.var_param)) {
            return null;
        }

        return this.getVarDatas[VarsController.getInstance().getIndex(this.var_param)];
    }

    public destroyed() {
        this.unregister();
    }

    private intersect_in() {
        this.register();
        this.entered_once = true;
    }

    private intersect_out() {
        if (!this.entered_once) {
            return;
        }
        this.unregister();
    }

    private register(var_param: IVarDataParamVOBase = null) {
        VarsController.getInstance().registerDataParam(var_param ? var_param : this.var_param, this.reload_on_mount);
    }

    private unregister(var_param: IVarDataParamVOBase = null) {
        VarsController.getInstance().unregisterDataParam(var_param ? var_param : this.var_param);
    }

    @Watch('var_param')
    private onChangeVarParam(new_var_param: IVarDataParamVOBase, old_var_param: IVarDataParamVOBase) {

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.getInstance().isSameParam(new_var_param, old_var_param)) {
            return;
        }

        if (old_var_param) {
            this.unregister(old_var_param);
        }

        if (new_var_param) {
            this.register();
        }
    }

    private selectVar() {
        if (!this.isDescMode) {
            return;
        }

        this.setDescSelectedIndex(VarsController.getInstance().getIndex(this.var_param));
    }
}