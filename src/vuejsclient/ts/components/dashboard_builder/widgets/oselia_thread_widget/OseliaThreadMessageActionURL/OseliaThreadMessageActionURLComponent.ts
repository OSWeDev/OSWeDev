import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleActionURL from '../../../../../../../shared/modules/ActionURL/ModuleActionURL';
import ActionURLCRVO from '../../../../../../../shared/modules/ActionURL/vos/ActionURLCRVO';
import ActionURLVO from '../../../../../../../shared/modules/ActionURL/vos/ActionURLVO';
import { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { field_names, reflect } from '../../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import './OseliaThreadMessageActionURLComponent.scss';

@Component({
    template: require('./OseliaThreadMessageActionURLComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class OseliaThreadMessageActionURLComponent extends VueComponentBase {

    public action_url: ActionURLVO = null;
    public action_url_crs: ActionURLCRVO[] = [];

    @Prop({ default: null })
    private action_url_id: number;

    private throttle_load_action_url = ThrottleHelper.declare_throttle_without_args(this.load_action_url, 10);

    @Watch('action_url_id', { immediate: true })
    private async onchange_action_url_id() {
        this.throttle_load_action_url();
    }

    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }

    private async load_action_url() {

        await this.unregister_all_vo_event_callbacks();

        if (!this.action_url_id) {
            this.action_url = null;
            return;
        }

        await all_promises([
            this.register_single_vo_updates(
                ActionURLVO.API_TYPE_ID,
                this.action_url_id,
                reflect<this>().action_url,
                false
            ),
            this.register_vo_updates_on_list(
                ActionURLCRVO.API_TYPE_ID,
                reflect<this>().action_url_crs,
                [filter(ActionURLCRVO.API_TYPE_ID, field_names<ActionURLCRVO>().action_url_id).by_num_eq(this.action_url_id)]
            )
        ]);

        this.$nextTick(() => {
            this.$emit('thread_message_action_url_updated');
        });
    }

    get last_action_url_cr() {
        if ((!this.action_url_crs) || (!this.action_url_crs.length)) {
            return null;
        }

        return this.action_url_crs[0];
    }

    private async execute_action_url() {
        if (!this.action_url) {
            return;
        }

        this.snotify.async(this.label('OseliaThreadMessageActionURLComponent.execute_action_url.encours'), async () =>
            new Promise(async (resolve, reject) => {

                try {
                    if (await ModuleActionURL.getInstance().action_url(this.action_url.action_code, true)) {
                        resolve({
                            body: this.label('OseliaThreadMessageActionURLComponent.execute_action_url.ok'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }
                } catch (error) {
                    ConsoleHandler.error(error);
                }
                reject({
                    body: this.label('OseliaThreadMessageActionURLComponent.execute_action_url.failed'),
                    config: {
                        timeout: 10000,
                        showProgressBar: true,
                        closeOnClick: false,
                        pauseOnHover: true,
                    },
                });
            }));
    }

    get action_url_tooltip() {
        if (!this.action_url) {
            return null;
        }

        if (!this.last_action_url_cr) {
            return null;
        }

        return this.last_action_url_cr.translatable_cr_title_params_json ? this.t(this.last_action_url_cr.translatable_cr_title, JSON.parse(this.last_action_url_cr.translatable_cr_title_params_json)) : this.t(this.last_action_url_cr.translatable_cr_title);
    }

    get action_url_button_disabled() {
        if (!this.action_url) {
            return true;
        }

        return this.action_url.action_remaining_counter == 0;
    }

    get action_url_button_class() {
        if (!this.action_url) {
            return null;
        }

        if (this.action_url.button_bootstrap_type != null) {
            return ActionURLVO.BOOTSTRAP_BUTTON_TYPE_CORRESPONDING_BOOTSTRAP_CLASSNAME[this.action_url.button_bootstrap_type];
        }

        if (this.action_url.action_remaining_counter == 0) {
            return 'btn-secondary';
        }

        return 'btn-primary';
    }

    get action_url_button_icon_class() {
        if (!this.action_url) {
            return null;
        }

        if ((!this.action_url.button_fc_icon_classnames) || (!this.action_url.button_fc_icon_classnames.length)) {
            return null;
        }

        return this.action_url.button_fc_icon_classnames.join(' ');
    }

    get action_url_button_label() {
        if (!this.action_url) {
            return null;
        }

        return this.action_url.button_translatable_name_params_json ?
            this.label(this.action_url.button_translatable_name, JSON.parse(this.action_url.button_translatable_name_params_json)) : this.label(this.action_url.button_translatable_name);
    }
}