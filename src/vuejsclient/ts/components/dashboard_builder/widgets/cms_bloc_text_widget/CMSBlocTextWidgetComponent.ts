import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VueComponentBase from '../../../VueComponentBase';
import './CMSBlocTextWidgetComponent.scss';
import CMSBlocTextWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSBlocTextWidgetOptionsVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import TSRange from '../../../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import TimeSegment from '../../../../../../shared/modules/DataRender/vos/TimeSegment';

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
        this.titre = this.get_value(this.widget_options.titre, this.widget_options.titre_field_ref_for_template, this.widget_options.titre_template_is_date);
        this.sous_titre = this.get_value(this.widget_options.sous_titre, this.widget_options.sous_titre_field_ref_for_template, this.widget_options.sous_titre_template_is_date);
        if (this.widget_options.sous_titre_symbole) {
            this.sous_titre = this.sous_titre + ' ' + this.widget_options.sous_titre_symbole;
        }
        this.sur_titre = this.get_value(this.widget_options.sur_titre, this.widget_options.sur_titre_field_ref_for_template, this.widget_options.sur_titre_template_is_date);
        this.contenu = this.get_value(this.widget_options.contenu, this.widget_options.contenu_field_ref_for_template, this.widget_options.contenu_template_is_date);
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.titre = null;
            this.sous_titre = null;
            this.sur_titre = null;
            this.contenu = null;

            return;
        }

        this.titre = this.get_value(this.widget_options.titre, this.widget_options.titre_field_ref_for_template, this.widget_options.titre_template_is_date);
        this.sous_titre = this.get_value(this.widget_options.sous_titre, this.widget_options.sous_titre_field_ref_for_template, this.widget_options.sous_titre_template_is_date);
        if (this.widget_options.sous_titre_symbole) {
            this.sous_titre = this.sous_titre + ' ' + this.widget_options.sous_titre_symbole;
        }
        this.sur_titre = this.get_value(this.widget_options.sur_titre, this.widget_options.sur_titre_field_ref_for_template, this.widget_options.sur_titre_template_is_date);
        this.contenu = this.get_value(this.widget_options.contenu, this.widget_options.contenu_field_ref_for_template, this.widget_options.contenu_template_is_date);
    }

    private async mounted() {
        this.onchange_widget_options();
    }

    private get_value(data: any, field_ref: VOFieldRefVO, is_date: boolean): string {
        if (this.widget_options.use_for_template && is_date && this.get_cms_vo && field_ref?.field_id) {
            return Dates.format(this.get_cms_vo[field_ref.field_id], "DD/MM/YYYY");
        }

        if (!this.widget_options.use_for_template) {

            if (data instanceof TSRange) {
                return data.min_inclusiv
                    ? Dates.format(data.min, "DD/MM/YYYY")
                    : Dates.format(Dates.add(data.min, 1, TimeSegment.TYPE_DAY), "DD/MM/YYYY")
                        + ' - '
                        + data.max_inclusiv
                        ? Dates.format(data.max, "DD/MM/YYYY")
                        : Dates.format(Dates.add(data.max, -1, TimeSegment.TYPE_DAY), "DD/MM/YYYY");
            }

            return data;
        }

        if (this.get_cms_vo && field_ref?.field_id) {

            if (this.get_cms_vo[field_ref.field_id] instanceof TSRange) {
                return (
                    this.get_cms_vo[field_ref.field_id].min_inclusiv
                        ? Dates.format(this.get_cms_vo[field_ref.field_id].min, "DD/MM/YYYY")
                        : Dates.format(Dates.add(this.get_cms_vo[field_ref.field_id].min, 1, TimeSegment.TYPE_DAY), "DD/MM/YYYY"))
                    + ' - '
                    + (
                        this.get_cms_vo[field_ref.field_id].max_inclusiv
                            ? Dates.format(this.get_cms_vo[field_ref.field_id].max, "DD/MM/YYYY")
                            : Dates.format(Dates.add(this.get_cms_vo[field_ref.field_id].max, -1, TimeSegment.TYPE_DAY), "DD/MM/YYYY"));
            }

            return this.get_cms_vo[field_ref.field_id];
        }

        return null;
    }
}