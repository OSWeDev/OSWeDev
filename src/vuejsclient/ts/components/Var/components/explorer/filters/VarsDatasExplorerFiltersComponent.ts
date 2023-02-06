import { Component, Watch } from 'vue-property-decorator';
import IRange from '../../../../../../../shared/modules/DataRender/interfaces/IRange';
import HourSegment from '../../../../../../../shared/modules/DataRender/vos/HourSegment';
import NumSegment from '../../../../../../../shared/modules/DataRender/vos/NumSegment';
import TimeSegment from '../../../../../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../../../../../shared/modules/IDistantVOBase';
import MatroidController from '../../../../../../../shared/modules/Matroid/MatroidController';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VarConfVO from '../../../../../../../shared/modules/Var/vos/VarConfVO';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import NumRangeComponentController from '../../../../ranges/numrange/NumRangeComponentController';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleVarsDatasExplorerVuexAction } from '../VarsDatasExplorerVuexStore';
import './VarsDatasExplorerFiltersComponent.scss';

@Component({
    template: require('./VarsDatasExplorerFiltersComponent.pug'),
    components: {
        Tsrangeinputcomponent: () => import(/* webpackChunkName: "TSRangeInputComponent" */ '../../../../tsrangeinput/TSRangeInputComponent'),
        Hourrangeinputcomponent: () => import(/* webpackChunkName: "HourrangeInputComponent" */ '../../../../hourrangeinput/HourrangeInputComponent'),
        Numrangeinputcomponent: () => import(/* webpackChunkName: "TSRangeInputComponent" */ '../../../../numrangeinput/NumRangeInputComponent'),
    }
})
export default class VarsDatasExplorerFiltersComponent extends VueComponentBase {

    public static instance: VarsDatasExplorerFiltersComponent = null;

    public fitered_vars_confs: VarConfVO[] = [];
    public fields_filters_range: { [field_id: string]: IRange } = {};
    public fields_filters_list: { [field_id: string]: IDistantVOBase[] } = {};

    public fields_filters_is_enum: { [field_id: string]: boolean } = {};
    public enum_initial_options: { [field_id: string]: IDistantVOBase[] } = {};

    @ModuleVarsDatasExplorerVuexAction
    private set_filter_params: (filter_params: VarDataBaseVO[]) => void;

    private fields_filters_is_valid_by_vo_type: { [vo_type: string]: { [field_id: string]: boolean } } = {};
    private valid_vars_ids_by_field_id: { [field_id: string]: { [var_id: number]: boolean } } = {};

    /**
     * Utilisé pour trouver la trad du champ. on prend le premier vo_type qui contient ce champ
     */
    private fields: { [field_id: string]: ModuleTableField<IRange> } = {};

    private fields_filters_is_valid: { [field_id: string]: boolean } = {};
    private filtered_vo_types: { [vo_type: string]: boolean } = {};

    private has_enum_search: { [field_id: string]: boolean } = {};

    private vars_confs: VarConfVO[] = [];

    private params: VarDataBaseVO[] = [];

    private async mounted() {

        VarsDatasExplorerFiltersComponent.instance = this;
        let vars_confs = Object.values(VarsController.getInstance().var_conf_by_id);

        // On en profite pour mettre à jour le fields_filters_is_valid
        // si on a 1 label_handler sur une var on considère que c'est un enum partout
        let fields_filters_is_enum: { [field_id: string]: boolean } = {};
        let fields_filters_is_valid_by_vo_type: { [vo_type: string]: { [field_id: string]: boolean } } = {};
        let filtered_vo_types: { [vo_type: string]: boolean } = {};
        let fields_filters_is_valid: { [field_id: string]: boolean } = {};
        let valid_vars_ids_by_field_id: { [field_id: string]: { [var_id: number]: boolean } } = {};
        let fields: { [field_id: string]: ModuleTableField<IRange> } = {};
        let empty_fields_filters_list: { [field_id: string]: IDistantVOBase[] } = {};

        for (let i in vars_confs) {
            let var_conf = vars_confs[i];

            if (!fields_filters_is_valid_by_vo_type[var_conf.var_data_vo_type]) {
                fields_filters_is_valid_by_vo_type[var_conf.var_data_vo_type] = {};
            }
            filtered_vo_types[var_conf.var_data_vo_type] = true;

            let matroid_fields = MatroidController.getInstance().getMatroidFields(var_conf.var_data_vo_type);

            for (let j in matroid_fields) {
                let matroid_field = matroid_fields[j];

                if (!valid_vars_ids_by_field_id[matroid_field.field_id]) {
                    valid_vars_ids_by_field_id[matroid_field.field_id] = {};
                }
                valid_vars_ids_by_field_id[matroid_field.field_id][var_conf.id] = true;

                fields[matroid_field.field_id] = matroid_field;
                empty_fields_filters_list[matroid_field.field_id] = [];

                let enum_handler = NumRangeComponentController.getInstance().get_enum_handler(var_conf.var_data_vo_type, matroid_field.field_id);
                if (enum_handler) {

                    if (enum_handler.enum_initial_options_handler) {
                        this.enum_initial_options[matroid_field.field_id] = await enum_handler.enum_initial_options_handler();
                    }
                    this.has_enum_search[matroid_field.field_id] = !!enum_handler.enum_query_options_handler;
                }

                fields_filters_is_valid[matroid_field.field_id] = true;
                fields_filters_is_valid_by_vo_type[var_conf.var_data_vo_type][matroid_field.field_id] = true;
                fields_filters_is_enum[matroid_field.field_id] = fields_filters_is_enum[matroid_field.field_id] || !!enum_handler;
            }
        }

        this.fields_filters_list = empty_fields_filters_list;
        this.fields = fields;
        this.fields_filters_is_enum = fields_filters_is_enum;
        this.fields_filters_is_valid_by_vo_type = fields_filters_is_valid_by_vo_type;
        this.filtered_vo_types = filtered_vo_types;
        this.fields_filters_is_valid = fields_filters_is_valid;
        this.valid_vars_ids_by_field_id = valid_vars_ids_by_field_id;

        this.vars_confs = vars_confs;
    }

