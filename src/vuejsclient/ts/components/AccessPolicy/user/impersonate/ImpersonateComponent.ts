import { Component, Prop } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
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

    private redirect_to: string = "/";

    private async impersonate() {
        if (!this.vo) {
            return;
        }

        let user_id: number = await ModuleAccessPolicy.getInstance().impersonateLogin(this.vo.email);

        if (user_id == this.vo.id) {
            window.location = this.redirect_to as any;
        }
    }
}