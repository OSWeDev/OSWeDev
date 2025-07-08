import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
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
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import TSRange from '../../../../../../shared/modules/DataRender/vos/TSRange';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import TimeSegment from '../../../../../../shared/modules/DataRender/vos/TimeSegment';
import { reflect } from '../../../../../../shared/tools/ObjectHandler';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../page/DashboardPageStore';

@Component({
    template: require('./CMSBlocTextWidgetComponent.pug'),
    components: {}
})
export default class CMSBlocTextWidgetComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    public all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    public dashboard: DashboardVO;

    @Prop({ default: null })
    public dashboard_page: DashboardPageVO;

    public titre: string = null;
    public sous_titre: string = null;
    public sur_titre: string = null;
    public contenu: string = null;
    public sur_titre_class: string = null;
    public titre_class: string = null;
    public sous_titre_class: string = null;
    public contenu_class: string = null;

    get get_crud_vo(): IDistantVOBase {
        return this.vuexGet(reflect<this>().get_crud_vo);
    }

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

    @Watch('get_crud_vo')
    public onchange_get_crud_vo() {
        this.titre = this.get_value(this.widget_options.titre, this.widget_options.titre_field_ref_for_template, this.widget_options.titre_template_is_date);
        this.sous_titre = this.get_value(this.widget_options.sous_titre, this.widget_options.sous_titre_field_ref_for_template, this.widget_options.sous_titre_template_is_date);
        if (this.widget_options.sous_titre_symbole) {
            this.sous_titre = this.sous_titre + ' ' + this.widget_options.sous_titre_symbole;
        }
        this.sur_titre = this.get_value(this.widget_options.sur_titre, this.widget_options.sur_titre_field_ref_for_template, this.widget_options.sur_titre_template_is_date);
        this.contenu = this.get_value(this.widget_options.contenu, this.widget_options.contenu_field_ref_for_template, this.widget_options.contenu_template_is_date);
    }

    @Watch('widget_options', { immediate: true, deep: true })
    public async onchange_widget_options() {
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

        this.titre = this.get_value(this.widget_options.titre, this.widget_options.titre_field_ref_for_template, this.widget_options.titre_template_is_date);
        this.sous_titre = this.get_value(this.widget_options.sous_titre, this.widget_options.sous_titre_field_ref_for_template, this.widget_options.sous_titre_template_is_date);
        if (this.widget_options.sous_titre_symbole) {
            this.sous_titre = this.sous_titre + ' ' + this.widget_options.sous_titre_symbole;
        }
        this.sur_titre = this.get_value(this.widget_options.sur_titre, this.widget_options.sur_titre_field_ref_for_template, this.widget_options.sur_titre_template_is_date);
        this.contenu = this.get_value(this.widget_options.contenu, this.widget_options.contenu_field_ref_for_template, this.widget_options.contenu_template_is_date);
        this.sur_titre_class = this.widget_options.sur_titre_class;
        this.titre_class = this.widget_options.titre_class;
        this.sous_titre_class = this.widget_options.sous_titre_class;
        this.contenu_class = this.widget_options.contenu_class;
    }

    public async mounted() {
        this.onchange_widget_options();
    }

    public get_value(data: any, field_ref: VOFieldRefVO, is_date: boolean): string {
        if (this.widget_options.use_for_template && is_date && this.get_crud_vo && field_ref?.field_id) {
            return Dates.format(this.get_crud_vo[field_ref.field_id], "DD/MM/YYYY");
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

        if (this.get_crud_vo && field_ref?.field_id) {

            if (this.get_crud_vo[field_ref.field_id] instanceof TSRange) {
                return (
                    this.get_crud_vo[field_ref.field_id].min_inclusiv
                        ? Dates.format(this.get_crud_vo[field_ref.field_id].min, "DD/MM/YYYY")
                        : Dates.format(Dates.add(this.get_crud_vo[field_ref.field_id].min, 1, TimeSegment.TYPE_DAY), "DD/MM/YYYY"))
                    + ' - '
                    + (
                        this.get_crud_vo[field_ref.field_id].max_inclusiv
                            ? Dates.format(this.get_crud_vo[field_ref.field_id].max, "DD/MM/YYYY")
                            : Dates.format(Dates.add(this.get_crud_vo[field_ref.field_id].max, -1, TimeSegment.TYPE_DAY), "DD/MM/YYYY"));
            }

            return this.get_crud_vo[field_ref.field_id];
        }

        return null;
    }

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

}