

import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import VueAppController from '../../../VueAppController';
import FileComponent from '../file/FileComponent';
import VueComponentBase from '../VueComponentBase';
import { ModuleBardChatroomAction, ModuleBardChatroomGetter } from './store/BardChatroomStore';
import './BardChatroomHandlerComponent.scss';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import BardConfigurationVO from '../../../../shared/modules/Bard/vos/BardConfigurationVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ModuleBard from '../../../../shared/modules/Bard/ModuleBard';
import BardMessageVO from '../../../../shared/modules/Bard/vos/BardMessageVO';

@Component({
    template: require('./BardChatroomHandlerComponent.pug'),
    components: {
        Filecomponent: FileComponent
    }
})
export default class BardChatroomHandlerComponent extends VueComponentBase {

    @ModuleBardChatroomGetter
    public get_hidden: boolean;

    @ModuleBardChatroomAction
    public set_hidden: (hidden: boolean) => void;

    @Prop({ default: false })
    private show_wish_be_called;

    private user: UserVO = null;
    private user_cookies = null;

    private tmp_message: string = null;

    private tmp_start_date: number = null;

    private bard_user_config: BardConfigurationVO = null;
    private has_cookies_changes: boolean = false;

    private is_already_sending_bard_chatroom_message: boolean = false;

    private async mounted() {
        await this.reload();
    }

    private async reload() {
        this.user = VueAppController.getInstance().data_user ? VueAppController.getInstance().data_user : null;
        this.user_cookies = null;

        this.tmp_message = null;

        this.tmp_start_date = Dates.now();

        await this.load_user_cookies();
    }

    @Watch('user_cookies', { immediate: true })
    private async onchange_user_cookies() {
        if (this.bard_user_config.cookies != this.user_cookies) {
            this.has_cookies_changes = true;
        }
    }

    @Watch('get_hidden', { immediate: true })
    private async onchange_get_hidden() {
        // If first time, store date
        if (!this.tmp_start_date) {
            this.tmp_start_date = Dates.now();
        }
    }

    private async load_user_cookies() {
        this.bard_user_config = await query(BardConfigurationVO.API_TYPE_ID)
            .filter_by_num_eq(field_names<BardConfigurationVO>().user_id, this.user.id)
            .select_vo<BardConfigurationVO>();

        if (!this.bard_user_config) {
            this.has_cookies_changes = true;
            return;
        }

        this.user_cookies = this.bard_user_config.cookies;
        this.has_cookies_changes = false;
    }

    /**
     * Save user cookies if changes
     */
    private async save_bard_user_cookies() {
        if (!this.has_cookies_changes) {
            return;
        }

        const bard_user_config = new BardConfigurationVO().from(
            {
                id: this.bard_user_config?.id, // May be we just want to update
                user_id: this.user.id,
                cookies: this.user_cookies,
                date: Dates.now(),
            }
        );

        const res = await ModuleDAO.getInstance().insertOrUpdateVO(bard_user_config);

        if (!res) {
            return;
        }

        this.bard_user_config = bard_user_config;
        this.bard_user_config.id = res.id;
        this.has_cookies_changes = false;
    }

    private async send_bard_chatroom_message() {
        if (this.is_already_sending_bard_chatroom_message) {
            return;
        }

        const bard_message = new BardMessageVO().from({
            role_type: BardMessageVO.BARD_MSG_ROLE_TYPE_USER,
            user_id: this.user.id,
            content: this.tmp_message,
            date: Dates.now(),
        });

        const response = await ModuleBard.getInstance().bard_ask(bard_message);
    }

    private switch_hidden() {
        this.set_hidden(!this.get_hidden);
    }

    get isActive(): boolean {
        return !this.get_hidden;
    }
}