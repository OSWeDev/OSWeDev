import { Component, Prop, Watch } from 'vue-property-decorator';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarGetter } from '../../store/VarStore';
import VarsClientController from '../../VarsClientController';
import VarDatasRefsParamSelectComponent from './paramselect/VarDatasRefsParamSelectComponent';
import './VarDatasRefsComponent.scss';

@Component({
    template: require('./VarDatasRefsComponent.pug')
})
export default class VarDatasRefsComponent extends VueComponentBase {

    private static UID: number = 0;

    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: VarDataValueResVO };
    @ModuleVarGetter
    public isDescMode: boolean;

    @Prop()
    public var_params: VarDataBaseVO[];

    @Prop({ default: null })
    public var_value_callback: (var_values: VarDataValueResVO[], component: VarDatasRefsComponent) => any;

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

    private this_uid: number = VarDatasRefsComponent.UID++;

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

        if (!this.var_value_callback) {
            return null;
        }

        if ((!this.var_datas) || (!this.var_params) || (this.var_datas.length != this.var_params.length)) {
            return null;
        }

        return this.var_value_callback(this.var_datas, this);
    }

    get is_selected_var(): boolean {
        return false;
    }

    // get is_selected_var_dependency(): boolean {
    //     if (!this.isDescMode) {
    //         return false;
    //     }

    //     for (let i in this.var_params) {
    //         let var_param = this.var_params[i];

    //         if (this.getDescSelectedvarparam == VarsController.getInstance().getIndex(var_param)) {
    //             return true;
    //         }
    //     }

    //     let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedvarparam];

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

    //     let selectedNode: VarDAGNode = VarsController.getInstance().varDAG.nodes[this.getDescSelectedvarparam];

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

        if (!this.entered_once) {
            return null;
        }

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

        return (res.length == this.var_params.length) ? res : null;
    }

    public destroyed() {
        this.unregister(this.var_params);
    }

    private intersect_in() {
        this.entered_once = true;

        this.register(this.var_params);
    }

    private intersect_out() {
        this.unregister(this.var_params);
    }

    private register(var_params: VarDataBaseVO[]) {
        if (!this.entered_once) {
            return;
        }

        if (var_params && var_params.length) {
            VarsClientController.getInstance().registerParams(var_params);
        }
    }

    private unregister(var_params: VarDataBaseVO[]) {
        if (!this.entered_once) {
            return;
        }

        if (var_params && var_params.length) {
            VarsClientController.getInstance().unRegisterParams(var_params);
        }
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

    private selectVar() {
        if (!this.isDescMode) {
            return;
        }

        /**
         * On ouvre la modal qui propose de choisir la var à sélectionner
         */
        this.$modal.show(
            VarDatasRefsParamSelectComponent,
            { var_params: this.var_params },
            {
                width: 465,
                height: 'auto',
                scrollable: true
            }
        );
    }
}