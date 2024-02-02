import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleActionURL from '../../../../../../../shared/modules/ActionURL/ModuleActionURL';
import ActionURLCRVO from '../../../../../../../shared/modules/ActionURL/vos/ActionURLCRVO';
import ActionURLVO from '../../../../../../../shared/modules/ActionURL/vos/ActionURLVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import './CeliaThreadMessageActionURLComponent.scss';
import VOEventRegistrationKey from '../../../../../modules/PushData/VOEventRegistrationKey';
import PushDataVueModule from '../../../../../modules/PushData/PushDataVueModule';
import AjaxCacheClientController from '../../../../../modules/AjaxCache/AjaxCacheClientController';

@Component({
    template: require('./CeliaThreadMessageActionURLComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class CeliaThreadMessageActionURLComponent extends VueComponentBase {

    @Prop({ default: null })
    private action_url_id: number;

    private action_url: ActionURLVO = null;
    // private action_url_crs: ActionURLCRVO[] = null;

    private vo_events_registration_keys: VOEventRegistrationKey[] = [];

    private throttle_load_action_url = ThrottleHelper.declare_throttle_without_args(this.load_action_url, 10);

    @Watch('action_url_id', { immediate: true })
    private async onchange_action_url_id() {
        this.throttle_load_action_url();
    }

    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }

    private async unregister_all_vo_event_callbacks() {
        let promises = [];
        for (let i in this.vo_events_registration_keys) {
            let vo_event_registration_key = this.vo_events_registration_keys[i];

            promises.push(PushDataVueModule.unregister_vo_event_callback(vo_event_registration_key));
        }
        await all_promises(promises);
        this.vo_events_registration_keys = [];
    }

    private async load_action_url() {

        await this.unregister_all_vo_event_callbacks();

        if (!this.action_url_id) {
            this.action_url = null;
            return;
        }

        // await all_promises([
        //     (async () => {
        this.action_url = await query(ActionURLVO.API_TYPE_ID).filter_by_id(this.action_url_id).select_vo<ActionURLVO>();
        // })()
        // ,
        // (async () => {
        //     this.action_url_crs = await query(ActionURLCRVO.API_TYPE_ID)
        //         .filter_by_id(this.action_url_id, ActionURLVO.API_TYPE_ID)
        //         .set_sort(new SortByVO(ActionURLCRVO.API_TYPE_ID, field_names<ActionURLCRVO>().id, false))
        //         .set_limit(1)
        //         .select_vos<ActionURLCRVO>();
        // })()
        // ]);

        await this.register_vo_updates();

        this.$nextTick(() => {
            this.$emit('thread_message_action_url_updated');
        });
    }

    private async force_reload() {
        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([
            ActionURLVO.API_TYPE_ID,
            // ActionURLCRVO.API_TYPE_ID,
        ]);

        this.throttle_load_action_url();
    }

    private async register_vo_updates() {
        await this.register_action_url_vo_updates();
        // await this.register_action_url_cr_vo_updates();
    }

    private async register_action_url_vo_updates() {
        let room_vo = {
            [field_names<ActionURLVO>()._type]: ActionURLVO.API_TYPE_ID,
            [field_names<ActionURLVO>().id]: this.action_url.id
        };
        let vo_event_registration_key = await PushDataVueModule.register_vo_delete_callback(
            room_vo,
            JSON.stringify(room_vo),
            async (deleted_vo: ActionURLVO) => {
                this.action_url = null;
            }
        );
        this.vo_events_registration_keys.push(vo_event_registration_key);

        room_vo = {
            [field_names<ActionURLVO>()._type]: ActionURLVO.API_TYPE_ID,
            [field_names<ActionURLVO>().id]: this.action_url.id
        };
        vo_event_registration_key = await PushDataVueModule.register_vo_update_callback(
            room_vo,
            JSON.stringify(room_vo),
            async (pre_update_vo: ActionURLVO, post_update_vo: ActionURLVO) => {
                this.action_url = post_update_vo;
            }
        );
        this.vo_events_registration_keys.push(vo_event_registration_key);
    }

    private async execute_action_url() {
        if (!this.action_url) {
            return;
        }

        this.snotify.async(this.label('CeliaThreadMessageActionURLComponent.execute_action_url.encours'), async () =>
            new Promise(async (resolve, reject) => {

                try {
                    if (await ModuleActionURL.getInstance().action_url(this.action_url.action_code, true)) {
                        resolve({
                            body: this.label('CeliaThreadMessageActionURLComponent.execute_action_url.ok'),
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
                    body: this.label('CeliaThreadMessageActionURLComponent.execute_action_url.failed'),
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
        return null;

        // if (!this.action_url) {
        //     return null;
        // }

        // if ((!this.action_url_crs) || (!this.action_url_crs.length)) {
        //     return null;
        // }

        // let cr = this.action_url_crs[0];

        // return cr.translation_params_json ? this.label(cr.translatable_cr, JSON.parse(cr.translation_params_json)) : this.label(cr.translatable_cr);
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