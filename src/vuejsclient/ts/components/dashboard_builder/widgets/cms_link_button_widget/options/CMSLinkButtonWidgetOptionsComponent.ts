import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSLinkButtonWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSLinkButtonWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import './CMSLinkButtonWidgetOptionsComponent.scss';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import { isEqual } from 'lodash';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import RoleVO from '../../../../../../../shared/modules/AccessPolicy/vos/RoleVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../../../../../../shared/modules/DAO/ModuleTableController';

@Component({
    template: require('./CMSLinkButtonWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
    }
})
export default class CMSLinkButtonWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private url: string = null;
    private url_field_ref: VOFieldRefVO = null;
    private is_url_field: boolean = false;
    private mode_bandeau: boolean = false;

    private title: string = null;
    private color: string = null;
    private text_color: string = null;
    private about_blank: boolean = false;
    private is_text_color_white: boolean = true;
    private radius: number = null;
    private icone: string = null;
    private button_class: string = null;
    private selected_roles: RoleVO[] = [];
    private list_roles: RoleVO[] = [];

    private next_update_options: CMSLinkButtonWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    get widget_options(): CMSLinkButtonWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSLinkButtonWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSLinkButtonWidgetOptionsVO;
                options = options ? new CMSLinkButtonWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.url = null;
            this.url_field_ref = null;
            this.is_url_field = false;
            this.title = null;
            this.color = '#003c7d';
            this.text_color = '#ffffff';
            this.about_blank = false;
            this.is_text_color_white = true;
            this.radius = 0;
            this.icone = "";
            this.button_class = "";
            this.selected_roles = [];
            this.mode_bandeau = false;

            return;
        }
        this.url = this.widget_options.url;
        this.url_field_ref = this.widget_options.url_field_ref ? Object.assign(new VOFieldRefVO(), this.widget_options.url_field_ref) : null;
        this.is_url_field = this.widget_options.is_url_field;

        this.title = this.widget_options.title;
        this.color = this.widget_options.color;
        this.text_color = this.widget_options.text_color;
        this.about_blank = this.widget_options.about_blank;
        this.is_text_color_white = (this.widget_options.text_color == '#ffffff');
        this.radius = this.widget_options.radius;
        this.icone = this.widget_options.icone;
        this.button_class = this.widget_options.button_class;
        this.selected_roles = this.widget_options.role_access;
        this.mode_bandeau = this.widget_options.mode_bandeau;
    }

    @Watch('url')
    @Watch('url_field_ref')
    @Watch('is_url_field')
    @Watch('title')
    @Watch('color')
    @Watch('text_color')
    @Watch('about_blank')
    @Watch('radius')
    @Watch('icone')
    @Watch('button_class')
    @Watch('selected_roles')
    @Watch('mode_bandeau')
    private async onchange_bloc_text() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.url != this.url ||
            !isEqual(this.widget_options.url_field_ref, this.url_field_ref) ||
            this.widget_options.title != this.title ||
            this.widget_options.about_blank != this.about_blank ||
            this.widget_options.text_color != this.text_color ||
            this.widget_options.radius != this.radius ||
            this.widget_options.icone != this.icone ||
            this.widget_options.button_class != this.button_class ||
            this.widget_options.is_url_field != this.is_url_field ||
            this.widget_options.color != this.color ||
            this.widget_options.role_access != this.selected_roles ||
            this.widget_options.mode_bandeau != this.mode_bandeau
        ) {

            this.next_update_options.url = this.url;
            this.next_update_options.url_field_ref = this.url_field_ref;
            this.next_update_options.is_url_field = this.is_url_field;
            this.next_update_options.mode_bandeau = this.mode_bandeau;

            this.next_update_options.title = this.title;
            this.next_update_options.color = this.color;
            this.next_update_options.text_color = this.text_color;
            this.next_update_options.about_blank = this.about_blank;
            this.next_update_options.radius = this.radius;
            this.next_update_options.icone = this.icone;
            this.next_update_options.button_class = this.button_class;
            this.next_update_options.role_access = this.selected_roles;

            this.is_text_color_white = (this.text_color == '#ffffff');

            await this.throttled_update_options();
        }
    }

    private async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }

        this.list_roles = await query(RoleVO.API_TYPE_ID).select_vos();

        await this.throttled_update_options();
    }

    private get_default_options(): CMSLinkButtonWidgetOptionsVO {
        this.is_text_color_white = true;

        return CMSLinkButtonWidgetOptionsVO.createNew(
            null,
            null,
            '#003c7d',
            '#ffffff',
            false,
            0,
            null,
            "",
            false,
            [],
            "",
            false,
        );
    }

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

    private crud_api_type_id_select_label(api_type_id: string): string {
        return this.t(ModuleTableController.module_tables_by_vo_type[api_type_id].label.code_text);
    }

    private multiselectRoleOptionLabel(filter_item: RoleVO): string {
        return this.label(filter_item.translatable_name);
    }

    private async switch_about_blank() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.about_blank = !this.next_update_options.about_blank;

        this.throttled_update_options();
    }

    private async switch_mode_bandeau() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.mode_bandeau = !this.next_update_options.mode_bandeau;

        this.throttled_update_options();
    }

    private async switch_is_url_field() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.is_url_field = !this.next_update_options.is_url_field;

        this.throttled_update_options();
    }

    private async switch_text_color() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.is_text_color_white = !this.is_text_color_white;

        if (this.is_text_color_white) {
            this.next_update_options.text_color = '#ffffff';
        } else {
            this.next_update_options.text_color = '#000000';
        }

        this.throttled_update_options();
    }

    private async add_url_field_ref(api_type_id: string, field_id: string) {
        await this.add_vo_field_ref(api_type_id, field_id, 'url_field_ref');
    }

    private async add_vo_field_ref(api_type_id: string, field_id: string, field_name: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options[field_name] = vo_field_ref;

        await this.throttled_update_options();
    }

    private async remove_url_field_ref() {
        await this.remove_vo_field_ref('url_field_ref');
    }

    private async remove_vo_field_ref(field_name: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options[field_name]) {
            return null;
        }

        this.next_update_options[field_name] = null;

        await this.throttled_update_options();
    }
}