import 'jquery-contextmenu';
import 'jquery-contextmenu/dist/jquery.contextMenu.min.css';
import { cloneDeep, debounce } from 'lodash';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldVO from '../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import SimpleDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarConfVO from '../../../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../../../shared/modules/Var/vos/VarUpdateCallback';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import FilterObj from '../../../../../../shared/tools/Filters';
import { field_names } from '../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../../../shared/tools/RangeHandler';
import SemaphoreHandler from '../../../../../../shared/tools/SemaphoreHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import PushDataVueModule from '../../../../modules/PushData/PushDataVueModule';
import VueComponentBase from '../../../VueComponentBase';
import VarsClientController from '../../VarsClientController';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import './VarDataRefComponent.scss';

@Component({
    template: require('./VarDataRefComponent.pug')
})
export default class VarDataRefComponent extends VueComponentBase {
    @ModuleVarGetter
    public getDescSelectedVarParam: VarDataBaseVO;

    @ModuleVarAction
    public setDescSelectedVarParam: (desc_selected_var_param: VarDataBaseVO) => void;

    @ModuleVarGetter
    public isDescMode: boolean;

    @ModuleVarGetter
    public is_show_public_tooltip: boolean;

    @Prop()
    public var_param: VarDataBaseVO;

    @Prop({ default: null })
    public var_value_callback: (var_value: VarDataValueResVO, component: VarDataRefComponent) => any; // Should return the parent (caller) component value

    @Prop({ default: null })
    public filter: () => any;

    @Prop({ default: null })
    public filter_obj: FilterObj<any, any, any>;

    @Prop({ default: null })
    public filter_additional_params: any[];

    @Prop({ default: null })
    public prefix: string;

    @Prop({ default: null })
    public suffix: string;

    @Prop({ default: false })
    public can_inline_edit: boolean;

    @Prop({ default: null })
    public null_value_replacement: string;

    @Prop({ default: null })
    public zero_value_replacement: string;

    @Prop({ default: false })
    public consider_zero_value_as_null: boolean;

    // @Prop({ default: true })
    // public use_intersector: boolean;

    @Prop({ default: false })
    public add_infos: string[]; // tableau de champs que l'on veut afficher

    @Prop({ default: false })
    public add_infos_additional_params: any[];  // tableau des params pour chacun des champs présents dans add_infos

    @Prop({ default: false })
    public show_import: boolean;

    @Prop({ default: false })
    public show_import_aggregated: boolean;

    @Prop({ default: true })
    public show_tooltip_import: boolean;

    @Prop({ default: true })
    public show_tooltip_maj: boolean;

    @Prop({ default: false })
    public show_tooltip: boolean;

    @Prop({ default: true })
    public show_tooltip_prefix: boolean;

    private entered_once: boolean = false;
    private can_explain_var: boolean = false;

    private var_data: VarDataValueResVO = null;
    private throttled_var_data_updater = ThrottleHelper.declare_throttle_without_args(this.var_data_updater.bind(this), 200);

    // Pour éviter de rentrer en conflit avec le clic
    private debounced_on_cancel_input = debounce(this.on_cancel_input, 100);

    private is_inline_editing: boolean = false;
    private var_data_editing: VarDataValueResVO = null;

    private aggregated_var_param: VarDataBaseVO = null;

    private currently_registered_param: VarDataBaseVO = null;
    private semaphore_unregister: boolean = false;
    private semaphore_register: boolean = false;
    private throttled_unregister = ThrottleHelper.declare_throttle_without_args(this.unregister.bind(this), 200);
    private throttled_register = ThrottleHelper.declare_throttle_without_args(this.register.bind(this), 200);

    private var_data_value_is_imported: boolean = false;
    private var_data_value_is_denied: boolean = false;
    private is_being_updated: boolean = true;
    private var_data_value: any = null;
    private filtered_value: any = null;
    private var_conf: VarConfVO = null;
    private editable_field: SimpleDatatableFieldVO<any, any> = null;

