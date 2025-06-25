import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldVO from '../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import StringSearchbarWidgetOptions from '../../../../../../shared/modules/DashboardBuilder/vos/StringSearchbarWidgetOptions';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DataFilterOption from '../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../DashboardBuilderWidgetsController';
import AdvancedStringFilter from '../field_value_filter_widget/string/AdvancedStringFilter';
import ResetFiltersWidgetController from '../reset_filters_widget/ResetFiltersWidgetController';
import ValidationFiltersCallUpdaters from '../validation_filters_widget/ValidationFiltersCallUpdaters';
import ValidationFiltersWidgetController from '../validation_filters_widget/ValidationFiltersWidgetController';
import './StringSearchbarWidgetComponent.scss';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../../../../../../shared/tools/ObjectHandler';

@Component({
    template: require('./StringSearchbarWidgetComponent.pug'),
    components: {}
})
export default class StringSearchbarWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    @ModuleDashboardPageAction
    private remove_active_field_filter: (params: { vo_type: string, field_id: string }) => void;

    @ModuleDashboardPageGetter
    private get_widgets_invisibility: { [w_id: number]: boolean };

    @ModuleDashboardPageAction
    private set_widgets_invisibility: (widgets_invisibility: { [w_id: number]: boolean }) => void;

    @ModuleDashboardPageAction
    private set_widget_invisibility: (w_id: number) => void;

    @ModuleDashboardPageAction
    private set_widget_visibility: (w_id: number) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private filter_visible_options: DataFilterOption[] = [];
    private advanced_string_filter: AdvancedStringFilter = new AdvancedStringFilter();

    private actual_query: string = null;

    private is_init: boolean = false;
    private old_widget_options: StringSearchbarWidgetOptions = null;

    private last_calculation_cpt: number = 0;

    private filter_type_options: number[] = [
        AdvancedStringFilter.FILTER_TYPE_COMMENCE,
        AdvancedStringFilter.FILTER_TYPE_CONTIENT,
        AdvancedStringFilter.FILTER_TYPE_EST,
        AdvancedStringFilter.FILTER_TYPE_EST_NULL,
        AdvancedStringFilter.FILTER_TYPE_EST_VIDE,
        AdvancedStringFilter.FILTER_TYPE_NEST_PAS,
        AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL,
        AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE,
        AdvancedStringFilter.FILTER_TYPE_REGEXP,
    ];

    get has_content_filter_type(): { [filter_type: number]: boolean } {
        const res: { [filter_type: number]: boolean } = {
            [AdvancedStringFilter.FILTER_TYPE_COMMENCE]: true,
            [AdvancedStringFilter.FILTER_TYPE_CONTIENT]: true,
            [AdvancedStringFilter.FILTER_TYPE_EST]: true,
            [AdvancedStringFilter.FILTER_TYPE_EST_NULL]: false,
            [AdvancedStringFilter.FILTER_TYPE_EST_VIDE]: false,
            [AdvancedStringFilter.FILTER_TYPE_NEST_PAS]: true,
            [AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL]: false,
            [AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE]: false,
            [AdvancedStringFilter.FILTER_TYPE_REGEXP]: true,
        };

        return res;
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get advanced_mode_placeholder(): string {
        if ((!this.get_flat_locale_translations) || (!this.widget_options) || (!this.get_flat_locale_translations[this.widget_options.get_advanced_mode_placeholder_code_text(this.page_widget.id)])) {
            return null;
        }

        return this.get_flat_locale_translations[this.widget_options.get_advanced_mode_placeholder_code_text(this.page_widget.id)];
    }

    get vo_field_ref(): VOFieldRefVO {
        const options: StringSearchbarWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get default_advanced_string_filter_type(): number {
        return this.widget_options.default_advanced_string_filter_type;
    }

    get vo_field_ref_multiple(): VOFieldRefVO[] {
        const options: StringSearchbarWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref_multiple) || (!options.vo_field_ref_multiple.length)) {
            return null;
        }

        const res: VOFieldRefVO[] = [];

        for (const i in options.vo_field_ref_multiple) {
            res.push(Object.assign(new VOFieldRefVO(), options.vo_field_ref_multiple[i]));
        }

        return res;
    }

    get autovalidate_advanced_filter(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.autovalidate_advanced_filter;
    }

    get hide_advanced_string_filter_type(): boolean {
        return this.widget_options.hide_advanced_string_filter_type;
    }

    get active_field_on_autovalidate_advanced_filter(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return !!this.widget_options.active_field_on_autovalidate_advanced_filter;
    }

    get is_translatable_type(): boolean {
        if (!this.vo_field_ref) {
            return false;
        }

        const moduletable = ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id];
        if (!moduletable) {
            return false;
        }

        const field = moduletable.get_field_by_id(this.vo_field_ref.field_id);
        if (!field) {
            return false;
        }

        return field.field_type == ModuleTableFieldVO.FIELD_TYPE_translatable_text;
    }

    get widgets_by_id(): { [id: number]: DashboardWidgetVO } {
        return VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets);
    }

    /**
     * Computed widget options
     *  - Called on component|widget creation
     * @returns StringSearchbarWidgetOptions
     */
    get widget_options(): StringSearchbarWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: StringSearchbarWidgetOptions = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as StringSearchbarWidgetOptions;
                options = options ? new StringSearchbarWidgetOptions().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * Watch on widget_options
     *  - Shall happen first on component init or each time widget_options changes
     *
     * @returns void
     */
    @Watch('widget_options', { immediate: true })
    private onchange_widget_options(): void {
        if (this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);

        this.is_init = false;

        this.throttled_update_visible_options();
    }

    /**
     * Watch on active_field_filters
     *  - Shall happen first on component init or each time active_field_filters changes
     * @returns {void}
     */
    @Watch('get_active_field_filters', { deep: true })
    private onchange_active_field_filters(): void {
        this.throttled_update_visible_options();
    }

    private throttled_update_visible_options = (timeout: number = 300) => (ThrottleHelper.declare_throttle_without_args(
        'StringSearchbarWidgetComponent.throttled_update_visible_options',
        this.update_visible_options.bind(this), timeout, false))();

    private async mounted() {
        ResetFiltersWidgetController.getInstance().register_reseter(
            this.dashboard_page,
            this.page_widget,
            this.reset_visible_options.bind(this),
        );
    }

    private filter_type_label(filter_type: number): string {
        if (filter_type != null) {
            return this.t(AdvancedStringFilter.FILTER_TYPE_LABELS[filter_type]);
        }
        return null;
    }

    //     const context_active_filter_options: ContextFilterVO[] = [];

    //     const moduletable = ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id];
    //     const field = moduletable.get_field_by_id(this.vo_field_ref.field_id);

    //         let tmp_context_filter: ContextFilterVO = null;

    // if (this.advanced_string_filter) {

    //     tmp_context_filter = this.get_advanced_string_filter(
    //         tmp_context_filter,
    //         this.advanced_string_filter,
    //         field,
    //         this.vo_field_ref,
    //     );
    // }

    // // if (tmp_context_filter) {
    // //     context_active_filter_options.push(tmp_context_filter);
    // // }

    // if (this.vo_field_ref_multiple?.length > 0) {
    //     // Case when we have a search from multiple vos api_type_id
    //     // We need to create a context_filter for each of those
    //     for (const j in this.vo_field_ref_multiple) {
    //         const vo_field_ref_multiple = this.vo_field_ref_multiple[j];

    //         const moduletable_multiple = ModuleTableController.module_tables_by_vo_type[vo_field_ref_multiple.api_type_id];
    //         const field_multiple = moduletable_multiple.get_field_by_id(vo_field_ref_multiple.field_id);

    //         let advanced_context_filter: ContextFilterVO = null;

    //         if (this.advanced_string_filter) {

    //             advanced_context_filter = this.get_advanced_string_filter(
    //                 tmp_context_filter,
    //                 this.advanced_string_filter,
    //                 field_multiple,
    //                 vo_field_ref_multiple,
    //             );
    //         }

    //         if (advanced_context_filter) {
    //             context_active_filter_options.push(advanced_context_filter);
    //         }
    //     }
    // }

    // if (context_active_filter_options.length > 0) {
    //     this.set_active_field_filter({
    //         field_id: this.vo_field_ref.field_id,
    //         vo_type: this.vo_field_ref.api_type_id,
    //         active_field_filter: ContextFilterVO.or(context_active_filter_options),
    //     });
    // }
    private async validate_advanced_string_filter() {
        /**
         * À la validation de l'advanced_string_filter, on va parcourir les multiples.
         * Si je n'ai pas de multiple, je construis le contextfilter du champ principal
         * Sinon, je construis une query par multiple et j'aggrege les résultats
         * Je présente ces résultats dans un multiselect et plus tard à la sélection d'un client
         */
        if (!this.widget_options || !this.vo_field_ref) {
            return;
        }

        // P-e qu'il faut remove l'active du vo_field_ref à ce moment là ??

        if (this.vo_field_ref_multiple?.length > 0) {

            for (const i in this.vo_field_ref_multiple) {
                const vo_field_ref_multiple = this.vo_field_ref_multiple[i];

                const moduletable = ModuleTableController.module_tables_by_vo_type[vo_field_ref_multiple.api_type_id];
                const field = moduletable.get_field_by_id(vo_field_ref_multiple.field_id);

                let query_: ContextQueryVO = await query(this.vo_field_ref.api_type_id);
                query_ = this.apply_filter_from_AdvancedStringFilter(this.advanced_string_filter, field, vo_field_ref_multiple, query_);
                // TODO
            }

        } else {

            let context_active_filter: ContextFilterVO = new ContextFilterVO();

            const moduletable = ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id];
            const field = moduletable.get_field_by_id(this.vo_field_ref.field_id);

            if (this.advanced_string_filter) {

                context_active_filter = this.get_advanced_string_filter(
                    context_active_filter,
                    this.advanced_string_filter,
                    field,
                    this.vo_field_ref,
                );
            }

            if (context_active_filter) {
                this.set_active_field_filter({
                    field_id: this.vo_field_ref.field_id,
                    vo_type: this.vo_field_ref.api_type_id,
                    active_field_filter: context_active_filter,
                });
            }
        }
    }

    private get_advanced_string_filter(context_filter: ContextFilterVO, advanced_filter: AdvancedStringFilter, field: ModuleTableFieldVO, vo_field_ref: VOFieldRefVO): ContextFilterVO {
        const new_context_filter = this.get_ContextFilterVO_from_AdvancedStringFilter(advanced_filter, field, vo_field_ref);

        if (!new_context_filter) {
            return null;
        }

        if (!context_filter) {
            context_filter = new_context_filter;
        } else {

            const link_ = new ContextFilterVO();
            link_.field_name = context_filter.field_name;
            link_.vo_type = context_filter.vo_type;

            if (advanced_filter.link_type == AdvancedStringFilter.LINK_TYPE_ET) {
                link_.filter_type = ContextFilterVO.TYPE_FILTER_AND;
            } else {
                link_.filter_type = ContextFilterVO.TYPE_FILTER_OR;
            }

            link_.left_hook = context_filter;
            link_.right_hook = new_context_filter;
            context_filter = link_;
        }

        return context_filter;
    }

    private query_update_visible_options(_query: string) {
        this.actual_query = _query;
        this.throttled_update_visible_options();
    }

    /**
     * Reset visible options
     */
    private reset_visible_options() {
        // // Reset des filtres
        this.advanced_string_filter = new AdvancedStringFilter(); // Reset les champs saisie libre

        // On update le visuel de tout le monde suite au reset
        this.throttled_update_visible_options(0);
    }

    /**
     * Update visible option
     *  - This happen | triggered with lodash throttle method (throttled_update_visible_options)
     *  - Each time visible option shall be updated
     * @returns void
     */
    private async update_visible_options(): Promise<void> {

        const launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
            return;
        }

        // Si on a des valeurs par défaut, on va faire l'init
        const old_is_init: boolean = this.is_init;

        this.is_init = true;

        // case when not currently initializing
        if (!old_is_init) {

            ValidationFiltersWidgetController.getInstance().throttle_call_updaters(
                new ValidationFiltersCallUpdaters(
                    this.dashboard_page.dashboard_id,
                    this.dashboard_page.id,
                    this.page_widget.id
                )
            );
        }

        // case when not currently initializing
        if (!old_is_init) {
            if (this.default_advanced_string_filter_type != null) {
                if (this.advanced_string_filter) {
                    this.advanced_string_filter.filter_type = this.default_advanced_string_filter_type;
                }

                if (!this.has_content_filter_type[this.default_advanced_string_filter_type]) {
                    this.validate_advanced_string_filter();
                    return;
                }
            }
        }
    }


    // create single data filter to apply
    private createDataFilter(text: string, index: string | number): DataFilterOption {
        const dataFilter = new DataFilterOption(
            DataFilterOption.STATE_SELECTED,
            text,
            parseInt(index.toString())
        );
        dataFilter.string_value = text;

        return dataFilter;
    }

    private has_advanced_filter(filter_: ContextFilterVO): boolean {
        if ((filter_.filter_type == ContextFilterVO.TYPE_TEXT_EQUALS_ANY) && (filter_.param_textarray != null) && (filter_.param_textarray.length > 0)) {
            return false;
        }

        return true;
    }

    private get_ContextFilterVO_from_AdvancedStringFilter(advanced_filter: AdvancedStringFilter, field: ModuleTableFieldVO, vo_field_ref: VOFieldRefVO): ContextFilterVO {
        let translated_active_options = null;

        switch (field.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_image_field:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_enum:
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            case ModuleTableFieldVO.FIELD_TYPE_prct:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case ModuleTableFieldVO.FIELD_TYPE_hour:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
            case ModuleTableFieldVO.FIELD_TYPE_boolean:
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                throw new Error('Not Implemented');

            case ModuleTableFieldVO.FIELD_TYPE_html:
            case ModuleTableFieldVO.FIELD_TYPE_password:
            case ModuleTableFieldVO.FIELD_TYPE_email:
            case ModuleTableFieldVO.FIELD_TYPE_string:
            case ModuleTableFieldVO.FIELD_TYPE_file_field:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:

                switch (advanced_filter.filter_type) {
                    case AdvancedStringFilter.FILTER_TYPE_COMMENCE:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_starting_with(advanced_filter.filter_content);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_COMMENCE_PAS:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_starting_with_none(advanced_filter.filter_content);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_CONTIENT:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_including(advanced_filter.filter_content);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_CONTIENT_PAS:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_excluding(advanced_filter.filter_content);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_EST:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_has(advanced_filter.filter_content);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_NEST_PAS:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_has_none(advanced_filter.filter_content);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_EST_NULL:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).has_null();
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).is_not_null();
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_EST_VIDE:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_has('');
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_text_has_none('');
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_REGEXP:
                        translated_active_options = filter(vo_field_ref.api_type_id, vo_field_ref.field_id).by_regexp(advanced_filter.filter_content);
                        break;
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
                throw new Error('Not Implemented');

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_daterange:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_int_array:
            case ModuleTableFieldVO.FIELD_TYPE_float_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            case ModuleTableFieldVO.FIELD_TYPE_date:
            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_month:
            case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
                throw new Error('Not Implemented');
        }

        return translated_active_options;
    }

    private apply_filter_from_AdvancedStringFilter(advanced_filter: AdvancedStringFilter, field: ModuleTableFieldVO, vo_field_ref: VOFieldRefVO, query_: ContextQueryVO): ContextQueryVO {

        switch (field.field_type) {
            case ModuleTableFieldVO.FIELD_TYPE_file_ref:
            case ModuleTableFieldVO.FIELD_TYPE_image_field:
            case ModuleTableFieldVO.FIELD_TYPE_image_ref:
            case ModuleTableFieldVO.FIELD_TYPE_enum:
            case ModuleTableFieldVO.FIELD_TYPE_int:
            case ModuleTableFieldVO.FIELD_TYPE_geopoint:
            case ModuleTableFieldVO.FIELD_TYPE_float:
            case ModuleTableFieldVO.FIELD_TYPE_decimal_full_precision:
            case ModuleTableFieldVO.FIELD_TYPE_amount:
            case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
            case ModuleTableFieldVO.FIELD_TYPE_isoweekdays:
            case ModuleTableFieldVO.FIELD_TYPE_prct:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableFieldVO.FIELD_TYPE_hours_and_minutes:
            case ModuleTableFieldVO.FIELD_TYPE_hour:
            case ModuleTableFieldVO.FIELD_TYPE_tstz:
            case ModuleTableFieldVO.FIELD_TYPE_boolean:
            case ModuleTableFieldVO.FIELD_TYPE_plain_vo_obj:
                throw new Error('Not Implemented');

            case ModuleTableFieldVO.FIELD_TYPE_html:
            case ModuleTableFieldVO.FIELD_TYPE_password:
            case ModuleTableFieldVO.FIELD_TYPE_email:
            case ModuleTableFieldVO.FIELD_TYPE_string:
            case ModuleTableFieldVO.FIELD_TYPE_file_field:
            case ModuleTableFieldVO.FIELD_TYPE_textarea:
            case ModuleTableFieldVO.FIELD_TYPE_translatable_text:

                switch (advanced_filter.filter_type) {
                    case AdvancedStringFilter.FILTER_TYPE_COMMENCE:
                        query_ = query_.filter_by_text_starting_with(vo_field_ref.field_id, vo_field_ref.api_type_id);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_CONTIENT:
                        query_ = query_.filter_by_text_including(vo_field_ref.field_id, vo_field_ref.api_type_id);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_EST:
                        query_ = query_.filter_by_text_has(vo_field_ref.field_id, vo_field_ref.api_type_id);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_NEST_PAS:
                        query_ = query_.filter_by_text_has_none(vo_field_ref.field_id, vo_field_ref.api_type_id);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_EST_NULL:
                        query_ = query_.filter_is_null(vo_field_ref.field_id, vo_field_ref.api_type_id);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL:
                        query_ = query_.filter_is_not_null(vo_field_ref.field_id, vo_field_ref.api_type_id);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_EST_VIDE:
                        query_ = query_.filter_by_text_eq(vo_field_ref.field_id, "", vo_field_ref.api_type_id);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE:
                        query_ = query_.filter_by_text_not_eq(vo_field_ref.field_id, "", vo_field_ref.api_type_id);
                        break;
                    case AdvancedStringFilter.FILTER_TYPE_REGEXP:
                        query_ = query_.filter_by_reg_exp(vo_field_ref.field_id, vo_field_ref.api_type_id);
                        break;
                }
                break;

            case ModuleTableFieldVO.FIELD_TYPE_string_array:
            case ModuleTableFieldVO.FIELD_TYPE_html_array:
                throw new Error('Not Implemented');

            case ModuleTableFieldVO.FIELD_TYPE_numrange:
            case ModuleTableFieldVO.FIELD_TYPE_numrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_refrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_daterange:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange:
            case ModuleTableFieldVO.FIELD_TYPE_tsrange:
            case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_hourrange_array:
            case ModuleTableFieldVO.FIELD_TYPE_int_array:
            case ModuleTableFieldVO.FIELD_TYPE_float_array:
            case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
            case ModuleTableFieldVO.FIELD_TYPE_date:
            case ModuleTableFieldVO.FIELD_TYPE_day:
            case ModuleTableFieldVO.FIELD_TYPE_month:
            case ModuleTableFieldVO.FIELD_TYPE_timewithouttimezone:
                throw new Error('Not Implemented');
        }

        return query_;
    }

    private try_apply_advanced_filter(filter_: ContextFilterVO, advanced_string_filter: AdvancedStringFilter) {
        const advanced_filter = new AdvancedStringFilter();

        switch (filter_.filter_type) {
            case ContextFilterVO.TYPE_FILTER_AND:
                this.try_apply_advanced_filter(filter_.left_hook, advanced_string_filter);
                advanced_string_filter.link_type = AdvancedStringFilter.LINK_TYPE_ET;
                this.try_apply_advanced_filter(filter_.right_hook, advanced_string_filter);
                break;

            case ContextFilterVO.TYPE_FILTER_OR:
                this.try_apply_advanced_filter(filter_.left_hook, advanced_string_filter);
                advanced_string_filter.link_type = AdvancedStringFilter.LINK_TYPE_OU;
                this.try_apply_advanced_filter(filter_.right_hook, advanced_string_filter);
                break;

            case ContextFilterVO.TYPE_TEXT_STARTSWITH_ANY:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_COMMENCE;
                advanced_filter.filter_content = filter_.param_text;
                break;

            case ContextFilterVO.TYPE_TEXT_STARTSWITH_NONE:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_COMMENCE_PAS;
                advanced_filter.filter_content = filter_.param_text;
                break;

            case ContextFilterVO.TYPE_TEXT_INCLUDES_ANY:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_CONTIENT;
                advanced_filter.filter_content = filter_.param_text;
                break;

            case ContextFilterVO.TYPE_REGEXP_ANY:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_REGEXP;
                advanced_filter.filter_content = filter_.param_text;
                break;

            case ContextFilterVO.TYPE_TEXT_INCLUDES_NONE:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_CONTIENT_PAS;
                advanced_filter.filter_content = filter_.param_text;
                break;

            case ContextFilterVO.TYPE_NULL_ANY:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_EST_NULL;
                break;

            case ContextFilterVO.TYPE_NULL_NONE:
                advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_NEST_PAS_NULL;
                break;

            case ContextFilterVO.TYPE_TEXT_EQUALS_ANY:
                if (filter_.param_text == '') {
                    advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_EST_VIDE;
                    advanced_filter.filter_content = filter_.param_text;
                } else {
                    advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_EST;
                    advanced_filter.filter_content = filter_.param_text;
                }
                break;
            case ContextFilterVO.TYPE_TEXT_EQUALS_NONE:
                if (filter_.param_text == '') {
                    advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_NEST_PAS_VIDE;
                    advanced_filter.filter_content = filter_.param_text;
                } else {
                    advanced_filter.filter_type = AdvancedStringFilter.FILTER_TYPE_NEST_PAS;
                    advanced_filter.filter_content = filter_.param_text;
                }
                break;

            default:
                throw new Error('Not Implemented');
        }

        advanced_string_filter = advanced_filter;
    }

    private onchange_advanced_string_filter_content() {
        if (this.autovalidate_advanced_filter) {
            this.validate_advanced_string_filter();
        }
    }
}