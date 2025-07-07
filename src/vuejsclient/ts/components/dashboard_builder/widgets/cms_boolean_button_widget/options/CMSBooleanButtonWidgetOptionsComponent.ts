import { isEqual } from 'lodash';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSBooleanButtonWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSBooleanButtonWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import './CMSBooleanButtonWidgetOptionsComponent.scss';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';

@Component({
    template: require('./CMSBooleanButtonWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
    }
})
export default class CMSBooleanButtonWidgetOptionsComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    public title_ok: string = null;
    public title_nok: string = null;
    public color: string = null;
    public text_color: string = null;
    public vo_field_ref: VOFieldRefVO = null;
    public user_field_ref: VOFieldRefVO = null;
    public radius: number = null;
    public icone_ok: string = null;
    public icone_nok: string = null;

    public next_update_options: CMSBooleanButtonWidgetOptionsVO = null;
    public throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

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

    @Watch('widget_options', { immediate: true, deep: true })
    public async onchange_widget_options() {
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
    public async onchange_bloc_text() {
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

            await this.throttled_update_options();
        }
    }

    public async mounted() {

        if (!this.widget_options) {

            this.next_update_options = this.get_default_options();
        } else {

            this.next_update_options = this.widget_options;
        }

        await this.throttled_update_options();
    }

    public get_default_options(): CMSBooleanButtonWidgetOptionsVO {

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

    public async update_options() {
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

    public async add_vo_field_ref(api_type_id: string, field_id: string) {
        await this.add_field_ref(api_type_id, field_id, 'vo_field_ref');
    }
    public async add_user_field_ref(api_type_id: string, field_id: string) {
        await this.add_field_ref(api_type_id, field_id, 'user_field_ref');
    }

    public async add_field_ref(api_type_id: string, field_id: string, field_name: string) {
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

    public async remove_vo_field_ref() {
        await this.remove_field_ref('vo_field_ref');
    }
    public async remove_user_field_ref() {
        await this.remove_field_ref('user_field_ref');
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_page_widget(page_widget: DashboardPageWidgetVO): void {
        this.vuexAct<DashboardPageWidgetVO>(reflect<this>().set_page_widget, page_widget);
    }


    public async remove_field_ref(field_name: string) {
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