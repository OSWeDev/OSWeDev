import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import TableColumnDescVO from '../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../../ts/components/VueComponentBase';
import { ModuleDAOGetter } from '../../../../../ts/components/dao/store/DaoStore';
import "./ImpersonateComponent.scss";

@Component({
    template: require('./ImpersonateComponent.pug')
})
export default class ImpersonateComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @Prop()
    private vo: any;

    @Prop()
    private columns: TableColumnDescVO[];

    private redirect_to: string = "/";

    private uid: number = null;
    private user_vo: UserVO = null;

    private throttle_onVoChange = ThrottleHelper.declare_throttle_without_args(this.throttled_onVoChange, 10);
    private throttle_onUidChange = ThrottleHelper.declare_throttle_without_args(this.throttled_onUidChange, 10);

    @Watch('vo', { immediate: true })
    private async onVoChange() {
        this.throttle_onVoChange();
    }

    private throttled_onVoChange() {
        this.uid = this.vo ? this.vo[this.userid_field_id] : null;
    }

    @Watch('uid', { immediate: true })
    private async onUidChange() {
        this.throttle_onUidChange();
    }

    private async throttled_onUidChange() {
        this.user_vo = this.uid ?
            await query(UserVO.API_TYPE_ID).filter_by_id(this.uid).select_vo<UserVO>()
            : null;
    }

    get can_impersonate() {
        if ((!this.user_vo) || this.user_vo.invalidated || this.user_vo.archived || this.user_vo.blocked) {
            return false;
        }

        return true;
    }

    /**
     * Si on est sur un db on aura un __crud_actions pour l'id, sinon ça sera le champs id du vo directement
     */
    get userid_field_id() {

        for (const i in this.columns) {
            const column = this.columns[i];
            if (column.api_type_id != UserVO.API_TYPE_ID) {
                continue;
            }
            if (column.type != TableColumnDescVO.TYPE_crud_actions) {
                continue;
            }

            return column.datatable_field_uid;
        }

        return 'id';
    }

    private async impersonate() {
        if (!this.uid) {
            return;
        }

        const user_id: number = await ModuleAccessPolicy.getInstance().impersonate(this.uid);

        if (!user_id) {
            ConsoleHandler.error('Impossible d\'impersonner l\'utilisateur:' + this.uid);
            return;
        }

        window.location = this.redirect_to as any;
    }
}