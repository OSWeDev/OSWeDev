import { Component, Prop } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import VueComponentBase from '../../../../../ts/components/VueComponentBase';
import "./SendInitPwdComponent.scss";

@Component({
    template: require('./SendInitPwdComponent.pug')
})
export default class SendInitPwdComponent extends VueComponentBase {

    @Prop()
    private vo: UserVO;

    private async sendinitpwd() {
        if (!this.vo) {
            return;
        }

        await ModuleAccessPolicy.getInstance().begininitpwd(this.vo.email);
        this.snotify.success(this.label('sendinitpwd.ok'));
    }
}