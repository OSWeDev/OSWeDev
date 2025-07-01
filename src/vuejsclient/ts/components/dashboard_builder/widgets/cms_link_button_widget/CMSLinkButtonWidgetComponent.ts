import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import CMSLinkButtonWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSLinkButtonWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import './CMSLinkButtonWidgetComponent.scss';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import VueAppController from '../../../../../VueAppController';
import UserRoleVO from '../../../../../../shared/modules/AccessPolicy/vos/UserRoleVO';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../../../../../../shared/tools/ObjectHandler';
import RoleVO from '../../../../../../shared/modules/AccessPolicy/vos/RoleVO';

@Component({
    template: require('./CMSLinkButtonWidgetComponent.pug'),
    components: {}
})
export default class CMSLinkButtonWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageGetter
    private get_cms_vo: IDistantVOBase;

    private url: string = null;
    private is_url_field: boolean = false;
    private title: string = null;
    private icone: string = null;
    private button_class: string = null;
    private color: string = null;
    private text_color: string = null;
    private about_blank: boolean = null;
    private mode_bandeau: boolean = null;
    private radius: number = null;
    private start_update: boolean = false;

    private show_link_button: boolean = false;
    private user: UserVO = null;

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

    get style(): string {
        return 'background-color: ' + this.color + '; color: ' + this.text_color + ';' + (this.radius ? 'border-radius: ' + this.radius + 'px;' : '');
    }

    get style_bandeau(): string {
        return 'background-color: ' + this.color + '; color: ' + this.text_color + ';';
    }

    get style_chevron(): string {
        return 'color: ' + this.text_color + ';';
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.url = null;
            this.is_url_field = false;
            this.title = null;
            this.icone = null;
            this.button_class = null;
            this.color = '#003c7d';
            this.text_color = '#ffffff';
            this.about_blank = false;
            this.mode_bandeau = false;
            this.radius = null;

            return;
        }
        this.is_url_field = this.widget_options.is_url_field;
        this.url = this.is_url_field
            ? ((this.get_cms_vo && this.widget_options?.url_field_ref) ? this.get_cms_vo[this.widget_options.url_field_ref.field_id] : null)
            : this.widget_options.url;
        this.title = this.widget_options.title;
        this.icone = this.widget_options.icone;
        this.button_class = this.widget_options.button_class;
        this.color = this.widget_options.color;
        this.text_color = this.widget_options.text_color;
        this.about_blank = this.widget_options.about_blank;
        this.mode_bandeau = this.widget_options.mode_bandeau;
        this.radius = this.widget_options.radius;

        if (!this.widget_options.role_access || this.widget_options.role_access.length == 0) {
            this.show_link_button = true;
        }

        this.user = VueAppController.getInstance().data_user;

        if (this.user?.id && this.widget_options.role_access?.length > 0) {

            const user_roles: UserRoleVO[] = await query(UserRoleVO.API_TYPE_ID).filter_by_num_eq(field_names<UserRoleVO>().user_id, this.user.id).select_vos();
            const role_ids: number[] = user_roles.map((role: UserRoleVO) => role.role_id);
            const roles: RoleVO[] = await query(RoleVO.API_TYPE_ID).filter_by_ids(role_ids).select_vos();

            for (const i in roles) {
                if (this.widget_options.role_access.find((role: RoleVO) => role.id == roles[i].id)) {
                    this.show_link_button = true;
                    break;
                }
            }
        }
    }

    private async mounted() {
        this.onchange_widget_options();
    }

    private go_to_link() {
        if (this.start_update) {
            return;
        }

        this.start_update = true;

        if (this.about_blank) {

            window.open(this.url, '_blank');
        } else {

            window.open(this.url, '_self');
        }

        this.start_update = false;
    }
}