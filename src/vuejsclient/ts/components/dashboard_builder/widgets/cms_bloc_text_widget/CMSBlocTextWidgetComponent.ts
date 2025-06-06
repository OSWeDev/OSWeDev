import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleTableFieldController from '../../../../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import TSRange from '../../../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import './CMSBlocTextWidgetComponent.scss';

@Component({
    template: require('./CMSBlocTextWidgetComponent.pug'),
    components: {}
})
export default class CMSBlocTextWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @ModuleDashboardPageGetter
    private get_cms_vo: IDistantVOBase;

    private titre: string = null;
    private sous_titre: string = null;
    private sur_titre: string = null;
    private contenu: string = null;
    private sur_titre_class: string = null;
    private titre_class: string = null;
    private sous_titre_class: string = null;
    private contenu_class: string = null;

    get widget_options(): CMSBlocTextWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSBlocTextWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSBlocTextWidgetOptionsVO;
                options = options ? new CMSBlocTextWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Watch('get_cms_vo')
    private onchange_get_cms_vo() {
        this.titre = this.get_value(this.widget_options.titre, this.widget_options.titre_field_ref_for_template);
        this.sous_titre = this.get_value(this.widget_options.sous_titre, this.widget_options.sous_titre_field_ref_for_template);
        if (this.widget_options.sous_titre_symbole) {
            this.sous_titre = this.sous_titre + ' ' + this.widget_options.sous_titre_symbole;
        }
        this.sur_titre = this.get_value(this.widget_options.sur_titre, this.widget_options.sur_titre_field_ref_for_template);
        this.contenu = this.get_value(this.widget_options.contenu, this.widget_options.contenu_field_ref_for_template);
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.titre = null;
            this.sous_titre = null;
            this.sur_titre = null;
            this.contenu = null;
            this.sur_titre_class = null;
            this.titre_class = null;
            this.sous_titre_class = null;
            this.contenu_class = null;

            return;
        }

        this.titre = this.get_value(this.widget_options.titre, this.widget_options.titre_field_ref_for_template);
        this.sous_titre = this.get_value(this.widget_options.sous_titre, this.widget_options.sous_titre_field_ref_for_template);
        if (this.widget_options.sous_titre_symbole) {
            this.sous_titre = this.sous_titre + ' ' + this.widget_options.sous_titre_symbole;
        }
        this.sur_titre = this.get_value(this.widget_options.sur_titre, this.widget_options.sur_titre_field_ref_for_template);
        this.contenu = this.get_value(this.widget_options.contenu, this.widget_options.contenu_field_ref_for_template);
        this.sur_titre_class = this.widget_options.sur_titre_class;
        this.titre_class = this.widget_options.titre_class;
        this.sous_titre_class = this.widget_options.sous_titre_class;
        this.contenu_class = this.widget_options.contenu_class;
    }

    private async mounted() {
        this.onchange_widget_options();
    }

    private get_value(data: any, field_ref: VOFieldRefVO): string {

        if (!field_ref) {
            return null;
        }

        if (!this.widget_options.use_for_template) {

            return data;
        }

        if (this.get_cms_vo && field_ref?.field_id) {

            const moduletable_field_vo: ModuleTableFieldVO =
                ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[field_ref.vo_type][field_ref.field_id];

            switch (moduletable_field_vo.field_type) {
                case ModuleTableFieldVO.FIELD_TYPE_tstz:
                    const field_value_tstz: number = this.get_cms_vo[field_ref.field_id];

                    if (!field_value_tstz) {
                        return '';
                    }

                    return Dates.format_segment(field_value_tstz, moduletable_field_vo.segmentation_type, moduletable_field_vo.format_localized_time);

                case ModuleTableFieldVO.FIELD_TYPE_tsrange:

                    const field_value_tsrange_min: TSRange = this.get_cms_vo[field_ref.field_id];

                    if (!field_value_tsrange_min) {
                        return '';
                    }

                    const min: string = Dates.format_segment(field_value_tsrange_min.min, moduletable_field_vo.segmentation_type, moduletable_field_vo.format_localized_time);
                    const max: string = Dates.format_segment(field_value_tsrange_min.max, moduletable_field_vo.segmentation_type, moduletable_field_vo.format_localized_time);
                    return min + ' - ' + max;

                case ModuleTableFieldVO.FIELD_TYPE_tstz_array:
                case ModuleTableFieldVO.FIELD_TYPE_tstzrange_array:
                case ModuleTableFieldVO.FIELD_TYPE_date:
                case ModuleTableFieldVO.FIELD_TYPE_daterange:
                    throw new Error("CMSBlocTextWidgetComponent.get_value: Not implemented for field type: " + moduletable_field_vo.field_type);
                default:
                    // Pour les autres types, on retourne la valeur brute
                    break;
            }

            return this.get_cms_vo[field_ref.field_id];
        }

        return null;
    }
}