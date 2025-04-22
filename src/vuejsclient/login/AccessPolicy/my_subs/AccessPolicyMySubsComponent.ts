import { Component } from "vue-property-decorator";
import Throttle from "../../../../shared/annotations/Throttle";
import UserRoleVO from "../../../../shared/modules/AccessPolicy/vos/UserRoleVO";
import UserVO from "../../../../shared/modules/AccessPolicy/vos/UserVO";
import { query } from "../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import EventifyEventListenerConfVO from "../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO";
import MailCategoryVO from "../../../../shared/modules/Mailer/vos/MailCategoryVO";
import VueComponentBase from '../../../ts/components/VueComponentBase';
import AccessPolicyMySubComponent from "../my_sub/AccessPolicyMySubComponent";
import './AccessPolicyMySubsComponent.scss';
import RoleVO from "../../../../shared/modules/AccessPolicy/vos/RoleVO";
import MailCategoryUserVO from "../../../../shared/modules/Mailer/vos/MailCategoryUserVO";
import { field_names } from "../../../../shared/tools/ObjectHandler";

@Component({
    template: require('./AccessPolicyMySubsComponent.pug'),
    components: {
        Accesspolicymysubcomponent: AccessPolicyMySubComponent,
    }
})
export default class AccessPolicyMySubsComponent extends VueComponentBase {

    private mail_categories: MailCategoryVO[] = [];

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 100,
    })
    private async reload_mail_categories() {
        if (!this.data_user?.id) {
            return;
        }

        // On charge les catégories qui sont cohérentes avec notre user
        this.mail_categories = await query(MailCategoryVO.API_TYPE_ID)
            .filter_by_id(this.data_user.id, UserVO.API_TYPE_ID)
            .using(UserRoleVO.API_TYPE_ID)
            .using(RoleVO.API_TYPE_ID)
            .set_discarded_field_path(MailCategoryUserVO.API_TYPE_ID, field_names<MailCategoryUserVO>().user_id)
            .set_discarded_field_path(MailCategoryUserVO.API_TYPE_ID, field_names<MailCategoryUserVO>().mail_category_id)
            .select_vos<MailCategoryVO>();
    }

    private async mounted() {
        await this.reload_mail_categories();
    }
}