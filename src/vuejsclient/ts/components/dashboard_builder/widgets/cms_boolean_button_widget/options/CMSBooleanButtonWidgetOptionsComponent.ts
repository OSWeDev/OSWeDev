import { isEqual } from 'lodash';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Throttle from '../../../../../../../shared/annotations/Throttle';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSBooleanButtonWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSBooleanButtonWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import EventifyEventListenerConfVO from '../../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import './CMSBooleanButtonWidgetOptionsComponent.scss';

@Component({
    template: require('./CMSBooleanButtonWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
    }
})
export default class CMSBooleanButtonWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private title_ok: string = null;
    private title_nok: string = null;
    private color: string = null;
    private text_color: string = null;
    private vo_field_ref: VOFieldRefVO = null;
    private user_field_ref: VOFieldRefVO = null;
    private radius: number = null;
    private icone_ok: string = null;
    private icone_nok: string = null;

    private next_update_options: CMSBooleanButtonWidgetOptionsVO = null;

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


    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 50,
        leading: false,
    })
    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        if (!this.widget_options) {
            return;
        }

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.title_ok = null;
            this.title_nok = null;
            this.color = '#003c7d';
            this.text_color = '#ffffff';
            this.vo_field_ref = null;
            this.radius = 0;
            this.icone_ok = null;
            this.icone_nok = null;
            this.user_field_ref = null;

            return;
        }
        this.vo_field_ref = this.widget_options.vo_field_ref ? Object.assign(new VOFieldRefVO(), this.widget_options.vo_field_ref) : null;
        this.title_ok = this.widget_options.title_ok;
        this.title_nok = this.widget_options.title_nok;
        this.color = this.widget_options.color;
        this.text_color = this.widget_options.text_color;
        this.radius = this.widget_options.radius;
        this.icone_ok = this.widget_options.icone_ok;
        this.icone_nok = this.widget_options.icone_nok;
        this.user_field_ref = this.widget_options.user_field_ref;
    }

    @Watch('title_ok')
    @Watch('title_nok')
    @Watch('color')
    @Watch('text_color')
    @Watch('vo_field_ref')
    @Watch('radius')
    @Watch('icone_ok')
    @Watch('icone_nok')
    @Watch('user_field_ref')
    private async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (!isEqual(this.widget_options.vo_field_ref, this.vo_field_ref) ||
            this.widget_options.title_ok != this.title_ok ||
            this.widget_options.title_nok != this.title_nok ||
            this.widget_options.text_color != this.text_color ||
            this.widget_options.radius != this.radius ||
            this.widget_options.icone_ok != this.icone_ok ||
            this.widget_options.icone_nok != this.icone_nok ||
            this.widget_options.user_field_ref != this.user_field_ref ||
            this.widget_options.color != this.color) {

            this.next_update_options.title_ok = this.title_ok;
            this.next_update_options.title_nok = this.title_nok;
            this.next_update_options.color = this.color;
            this.next_update_options.text_color = this.text_color;
            this.next_update_options.vo_field_ref = this.vo_field_ref;
            this.next_update_options.radius = this.radius;
            this.next_update_options.icone_ok = this.icone_ok;
            this.next_update_options.icone_nok = this.icone_nok;
            this.next_update_options.user_field_ref = this.user_field_ref;

            this.update_options();
        }
    }

    private async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }

        this.update_options();
    }

    private get_default_options(): CMSBooleanButtonWidgetOptionsVO {

        return CMSBooleanButtonWidgetOptionsVO.createNew(
            null,
            null,
            '#003c7d',
            '#ffffff',
            null,
            null,
            null,
            0,
            null,
        );
    }

    private async add_vo_field_ref(api_type_id: string, field_id: string) {
        await this.add_field_ref(api_type_id, field_id, 'vo_field_ref');
    }
    private async add_user_field_ref(api_type_id: string, field_id: string) {
        await this.add_field_ref(api_type_id, field_id, 'user_field_ref');
    }

    private async add_field_ref(api_type_id: string, field_id: string, field_name: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options[field_name] = vo_field_ref;

        this.update_options();
    }

    private async remove_vo_field_ref() {
        await this.remove_field_ref('vo_field_ref');
    }
    private async remove_user_field_ref() {
        await this.remove_field_ref('user_field_ref');
    }

    private async remove_field_ref(field_name: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options[field_name]) {
            return null;
        }

        this.next_update_options[field_name] = null;

        this.update_options();
    }
}