import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import CMSBooleanButtonWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSBooleanButtonWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import './CMSBooleanButtonWidgetComponent.scss';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import VueAppController from '../../../../../VueAppController';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import SimpleDatatableFieldVO from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';

@Component({
    template: require('./CMSBooleanButtonWidgetComponent.pug'),
    components: {}
})
export default class CMSBooleanButtonWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    private boolean_vo_value: boolean = false;
    private title_ok: string = null;
    private title_nok: string = null;
    private icone_ok: string = null;
    private icone_nok: string = null;
    private color: string = null;
    private text_color: string = null;
    private radius: number = null;
    private start_update: boolean = false;

    get widget_options(): CMSBooleanButtonWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSBooleanButtonWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSBooleanButtonWidgetOptionsVO;
                options = options ? new CMSBooleanButtonWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get style(): string {
        return 'background-color: ' + this.color + '; color: ' + this.text_color + '; border: 1px solid ' + this.text_color + ';' + (this.radius ? 'border-radius: ' + this.radius + 'px;' : '');
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.boolean_vo_value = false;
            this.title_ok = null;
            this.title_nok = null;
            this.icone_ok = null;
            this.icone_nok = null;
            this.color = '#003c7d';
            this.text_color = '#ffffff';
            this.radius = null;

            return;
        }

        this.title_ok = this.widget_options.title_ok;
        this.title_nok = this.widget_options.title_nok;
        this.icone_ok = this.widget_options.icone_ok;
        this.icone_nok = this.widget_options.icone_nok;
        this.radius = this.widget_options.radius;

        // Pour le moment, le widget ne fonctionne que si l'objet à un lien avec les users
        const user = VueAppController.getInstance().data_user;

        const vo_field = await query(this.widget_options.vo_field_ref.api_type_id)
            .field(this.widget_options.vo_field_ref.field_id)
            .filter_by_num_eq(this.widget_options.user_field_ref.field_id, user.id, this.widget_options.user_field_ref.api_type_id)
            .select_one();

        try {
            const res = await this.get_value_formatted(vo_field, this.widget_options.vo_field_ref.field_id, this.widget_options.vo_field_ref.api_type_id);
            this.boolean_vo_value = JSON.parse(res);
        } catch (error) {
            ConsoleHandler.error(error);
            return;
        }

        if (this.boolean_vo_value == true) {
            this.color = this.widget_options.text_color;
            this.text_color = this.widget_options.color;
        } else {
            this.color = this.widget_options.color;
            this.text_color = this.widget_options.text_color;
        }
    }

    private async mounted() {
        this.onchange_widget_options();
    }

    private get_value_formatted(vo: IDistantVOBase, field_id: string, api_type_id: string) {
        const res = [];
        const field: SimpleDatatableFieldVO<any, any> = SimpleDatatableFieldVO.createNew(field_id)
            .setModuleTable(ModuleTableController.module_tables_by_vo_type[api_type_id]);

        return field.dataToReadIHM(vo[field_id], vo);
    }

    private async switch_boolean_vo_value() {
        this.boolean_vo_value = !this.boolean_vo_value;

        if (this.boolean_vo_value == true) {
            this.color = this.widget_options.text_color;
            this.text_color = this.widget_options.color;
        } else {
            this.color = this.widget_options.color;
            this.text_color = this.widget_options.text_color;
        }

        const user = VueAppController.getInstance().data_user;
        const vo = await query(this.widget_options.vo_field_ref.api_type_id)
            .filter_by_num_eq(this.widget_options.user_field_ref.field_id, user.id, this.widget_options.user_field_ref.api_type_id)
            .select_vo();

        vo[this.widget_options.vo_field_ref.field_id] = this.boolean_vo_value;
        await ModuleDAO.getInstance().insertOrUpdateVO(vo);
    }
}