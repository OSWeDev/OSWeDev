import { Component, Prop, Watch } from 'vue-property-decorator';
import 'vue-tables-2';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import VarsClientController from '../../VarsClientController';
import './VarDataSumComponent.scss';

@Component({
    template: require('./VarDataSumComponent.pug')
})
export default class VarDataSumComponent extends VueComponentBase {

    private static UID: number = 0;

    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: VarDataValueResVO };
    @ModuleVarGetter
    public getDescSelectedVarParam: VarDataBaseVO;
    @ModuleVarAction
    public setDescSelectedVarParam: (desc_selected_var_param: VarDataBaseVO) => void;
    @ModuleVarGetter
    public isDescMode: boolean;

    @Prop()
    public var_params: VarDataBaseVO[];

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

    private this_uid: number = VarDataSumComponent.UID++;

    get is_being_updated(): boolean {

        // Si la var data est null on considère qu'elle est en cours de chargement. C'est certainement faux, souvent, mais ça peut aider beaucoup pour afficher au plus tôt le fait que la var est en attente de calcul
        if (!this.var_datas) {
            return true;
        }

        for (let i in this.var_datas) {
            let var_data = this.var_datas[i];
            if (typeof var_data.value === 'undefined') {
                return true;
            }
        }

        return false;
    }

    get filtered_value() {

        if (!this.var_datas) {
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
        let res: number = 0;

        for (let i in this.var_datas) {
            let var_data = this.var_datas[i];
            res += var_data.value;
        }

        return res;
    }

    get is_selected_var(): boolean {
        if ((!this.isDescMode) || (!this.getDescSelectedVarParam)) {
            return false;
        }

        for (let i in this.var_params) {
            let var_param = this.var_params[i];

            if (this.getDescSelectedVarParam.index == var_param.index) {
                return true;
            }
        }
        return false;
    }

    // get is_selected_var_dependency(): boolean {
    //     if (!this.isDescMode) {
    //         return false;
    //     }

    //     let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedVarParam];

    //     if (!selectedNode) {
    //         return false;
    //     }

    //     for (let i in this.var_params) {
    //         let var_param = this.var_params[i];

    //         if (this.is_selected_var_dependency_rec(selectedNode, VarsController.getInstance().varDAG.nodes[VarsController.getInstance().getIndex(var_param)], false)) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    // public is_selected_var_dependency_rec(selectedNode: VarDAGNode, test_node: VarDAGNode, test_incoming: boolean): boolean {
    //     // On traverse les deps de même var_id en considérant que c'est à plat. Ca permet de voir une
    //     //  dep de type cumul au complet et pas juste le jour de demande du cumul
    //     if ((!test_node) || (!selectedNode)) {
    //         return false;
    //     }
    //     if (!!test_incoming) {

    //         if ((!!test_node.incomingNames) && (test_node.incomingNames.indexOf(VarsController.getInstance().getIndex(selectedNode.param)) >= 0)) {
    //             return true;
    //         }

    //         for (let i in test_node.incoming) {
    //             let incoming: VarDAGNode = test_node.incoming[i] as VarDAGNode;


    //             if (incoming.param.var_id == selectedNode.param.var_id) {
    //                 if (this.is_selected_var_dependency_rec(selectedNode, incoming, test_incoming)) {
    //                     return true;
    //                 }
    //             }
    //         }
    //     } else {

    //         if ((!!test_node.outgoingNames) && (test_node.outgoingNames.indexOf(VarsController.getInstance().getIndex(selectedNode.param)) >= 0)) {
    //             return true;
    //         }

    //         for (let i in test_node.outgoing) {
    //             let outgoing: VarDAGNode = test_node.outgoing[i] as VarDAGNode;


    //             if (outgoing.param.var_id == selectedNode.param.var_id) {
    //                 if (this.is_selected_var_dependency_rec(selectedNode, outgoing, test_incoming)) {
    //                     return true;
    //                 }
    //             }
    //         }
    //     }
    //     return false;
    // }

    // get is_selected_var_dependent(): boolean {
    //     if (!this.isDescMode) {
    //         return false;
    //     }

    //     let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedVarParam];

    //     if ((!selectedNode) || (!selectedNode.outgoingNames)) {
    //         return false;
    //     }

    //     for (let i in this.var_params) {
    //         let var_param = this.var_params[i];

    //         if (this.is_selected_var_dependency_rec(selectedNode, VarsController.getInstance().varDAG.nodes[VarsController.getInstance().getIndex(var_param)], true)) {
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    get var_datas(): VarDataValueResVO[] {

        if ((!this.getVarDatas) || (!this.var_params) || (!this.var_params.length)) {
            return null;
        }

        let res: VarDataValueResVO[] = [];

        for (let i in this.var_params) {
            let var_param = this.var_params[i];
            let var_data = this.getVarDatas[var_param.index];

            if (!!var_data) {

                res.push(var_data);
            }
        }

        return res.length ? res : null;
    }

    public destroyed() {

        this.unregister(this.var_params);
    }

    private intersect_in() {
        this.register(this.var_params);

        this.entered_once = true;
    }

    private intersect_out() {
        if (!this.entered_once) {
            return;
        }

        this.unregister(this.var_params);
    }

    private register(var_params: VarDataBaseVO[]) {
        VarsClientController.getInstance().registerParams(var_params);
    }

    private unregister(var_params: VarDataBaseVO[]) {
        VarsClientController.getInstance().unRegisterParams(var_params);
    }


    @Watch('var_params')
    private onChangeVarParam(new_var_params: VarDataBaseVO[], old_var_params: VarDataBaseVO[]) {

        if ((!new_var_params) && (!old_var_params)) {
            return;
        }

        // On doit vérifier qu'ils sont bien différents
        if (VarsController.getInstance().isSameParamArray(new_var_params, old_var_params)) {
            return;
        }

        if (old_var_params && old_var_params.length) {
            this.unregister(old_var_params);
        }

        if (new_var_params) {
            this.register(new_var_params);
        }
    }
}