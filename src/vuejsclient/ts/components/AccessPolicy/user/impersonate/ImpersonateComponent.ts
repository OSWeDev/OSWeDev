import { Component, Prop } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import TableColumnDescVO from '../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import { ModuleDAOGetter } from '../../../../../ts/components/dao/store/DaoStore';
import VueComponentBase from '../../../../../ts/components/VueComponentBase';
import "./ImpersonateComponent.scss";

@Component({
    template: require('./ImpersonateComponent.pug')
})
export default class ImpersonateComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @Prop()
    private vo: UserVO;

    @Prop()
    private columns: TableColumnDescVO[];

    private redirect_to: string = "/";

    get mail_field_id() {
        for (let i in this.columns) {
            let column = this.columns[i];
            if (column.api_type_id != UserVO.API_TYPE_ID) {
                continue;
            }
            if (column.field_id != 'email') {
                continue;
            }

            return column.datatable_field_uid;
        }

        return 'email';
    }

    /**
     * Si on est sur un db on aura un __crud_actions pour l'id, sinon ça sera le champs id du vo directement
     */
    get userid_field_id() {

        for (let i in this.columns) {
            let column = this.columns[i];
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
        if (!this.vo) {
            return;
        }

        let user_id: number = await ModuleAccessPolicy.getInstance().impersonateLogin(this.vo[this.mail_field_id]);

        if (user_id == this.vo[this.userid_field_id]) {
            window.location = this.redirect_to as any;
        }
    }
}