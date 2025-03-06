import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import CMSBooleanButtonWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSBooleanButtonWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import './CMSBooleanButtonWidgetComponent.scss';
import { Module } from 'module';
import ModuleTableFieldVO from '../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';

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
        return 'background-color: ' + this.color + '; color: ' + this.text_color + ';' + (this.radius ? 'border-radius: ' + this.radius + 'px;' : '');
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
        this.color = this.widget_options.color;
        this.text_color = this.widget_options.text_color;
        this.radius = this.widget_options.radius;

        // const module_table_field_vo: ModuleTableFieldVO = null;
    }

    private async mounted() {
        this.onchange_widget_options();
    }

}