    get has_no_filter(): boolean {
        if (this.fitered_vars_confs && this.fitered_vars_confs.length && (this.fitered_vars_confs.length != this.vars_confs.length)) {
            return false;
        }

        for (let i in this.fields_filters_range) {
            let field_filter_range = this.fields_filters_range[i];

            if (RangeHandler.getCardinal(field_filter_range)) {
                return false;
            }
        }

        for (let i in this.fields_filters_list) {
            let field_filter_list = this.fields_filters_list[i];

            if (field_filter_list && field_filter_list.length && (field_filter_list.length != this.enum_initial_options[i].length)) {
                return false;
            }
        }

        return true;
    }

    private var_conf_label(var_conf: VarConfVO): string {
        if ((var_conf == null) || (typeof var_conf == 'undefined')) {
            return '';
        }

        return var_conf.id + ' | ' + this.t(VarsController.getInstance().get_translatable_name_code_by_var_id(var_conf.id));
    }

    get filterable_vars_confs() {

        if (!this.vars_confs) {
            return [];
        }

        /**
         * Si on a fait aucun filtrage, on peut tout choisir
         */
        if (this.has_no_filter) {
            return this.vars_confs;
        }

        let filterable_vars_confs = this.vars_confs;

        /**
         * On passe en revue les champs pour lesquels on a un filtrage et si il y a un filtrage on doit filtrer les vo_types compatibles
         */
        let self = this;
        filterable_vars_confs = filterable_vars_confs.filter((var_conf: VarConfVO) => {
            for (let field_id in self.fields_filters_range) {

                let range = self.fields_filters_range[field_id];
                let is_filtering = range && RangeHandler.getCardinal(range);

                if (is_filtering && ((!self.valid_vars_ids_by_field_id[field_id]) || (!self.valid_vars_ids_by_field_id[field_id][var_conf.id]))) {
                    return false;
                }
            }

            for (let field_id in self.fields_filters_list) {

                let filter = self.fields_filters_list[field_id];
                let is_filtering = filter && filter.length && (self.enum_initial_options[field_id].length != filter.length);

                if (is_filtering && ((!self.valid_vars_ids_by_field_id[field_id]) || (!self.valid_vars_ids_by_field_id[field_id][var_conf.id]))) {
                    return false;
                }
            }

            return true;
        });

        return filterable_vars_confs;
    }

    get real_filtered_vars_confs() {

        if (!this.vars_confs) {
            return [];
        }

        let filtered_vars_confs = this.fitered_vars_confs;
        if ((!filtered_vars_confs) || (!filtered_vars_confs.length)) {
            filtered_vars_confs = this.vars_confs;
        }

        /**
         * On passe en revue les champs pour lesquels on a un filtrage et si il y a un filtrage on doit filtrer les vo_types compatibles
         */
        let self = this;
        filtered_vars_confs = filtered_vars_confs.filter((var_conf: VarConfVO) => {
            for (let field_id in self.fields_filters_range) {

                let range = self.fields_filters_range[field_id];
                let is_filtering = range && RangeHandler.getCardinal(range);

                if (is_filtering && ((!self.valid_vars_ids_by_field_id[field_id]) || (!self.valid_vars_ids_by_field_id[field_id][var_conf.id]))) {
                    return false;
                }
            }

            for (let field_id in self.fields_filters_list) {

                let filter = self.fields_filters_list[field_id];
                let is_filtering = filter && filter.length && (self.enum_initial_options[field_id].length != filter.length);

                if (is_filtering && ((!self.valid_vars_ids_by_field_id[field_id]) || (!self.valid_vars_ids_by_field_id[field_id][var_conf.id]))) {
                    return false;
                }
            }

            return true;
        });

        return filtered_vars_confs;
    }


