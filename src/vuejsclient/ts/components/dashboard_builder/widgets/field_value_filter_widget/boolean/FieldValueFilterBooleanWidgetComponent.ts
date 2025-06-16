import { cloneDeep, isEqual } from 'lodash';
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import FieldValueFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import TypesHandler from '../../../../../../../shared/tools/TypesHandler';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import ResetFiltersWidgetController from '../../reset_filters_widget/ResetFiltersWidgetController';
import BooleanFilter from './BooleanFilter';
import './FieldValueFilterBooleanWidgetComponent.scss';

@Component({
    template: require('./FieldValueFilterBooleanWidgetComponent.pug'),
    components: {
    }
})
export default class FieldValueFilterBooleanWidgetComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private default_values_changed: boolean = false; //Attribut pour reaffecter les valeurs par défaut lorsqu'elles sont modifiées.

    private throttled_update_visible_options = ThrottleHelper.declare_throttle_without_args(
        'FieldValueFilterBooleanWidgetComponent.throttled_update_visible_options',
        this.update_visible_options.bind(this), 300, false);

    private boolean_filter_types: number[] = [];
    private is_init: boolean = true;
    private old_widget_options: FieldValueFilterWidgetOptionsVO = null;

    private filter_type_options: number[] = [
        BooleanFilter.FILTER_TYPE_TRUE,
        BooleanFilter.FILTER_TYPE_FALSE,
        BooleanFilter.FILTER_TYPE_VIDE
    ];

    get get_active_field_filters(): FieldFiltersVO {
        return this.vuexGet<FieldFiltersVO>(reflect<this>().get_active_field_filters);
    }

    get placeholder(): string {
        if ((!this.get_flat_locale_translations) || (!this.widget_options) || (!this.get_flat_locale_translations[this.widget_options.get_placeholder_name_code_text(this.page_widget.id)])) {
            return null;
        }

        return this.get_flat_locale_translations[this.widget_options.get_placeholder_name_code_text(this.page_widget.id)];
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_active_field_filter(param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) {
        return this.vuexAct(reflect<this>().set_active_field_filter, param);
    }

    public remove_active_field_filter(params: { vo_type: string, field_id: string }) {
        return this.vuexAct(reflect<this>().remove_active_field_filter, params);
    }

    private async mounted() {
        ResetFiltersWidgetController.getInstance().register_reseter(
            this.dashboard_page,
            this.page_widget,
            this.reset_visible_options.bind(this),
        );
    }

    private filter_type_label(filter_type: number): string {
        if (filter_type != null) {
            return this.t(BooleanFilter.FILTER_TYPE_LABELS[filter_type]);
        }
        return null;
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    private async reset_visible_options() {
        this.boolean_filter_types = [];
        // On update le visuel de tout le monde suite au reset
        await this.throttled_update_visible_options();
    }

    private async update_visible_options() {
        // Si on a des valeurs par défaut, on va faire l'init
        if (this.is_init && this.default_values && (this.default_values.length > 0)) {
            // Si on a des valeurs par défaut, on va faire l'init

            // Si je n'ai pas de filtre actif OU que ma valeur de default values à changée, je prends les valeurs par défaut
            const has_active_field_filter: boolean = !!(
                this.get_active_field_filters &&
                this.get_active_field_filters[this.vo_field_ref.api_type_id] &&
                this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id]
            );

            if (!has_active_field_filter || this.default_values_changed) {
                this.is_init = false;
                this.boolean_filter_types = this.default_values;
                this.default_values_changed = false;
                return;
            }
        }

        /**
         * Cas où l'on réinit un filter alors qu'on a déjà un filtre actif enregistré (retour sur la page du filtre typiquement)
         */
        if (this.get_active_field_filters && this.get_active_field_filters[this.vo_field_ref.api_type_id] &&
            this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id] &&
            ((!this.boolean_filter_types) || (!this.boolean_filter_types.length))) {

            /**
             * On essaye d'appliquer les filtres. Si on peut pas appliquer un filtre, on garde l'info pour afficher une petite alerte
             */
            this.try_apply_actual_active_filters(this.get_active_field_filters[this.vo_field_ref.api_type_id][this.vo_field_ref.field_id]);
        }
    }

    private try_apply_actual_active_filters(filter: ContextFilterVO): boolean {
        if (!filter) {
            if (this.boolean_filter_types && this.boolean_filter_types.length) {
                this.boolean_filter_types = [];
            }
            return true;
        }

        this.boolean_filter_types = [];
        this.try_apply_filters(filter);

        return true;
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {
        if (this.old_widget_options) {
            if (isEqual(this.widget_options, this.old_widget_options)) {
                return;
            }

            if (!isEqual(this.widget_options.default_filter_opt_values, this.old_widget_options.default_filter_opt_values)) {
                this.default_values_changed = true;
            }
        }

        this.old_widget_options = cloneDeep(this.widget_options);
        this.is_init = true;
        await this.throttled_update_visible_options();
    }

    @Watch('boolean_filter_types')
    private onchange_boolean_filter_types() {

        if (!this.widget_options) {
            return;
        }

        let locale_boolean_filter_types = null;

        if (TypesHandler.getInstance().isArray(this.boolean_filter_types)) {
            locale_boolean_filter_types = this.boolean_filter_types;
        } else {
            if (this.boolean_filter_types != null) {
                locale_boolean_filter_types = [this.boolean_filter_types];
            }
        }

        if ((!locale_boolean_filter_types) || (!locale_boolean_filter_types.length)) {
            this.remove_active_field_filter({ vo_type: this.vo_field_ref.api_type_id, field_id: this.vo_field_ref.field_id });
            return;
        }

        this.set_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id,
            active_field_filter: this.get_ContextFilterVO_from_boolean_filter_types(),
        });
    }

    get vo_field_ref(): VOFieldRefVO {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get default_values(): number[] {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.default_boolean_values) || (!options.default_boolean_values.length)) {
            return null;
        }

        return options.default_boolean_values;
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: FieldValueFilterWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FieldValueFilterWidgetOptionsVO;
                options = options ? new FieldValueFilterWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    private get_ContextFilterVO_from_boolean_filter_types(): ContextFilterVO {
        let filter = null;

        for (const i in this.boolean_filter_types) {
            const boolean_filter_type = this.boolean_filter_types[i];

            const this_filter = new ContextFilterVO();
            this_filter.field_name = this.vo_field_ref.field_id;
            this_filter.vo_type = this.vo_field_ref.api_type_id;

            if (boolean_filter_type == BooleanFilter.FILTER_TYPE_TRUE) {

                this_filter.filter_type = ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY;
            } else if (boolean_filter_type == BooleanFilter.FILTER_TYPE_FALSE) {
                this_filter.filter_type = ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY;
            } else if (boolean_filter_type == BooleanFilter.FILTER_TYPE_VIDE) {
                this_filter.filter_type = ContextFilterVO.TYPE_NULL_ANY;
            }

            if (!filter) {
                filter = this_filter;
            } else {
                const or = new ContextFilterVO();
                or.field_name = this.vo_field_ref.field_id;
                or.vo_type = this.vo_field_ref.api_type_id;
                or.filter_type = ContextFilterVO.TYPE_FILTER_OR;
                or.left_hook = filter;
                or.right_hook = this_filter;

                filter = or;
            }
        }

        return filter;
    }

    private try_apply_filters(filter: ContextFilterVO) {
        switch (filter.filter_type) {
            case ContextFilterVO.TYPE_FILTER_OR:
                this.try_apply_filters(filter.left_hook);
                this.try_apply_filters(filter.right_hook);
                break;

            case ContextFilterVO.TYPE_BOOLEAN_TRUE_ANY:
                this.boolean_filter_types.push(BooleanFilter.FILTER_TYPE_TRUE);
                break;

            case ContextFilterVO.TYPE_BOOLEAN_FALSE_ANY:
                this.boolean_filter_types.push(BooleanFilter.FILTER_TYPE_FALSE);
                break;

            case ContextFilterVO.TYPE_NULL_ANY:
                this.boolean_filter_types.push(BooleanFilter.FILTER_TYPE_VIDE);
                break;

            default:
                throw new Error('Not Implemented');
        }
    }
}