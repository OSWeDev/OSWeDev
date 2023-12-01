import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import SimpleDatatableFieldVO from '../../../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import AdvancedDateFilterOptDescVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/AdvancedDateFilterOptDescVO';
import DashboardPageWidgetVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOsTypesManager from '../../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../../../shared/tools/ConsoleHandler';
import InlineTranslatableText from '../../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../../VueComponentBase';
import VoFieldWidgetRefComponent from '../../../../vo_field_widget_ref/VoFieldWidgetRefComponent';
import AdvancedDateFilterWidgetOptions from '../AdvancedDateFilterWidgetOptions';
import './AdvancedDateFilterWidgetOptionsOptComponent.scss';

@Component({
    template: require('./AdvancedDateFilterWidgetOptionsOptComponent.pug'),
    components: {
        Vofieldwidgetrefcomponent: VoFieldWidgetRefComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class AdvancedDateFilterWidgetOptionsOptComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private opt: AdvancedDateFilterOptDescVO;

    private show_options: boolean = false;
    private object_opt: AdvancedDateFilterOptDescVO = null;

    @Watch('opt', { immediate: true })
    private onchange_opt() {
        if (!this.opt) {
            return;
        }

        this.object_opt = Object.assign(new AdvancedDateFilterOptDescVO(), this.opt);
    }

    private unhide_options() {
        this.show_options = true;
    }

    private hide_options() {
        this.show_options = false;
    }

    private remove_opt() {
        this.$emit('remove_opt', this.object_opt);
    }

    private onchange_object_opt() {
        this.$emit('update_opt', this.object_opt);
    }

    get widget_options(): AdvancedDateFilterWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: AdvancedDateFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as AdvancedDateFilterWidgetOptions;
                options = options ? new AdvancedDateFilterWidgetOptions(
                    options.is_vo_field_ref == null ? true : options.is_vo_field_ref,
                    options.vo_field_ref,
                    options.custom_filter_name,
                    options.opts,
                    options.is_checkbox,
                    options.default_value,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get is_search_type_ytd() {
        return this.object_opt ? this.object_opt.search_type == AdvancedDateFilterOptDescVO.SEARCH_TYPE_YTD : false;
    }

    get is_search_type_last() {
        return this.object_opt ? this.object_opt.search_type == AdvancedDateFilterOptDescVO.SEARCH_TYPE_LAST : false;
    }

    get is_search_type_calendar() {
        return this.object_opt ? this.object_opt.search_type == AdvancedDateFilterOptDescVO.SEARCH_TYPE_CALENDAR : false;
    }

    get is_search_type_custom() {
        return this.object_opt ? this.object_opt.search_type == AdvancedDateFilterOptDescVO.SEARCH_TYPE_CUSTOM : false;
    }

    get opt_name_editable_field() {
        return SimpleDatatableFieldVO.createNew('name').setModuleTable(VOsTypesManager.moduleTables_by_voType[AdvancedDateFilterOptDescVO.API_TYPE_ID]);
    }

    get opt_value_editable_field() {
        return SimpleDatatableFieldVO.createNew('value').setModuleTable(VOsTypesManager.moduleTables_by_voType[AdvancedDateFilterOptDescVO.API_TYPE_ID]);
    }

    get opt_ts_range_editable_field() {
        return SimpleDatatableFieldVO.createNew('ts_range').setModuleTable(VOsTypesManager.moduleTables_by_voType[AdvancedDateFilterOptDescVO.API_TYPE_ID]);
    }

    get opt_search_type_editable_field() {
        return SimpleDatatableFieldVO.createNew('search_type').setModuleTable(VOsTypesManager.moduleTables_by_voType[AdvancedDateFilterOptDescVO.API_TYPE_ID]);
    }

    get opt_segmentation_type_editable_field() {
        return SimpleDatatableFieldVO.createNew('segmentation_type').setModuleTable(VOsTypesManager.moduleTables_by_voType[AdvancedDateFilterOptDescVO.API_TYPE_ID]);
    }
}