    @Watch('real_filtered_vars_confs', { deep: true })
    @Watch('fields_filters_range', { deep: true })
    @Watch('fields_filters_list', { deep: true })
    private on_change_filters() {
        // On met à jours les champs valides
        // on doit déduire les vo_types valides et on en déduit ensuite les fields valides
        let fields_filters_is_valid: { [field_id: string]: boolean } = {};
        let filtered_vo_types: { [vo_type: string]: boolean } = {};

        for (let i in this.real_filtered_vars_confs) {
            let fitered_var_conf = this.real_filtered_vars_confs[i];
            filtered_vo_types[fitered_var_conf.var_data_vo_type] = true;
        }

        /**
         * On remplit les champs avec le premier type, on supprime les champs absents des suivants
         */
        let first: boolean = true;
        for (let vo_type in filtered_vo_types) {
            let matroid_fields = MatroidController.getInstance().getMatroidFields(vo_type);

            if (first) {
                for (let j in matroid_fields) {
                    let matroid_field = matroid_fields[j];

                    fields_filters_is_valid[matroid_field.field_id] = true;
                }
            } else {
                for (let field_id in fields_filters_is_valid) {
                    if (!matroid_fields || !matroid_fields.length || matroid_fields.find((matroid_field) => matroid_field.field_id == field_id)) {
                        fields_filters_is_valid[field_id] = false;
                    }
                }
            }

            first = false;
        }

        this.fields_filters_is_valid = fields_filters_is_valid;
        this.filtered_vo_types = filtered_vo_types;
        this.set_params();
    }

    private is_ts_range_type(field: ModuleTableField<IRange>): boolean {
        return (field.field_type == ModuleTableField.FIELD_TYPE_tsrange) ||
            (field.field_type == ModuleTableField.FIELD_TYPE_tstzrange_array) ||
            (field.field_type == ModuleTableField.FIELD_TYPE_daterange);
    }

    private is_hour_range_type(field: ModuleTableField<IRange>): boolean {
        return (field.field_type == ModuleTableField.FIELD_TYPE_hourrange) ||
            (field.field_type == ModuleTableField.FIELD_TYPE_hourrange_array);
    }

    private is_num_range_type(field: ModuleTableField<IRange>): boolean {
        return (field.field_type == ModuleTableField.FIELD_TYPE_numrange) ||
            (field.field_type == ModuleTableField.FIELD_TYPE_numrange_array) ||
            (field.field_type == ModuleTableField.FIELD_TYPE_refrange_array);
    }

    /**
     * Outrageusement arbitraire....
     */
    get tsrange_segmentation_type() {
        return TimeSegment.TYPE_DAY;
    }

    /**
     * Outrageusement arbitraire....
     */
    get hourrange_segmentation_type() {
        return HourSegment.TYPE_MINUTE;
    }

    /**
     * Outrageusement arbitraire....
     */
    get numrange_segmentation_type() {
        return NumSegment.TYPE_INT;
    }

    private set_params() {
        let res: VarDataBaseVO[] = [];

        /**
         * On crée un param par var et on utilise les filtrages
         */
        for (let i in this.real_filtered_vars_confs) {
            let var_conf = this.real_filtered_vars_confs[i];

            let param = VarDataBaseVO.createNew(var_conf.name);
            let matroid_fields = MatroidController.getInstance().getMatroidFields(var_conf.var_data_vo_type);

            for (let j in matroid_fields) {
                let matroid_field = matroid_fields[j];

                if (this.fields_filters_is_enum[matroid_field.field_id]) {

                    if (this.fields_filters_list[matroid_field.field_id] && this.fields_filters_list[matroid_field.field_id].length) {
                        param[matroid_field.field_id] = RangeHandler.get_ids_ranges_from_vos(this.fields_filters_list[matroid_field.field_id]);
                    } else {
                        param[matroid_field.field_id] = [RangeHandler.getMaxRange(matroid_field)];
                    }
                } else {

                    if (!!this.fields_filters_range[matroid_field.field_id]) {
                        param[matroid_field.field_id] = [this.fields_filters_range[matroid_field.field_id]];
                    } else {
                        param[matroid_field.field_id] = [RangeHandler.getMaxRange(matroid_field)];
                    }
                }
            }

            res.push(param);
        }

        this.params = res;
    }

    @Watch('params', { immediate: true })
    private on_params_change() {
        this.set_filter_params(this.params);
    }

    private enum_field_label_handler(field: ModuleTableField<any>) {
        return (e: IDistantVOBase) =>
            NumRangeComponentController.getInstance().get_enum_handler(field.module_table.vo_type, field.field_id).sync_label_handler(e);
    }

    private async enum_search_handler(field: ModuleTableField<any>) {
        return NumRangeComponentController.getInstance().get_enum_handler(field.module_table.vo_type, field.field_id).enum_query_options_handler;
    }

    private on_edit_range(range: IRange, field_id: string) {
        this.fields_filters_range[field_id] = range;
        this.set_params();
    }
}
