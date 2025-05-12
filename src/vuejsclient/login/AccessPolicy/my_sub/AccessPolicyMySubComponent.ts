import { Component, Prop, Watch } from "vue-property-decorator";
import Throttle from "../../../../shared/annotations/Throttle";
import UserVO from "../../../../shared/modules/AccessPolicy/vos/UserVO";
import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../../../shared/modules/DAO/ModuleDAO";
import EventifyEventListenerConfVO from "../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO";
import MailCategoryUserVO from "../../../../shared/modules/Mailer/vos/MailCategoryUserVO";
import MailCategoryVO from "../../../../shared/modules/Mailer/vos/MailCategoryVO";
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './AccessPolicyMySubComponent.scss';

@Component({
    template: require('./AccessPolicyMySubComponent.pug'),
    components: {}
})
export default class AccessPolicyMySubComponent extends VueComponentBase {

    @Prop({ default: null })
    private mail_category: MailCategoryVO;

    private current_value: boolean = false;

    @Watch('mail_category', { immediate: true })
    private async on_changed_mail_category() {
        this.rebuild_current_value();
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 100,
    })
    private async rebuild_current_value() {

        if ((!this.mail_category?.id) || (!this.data_user?.id)) {
            return;
        }

        const mail_category_user: MailCategoryUserVO = await query(MailCategoryUserVO.API_TYPE_ID)
            .filter_by_id(this.mail_category.id, MailCategoryVO.API_TYPE_ID)
            .filter_by_id(this.data_user.id, UserVO.API_TYPE_ID)
            .select_vo<MailCategoryUserVO>();

        if (!!mail_category_user) {
            this.current_value = (this.mail_category.type_optin == MailCategoryVO.TYPE_OPTIN_OPTIN);
        } else {
            this.current_value = (this.mail_category.type_optin == MailCategoryVO.TYPE_OPTIN_OPTOUT);
        }
    }

    private async switch_sub() {
        if ((!this.mail_category?.id) || (!this.data_user?.id)) {
            return;
        }

        const mail_category_user: MailCategoryUserVO = await query(MailCategoryUserVO.API_TYPE_ID)
            .filter_by_id(this.mail_category.id, MailCategoryVO.API_TYPE_ID)
            .filter_by_id(this.data_user.id, UserVO.API_TYPE_ID)
            .select_vo<MailCategoryUserVO>();

        if (!!mail_category_user) {
            await ModuleDAO.getInstance().deleteVOs([mail_category_user]);
        } else {
            const new_mail_category_user: MailCategoryUserVO = new MailCategoryUserVO();
            new_mail_category_user.mail_category_id = this.mail_category.id;
            new_mail_category_user.user_id = this.data_user.id;

            await ModuleDAO.getInstance().insertOrUpdateVO(new_mail_category_user);
        }

        this.rebuild_current_value();
    }
}