    private been_destroyed: boolean = false;

    private varUpdateCallbacks: { [cb_uid: number]: VarUpdateCallback } = {
        [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackEvery(
            (async (varData: VarDataBaseVO | VarDataValueResVO) => {

                if (PushDataVueModule.getInstance().env_params && PushDataVueModule.getInstance().env_params.debug_vars_notifs) {
                    if (varData) {
                        ConsoleHandler.log('VarDataRefComponent:varUpdateCallbacks:' + varData.index + ':' + varData.value + ':' + varData.value_ts + ':' + varData.value_type + ':');
                    } else {
                        ConsoleHandler.log('VarDataRefComponent:varUpdateCallbacks:null');
                    }
                }

                await this.var_data_updater();
            }).bind(this),
            VarUpdateCallback.VALUE_TYPE_ALL
        )
    };

    // Si on est sur une var pixellisée, on peut avoir une valeur importée que sur un pixel
    get can_edit(): boolean {
        if (!this.can_inline_edit) {
            return false;
        }

        if (!this.var_param) {
            return false;
        }

        if (!this.var_conf) {
            this.set_var_conf();
        }

        // Si on a une var optimisée pour l'import, on ne peut pas éditer et créer des imports puisqu'ils ne seront pas pris en compte
        if (this.var_conf.optimization__has_no_imports) {
            return false;
        }

        // Si on est sur une var pixellisée, on peut avoir une valeur importée que sur un pixel
        if (!this.var_param.is_pixel) {
            return !this.var_conf.pixel_activated;
        }

        return true;
    }

    get is_show_import_aggregated(): boolean {
        return (this.show_import_aggregated && this.aggregated_var_param) ? true : false;
    }

    get var_data_value_tooltip() {
        let toshow: boolean = false;

        let res = null;

        if (this.is_show_public_tooltip && this.has_public_tooltip) {
            res = this.public_tooltip;
        }

        if (!this.show_tooltip) {
            return res;
        }

        if ((this.var_data == null) || (this.var_data_value == null)) {
            return res;
        }

        if (this.show_tooltip_prefix) {
            res = (res ? res + '<hr>' : '') + this.label('VarDataRefComponent.var_data_value_tooltip_prefix');
        } else {
            res = (res ? res : '') + '<ul>';
        }


        const formatted_date: string = Dates.format(this.var_data.value_ts, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);

        let value: any = this.var_data_value;

        if (this.filter) {
            let params = [value];

            if (this.filter_additional_params) {
                params = params.concat(this.filter_additional_params);
            }

            value = this.filter.apply(null, params);
        }

        if (this.show_tooltip_maj) {
            res += this.label('VarDataRefComponent.var_data_value_tooltip', {
                value: value,
                formatted_date: formatted_date,
            });

            toshow = true;
        }

        if (!!this.var_data_value_import_tooltip && this.show_tooltip_import) {
            res += this.var_data_value_import_tooltip;

            toshow = true;
        }

        res += this.label('VarDataRefComponent.var_data_value_tooltip_suffix');

        return toshow ? res : null;
    }

    get var_data_value_import_tooltip() {

        if (!this.var_data_value_is_imported && !this.is_show_import_aggregated) {
            return null;
        }

        let formatted_date: string = null;

        if (this.is_show_import_aggregated) {
            if ((this.aggregated_var_param as any).ts_ranges) {
                formatted_date = Dates.format(RangeHandler.getSegmentedMax_from_ranges((this.aggregated_var_param as any).ts_ranges),
                    ModuleFormatDatesNombres.FORMAT_YYYYMMDD
                );
            } else {
                formatted_date = Dates.format(this.aggregated_var_param.value_ts, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);
            }
        } else {
            formatted_date = Dates.format(this.var_data.value_ts, ModuleFormatDatesNombres.FORMAT_YYYYMMDD_HHmmss);
        }

        let value: any = (this.is_show_import_aggregated) ? this.aggregated_var_param.value : this.var_data_value;

        if (this.filter) {
            let params = [value];

            if (this.filter_additional_params) {
                params = params.concat(this.filter_additional_params);
            }

            value = this.filter.apply(null, params);
        }

        return this.label('VarDataRefComponent.var_data_value_import_tooltip', {
            value: value,
            formatted_date: formatted_date,
        });
    }

    get public_tooltip() {
        if ((!this.var_conf) || (!this.var_conf.show_help_tooltip)) {
            return null;
        }

        return this.t(this.public_explaination_code_text);
    }

    get has_public_tooltip(): boolean {
        if ((!this.var_param) || (!this.public_tooltip)) {
            return null;
        }

        return VarsController.get_translatable_public_explaination_by_var_id(this.var_param.var_id) != this.public_tooltip;
    }

    /**
     * cf VarDescExplainComponent
     */
    get public_explaination_code_text(): string {
        if (!this.var_param) {
            return null;
        }

        return VarsController.get_translatable_public_explaination_by_var_id(this.var_param.var_id);
    }

    get is_selected_var(): boolean {
        if ((!this.isDescMode) || (!this.getDescSelectedVarParam)) {
            return false;
        }
        return this.getDescSelectedVarParam.index == this.var_param.index;
    }

    get contextmenu_items(): any {
        const contextmenu_items: any = {};

        if (this.can_explain_var) {
            // contextmenu_items['explain_var'] = {
            //     name: this.label('VarDataRefComponent.contextmenu.explain_var'),
            //     disabled: function (key, opt) {
            //         let elt = opt.$trigger[0];

            //         if (!elt) {
            //             return true;
            //         }

            //         return elt.getAttribute('var_param_index') == null;
            //     },
            //     callback: async (key, opt) => {
            //         let elt = opt.$trigger[0];

            //         if (!elt) {
            //             return;
            //         }

            //         // let raw_value = elt.getAttribute('var_data_raw_copyable_value');
            //         // if (!raw_value) {
            //         //     return;
            //         // }

            //         let var_param_index = elt.getAttribute('var_param_index');
            //         if (!var_param_index) {
            //             return;
            //         }

            //         ConsoleHandler.log(await ModuleVar.getInstance().explain_var(var_param_index));
            //     }
            // };
        }

        contextmenu_items['copy_raw_value'] = {
            name: this.label('VarDataRefComponent.contextmenu.copy_raw_value'),
            disabled: function (key, opt) {
                const elt = opt.$trigger[0];

                if (!elt) {
                    return true;
                }

                return elt.getAttribute('var_data_raw_copyable_value') == null;
            },
            callback: async (key, opt) => {
                const elt = opt.$trigger[0];

                if (!elt) {
                    return;
                }

                const raw_value = elt.getAttribute('var_data_raw_copyable_value');
                if (!raw_value) {
                    return;
                }

                await navigator.clipboard.writeText(raw_value.toString());
                await this.$snotify.success(this.label('copied_to_clipboard'));
            }
        };

        contextmenu_items['copy_formatted_value'] = {
            name: this.label('VarDataRefComponent.contextmenu.copy_formatted_value'),
            disabled: function (key, opt) {
                const elt = opt.$trigger[0];

                if (!elt) {
                    return true;
                }

                return elt.getAttribute('var_data_formatted_copyable_value') == null;
            },
            callback: async (key, opt) => {
                const elt = opt.$trigger[0];

                if (!elt) {
                    return;
                }

                const formatted_value = elt.getAttribute('var_data_formatted_copyable_value');
                if (!formatted_value) {
                    return;
                }

                await navigator.clipboard.writeText(formatted_value.toString());
                await this.$snotify.success(this.label('copied_to_clipboard'));
            }
        };

        contextmenu_items['copy_var_param_index'] = {
            name: this.label('VarDataRefComponent.contextmenu.copy_var_param_index'),
            disabled: function (key, opt) {
                const elt = opt.$trigger[0];

                if (!elt) {
                    return true;
                }

                return elt.getAttribute('var_param_index') == null;
            },
            callback: async (key, opt) => {
                const elt = opt.$trigger[0];

                if (!elt) {
                    return;
                }

                const var_param_index = elt.getAttribute('var_param_index');
                if (!var_param_index) {
                    return;
                }

                await navigator.clipboard.writeText(var_param_index.toString());
                await this.$snotify.success(this.label('copied_to_clipboard'));
            }
        };

        contextmenu_items['sep1'] = "---------";

        contextmenu_items['clearimport'] = {
            name: this.label('VarDataRefComponent.contextmenu.clearimport'),
            disabled: function (key, opt) {
                const elt = opt.$trigger[0];

                if (!elt) {
                    return true;
                }

                return (elt.getAttribute('can_edit') != 'true') || (elt.getAttribute('var_data_value_is_imported') != 'true');
            },
            callback: async (key, opt) => {
                const elt = opt.$trigger[0];

                if (!elt) {
                    return;
                }

                if ((elt.getAttribute('can_edit') != 'true') || (elt.getAttribute('var_data_value_is_imported') != 'true')) {
                    return;
                }

                const var_param_index = elt.getAttribute('var_param_index');

                if (!var_param_index) {
                    return;
                }

                const param = VarDataBaseVO.from_index(var_param_index);

                await query(param._type).filter_by_text_eq(field_names<VarDataBaseVO>()._bdd_only_index, var_param_index).delete_vos();
                await this.$snotify.success(this.label('VarDataRefComponent.contextmenu.importcleared'));
            }
        };


        return contextmenu_items;
    }

    get var_data_formatted_copyable_value() {
        let res = '';

        if ((!!this.var_data) && ((this.var_data_value != 0) || (!this.consider_zero_value_as_null)) && ((this.var_data_value != null) || this.null_value_replacement)) {
            if (this.prefix) {
                res += this.prefix;
            }

            if ((this.var_data_value === 0) && this.zero_value_replacement) {
                res += this.zero_value_replacement;
            } else if ((this.var_data_value === null) && this.null_value_replacement) {
                res += this.null_value_replacement;
            }

            if ((this.var_data_value !== 0) || ((this.var_data_value === 0) && (!this.zero_value_replacement))) {
                if (this.filter) {
                    res += this.filtered_value;
                } else {
                    res += this.var_data_value;
                }
            }

            if (this.suffix) {
                res += this.suffix;
            }
        } else {
            if (!this.is_being_updated) {
                res += this.null_value_replacement;
            }
        }
        return res;
    }

    get var_data_raw_copyable_value() {
        return this.var_data_value;
    }

    @Watch('var_data', { deep: true })
    private onchange_var_data() {
        this.debounce_onchange_var_data();
    }

    @Watch('filter_additional_params')
    private onchange_filter_additional_params() {
        this.set_filtered_value();
    }

    @Watch('var_param')
    private async onChangeVarParam(new_var_param: VarDataBaseVO, old_var_param: VarDataBaseVO) {

        this.set_var_conf();
        this.set_editable_field();

        // On doit vérifier qu'ils sont bien différents
        if (VarDataBaseVO.are_same(new_var_param, old_var_param)) {
            return;
        }

        await this.throttled_register();
    }

    @Watch('can_edit')
    private onchange_can_edit() {
        if (!this.can_edit) {
            this.is_inline_editing = false;
        }
    }

    private debounce_onchange_var_data() {
        this.set_var_data_value_is_imported();
        this.set_var_data_value_is_denied();
        this.set_is_being_updated();
        this.set_var_data_value();
        this.set_filtered_value();
    }

    private async onchangevo(data: VarDataBaseVO, field, value) {

        if (!data) {
            return;
        }

        if (data.index != this.var_param.index) {
            return;
        }

        const clone = VarDataBaseVO.cloneFromVarId(this.var_param);

        if ((value == null) || isNaN(value) || (value === '')) {

            // Si on envoie une value null || '', on veut en fait supprimer l'import de la base et refresh l'arbre depuis cette var
            clone.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;
            clone.value_ts = null;
            clone.value = null;
            clone.id = data.id;

            this.var_data.value = null;
            this.var_data.value_ts = null;
            this.var_data.is_computing = true;
            this.var_data.id = data.id;
            this.var_data.value_type = VarDataBaseVO.VALUE_TYPE_COMPUTED;
        } else {

            // Sinon on set le type import, et on met à jour la var puis on invalide l'arbre
            clone.value_type = VarDataBaseVO.VALUE_TYPE_IMPORT;
            clone.value = value;
            clone.value_ts = Dates.now();
            clone.id = data.id;

            this.var_data.value = value;
            this.var_data.value_ts = clone.value_ts;
            this.var_data.id = data.id;
            this.var_data.is_computing = false;
            this.var_data.value_type = VarDataBaseVO.VALUE_TYPE_IMPORT;
        }

        // On va enregistrer un cb qui attend le retour de validation de prise en compte de la nouvelle valeur importée
        const cb = () => {
            // ça devrait fermer l'inline edit de cette var et retirer le cb du sémaphore
            if (VarsClientController.getInstance().inline_editing_cb) {
                VarsClientController.getInstance().inline_editing_cb();
            }
        };

        VarsClientController.getInstance().registerParams([clone], {
            [VarsClientController.get_CB_UID()]: VarUpdateCallback.newCallbackOnce(cb.bind(this), VarUpdateCallback.VALUE_TYPE_VALID)
        });

        let res = await ModuleDAO.instance.insertOrUpdateVO(clone);
        if ((!res) || (!res.id)) {
            ConsoleHandler.warn('Echec onchangevo insertOrUpdateVO : On tente de récupérer la data en base, si elle existe on met à jour...');
            const bdddata: VarDataBaseVO = await query(clone._type).filter_by_text_eq(field_names<VarDataBaseVO>()._bdd_only_index, clone.index).select_vo<VarDataBaseVO>();
            if (bdddata) {
                ConsoleHandler.log('...trouvé on met à jour');
                if ((bdddata.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) && (bdddata.value_ts && clone.value_ts && (bdddata.value_ts > clone.value_ts))) {
                    ConsoleHandler.error('...valeur en BDD plus récente que celle saisie, on refuse la maj');
                    return;
                }
                bdddata.value_type = clone.value_type;
                bdddata.value = clone.value;
                bdddata.value_ts = clone.value_ts;
                res = await ModuleDAO.instance.insertOrUpdateVO(bdddata);
                if ((!res) || (!res.id)) {
                    ConsoleHandler.error('...la mise à jour a échouée');
                    return;
                }
            } else {
                ConsoleHandler.error('...pas trouvé, il y a eu une erreur et la valeur est perdue');
                return;
            }
        }
    }

    private on_cancel_input() {
        // ça devrait fermer l'inline edit de cette var et retirer le cb du sémaphore
        if (VarsClientController.getInstance().inline_editing_cb) {
            VarsClientController.getInstance().inline_editing_cb();
        }
    }

    private var_data_updater() {
        if (!this.var_param) {
            if (PushDataVueModule.getInstance().env_params && PushDataVueModule.getInstance().env_params.debug_vars_notifs) {
                ConsoleHandler.log('var_data_updater:null');
            }
            this.var_data = null;
            return;
        }


        this.var_data = VarsClientController.cached_var_datas[this.var_param.index];

        if (PushDataVueModule.getInstance().env_params && PushDataVueModule.getInstance().env_params.debug_vars_notifs) {
            if (this.var_data) {
                ConsoleHandler.log('var_data_updater:' + this.var_param.index + ':' + this.var_data.value + ':' + this.var_data.value_ts + ':' + this.var_data.value_type + ':' + this.var_data.is_computing);
            } else {
                ConsoleHandler.log('var_data_updater:' + this.var_param.index + ':null');
            }
        }
    }

    private async mounted() {

        this.set_var_conf();
        this.set_editable_field();

        const self = this;
        await all_promises([
            this.intersect_in(),
            (async () => {
                self.can_explain_var = await ModuleAccessPolicy.getInstance().checkAccess(ModuleVar.POLICY_FO_VAR_EXPLAIN_ACCESS);
            })()
        ]);

        /**
         * On ajoute le contextmenu
         */
        SemaphoreHandler.do_only_once("VarDataRefComponent.contextmenu", () => {
            $['contextMenu']({
                selector: ".var-data-wrapper .var_data_ref",
                items: this.contextmenu_items
            });
        });
    }

    private async destroyed() {
        this.been_destroyed = true;
        this.unregister();
    }

    private async intersect_in() {
        this.entered_once = true;
        this.throttled_register();
    }

    // private async intersect_out() {
    //     await this.unregister();
    // }

    private async register() {
        // if (!this.entered_once) {
        //     return;
        // }

        if (this.semaphore_register) {
            return;
        }
        this.semaphore_register = true;

        const var_param = this.var_param;

        // Si on a les mêmes params déjà enregistrés, on ne fait rien
        if (VarsController.isSameParam(this.currently_registered_param, var_param)) {
            this.semaphore_register = false;
            return;
        }

        // Changement de méthode : on a une seule liste registered à la fois.
        //  Donc si des params sont déjà enregistrés, on les désenregistre avant d'enregistrer les nouveaux
        if (this.currently_registered_param) {
            this.unregister();
        }
        this.currently_registered_param = var_param;

        if (!var_param) {
            this.semaphore_register = false;
            return;
        }

        // De manière générale, si on est destroyed, on ne fait rien
        if (this.been_destroyed) {
            this.semaphore_register = false;
            return;
        }

        VarsClientController.getInstance().registerParams(
            [var_param],
            this.varUpdateCallbacks
        );

        if (this.show_import_aggregated) {
            await ModuleVar.getInstance().getAggregatedVarDatas(var_param).then((datas: { [var_data_index: string]: VarDataBaseVO }) => {
                let aggregated_var_param = null;

                for (const var_data_index in datas) {
                    if (datas[var_data_index].value_type == VarDataBaseVO.VALUE_TYPE_IMPORT) {
                        aggregated_var_param = cloneDeep(datas[var_data_index]);
                        break;
                    }
                }

                this.aggregated_var_param = aggregated_var_param;
            });
        }
        this.semaphore_register = false;
    }

    private unregister() {
        // if (!this.entered_once) {
        //     return;
        // }

        if (this.semaphore_unregister) {
            return;
        }
        this.semaphore_unregister = true;

        if (!this.currently_registered_param) {
            this.semaphore_unregister = false;
            return;
        }

        const currently_registered_param = this.currently_registered_param;
        this.currently_registered_param = null;

        VarsClientController.getInstance().unRegisterParams(
            [currently_registered_param],
            this.varUpdateCallbacks
        );
        this.var_data = null;
        this.semaphore_unregister = false;
    }

    private close_inline_editing() {
        this.is_inline_editing = false;
        VarsClientController.getInstance().inline_editing_cb = null;
    }

    private on_blur() {
        this.close_inline_editing();
    }

    private selectVar() {

        if (this.can_edit && !this.is_inline_editing) {
            if (VarsClientController.getInstance().inline_editing_cb) {
                VarsClientController.getInstance().inline_editing_cb();
            }
            VarsClientController.getInstance().inline_editing_cb = this.close_inline_editing.bind(this);

            this.var_data_editing = cloneDeep(this.var_data);
            this.is_inline_editing = true;
        }

        if (!this.isDescMode) {
            return;
        }

        this.setDescSelectedVarParam(this.var_param);
    }

    private set_var_data_value_is_imported() {
        this.var_data_value_is_imported = this.var_data && (this.var_data.value_type == VarDataBaseVO.VALUE_TYPE_IMPORT);
    }

    private set_var_data_value_is_denied() {
        this.var_data_value_is_denied = this.var_data && (this.var_data.value_type == VarDataBaseVO.VALUE_TYPE_DENIED);
    }

    private set_is_being_updated() {

        const new_is_being_updated = (!this.var_data) || (typeof this.var_data.value === 'undefined') || (this.var_data.is_computing);
        if (this.is_being_updated != new_is_being_updated) {
            this.is_being_updated = new_is_being_updated;
        }
    }

    private set_var_data_value() {
        if (!this.var_data) {
            this.var_data_value = null;
            this.$emit('set_var_data_value', null);
            return;
        }

        if (!this.var_value_callback) {
            this.var_data_value = this.var_data.value;
            this.$emit('set_var_data_value', this.var_data_value);
            return;
        }

        this.var_data_value = this.var_value_callback(this.var_data, this);
        this.$emit('set_var_data_value', this.var_data_value);
    }

    private set_filtered_value() {

        if (!this.var_data) {
            this.filtered_value = null;
            this.$emit('set_filtered_value', null);
            return;
        }

        if (!this.filter) {
            this.filtered_value = this.var_data_value;
            this.$emit('set_filtered_value', this.filtered_value);
            return;
        }

        let params = [this.var_data_value];

        if (this.filter_additional_params) {
            params = params.concat(this.filter_additional_params);
        }

        this.filtered_value = this.filter.apply(null, params);
        this.$emit('set_filtered_value', this.filtered_value);
    }

    private set_var_conf() {
        if ((!this.var_param) || (!this.var_param.var_id) ||
            (!VarsController.var_conf_by_id) || (!VarsController.var_conf_by_id[this.var_param.var_id])) {
            this.var_conf = null;
            return;
        }

        this.var_conf = VarsController.var_conf_by_id[this.var_param.var_id];
    }

    private set_editable_field() {
        if (!this.var_param) {
            this.editable_field = null;
            return;
        }

        const res = SimpleDatatableFieldVO.createNew("value").setModuleTable(ModuleTableController.module_tables_by_vo_type[this.var_param._type]);
        if (this.filter_obj) {
            const filter_type: string = this.filter_obj.type;

            switch (filter_type) {
                case FilterObj.FILTER_TYPE_tstz:
                    throw new Error('Not implemented');

                case FilterObj.FILTER_TYPE_hour:
                    res.field_type = ModuleTableFieldVO.FIELD_TYPE_hour;
                    break;
                case FilterObj.FILTER_TYPE_amount:
                    res.field_type = ModuleTableFieldVO.FIELD_TYPE_amount;
                    break;
                case FilterObj.FILTER_TYPE_percent:
                    res.field_type = ModuleTableFieldVO.FIELD_TYPE_prct;
                    break;
                case FilterObj.FILTER_TYPE_toFixedCeil:
                case FilterObj.FILTER_TYPE_toFixedFloor:
                case FilterObj.FILTER_TYPE_toFixed:
                case FilterObj.FILTER_TYPE_padHour:
                case FilterObj.FILTER_TYPE_positiveNumber:
                case FilterObj.FILTER_TYPE_hideZero:
                    res.field_type = ModuleTableFieldVO.FIELD_TYPE_float;
                    break;
                case FilterObj.FILTER_TYPE_bignum:
                    res.field_type = ModuleTableFieldVO.FIELD_TYPE_int;
                    break;
                case FilterObj.FILTER_TYPE_boolean:
                    res.field_type = ModuleTableFieldVO.FIELD_TYPE_boolean;
                    break;
                case FilterObj.FILTER_TYPE_truncate:
                    res.field_type = ModuleTableFieldVO.FIELD_TYPE_string;
                    break;
            }
        }

        this.editable_field = res;
    }
}