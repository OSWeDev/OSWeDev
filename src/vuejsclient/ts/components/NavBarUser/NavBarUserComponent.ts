import { Component } from 'vue-property-decorator';
import VueAppController from '../../../VueAppController';
import { ModuleBootstrapTemplateGetter } from '../BootstrapTemplate/store/BootstrapTemplateStore';
import { ModuleFeedbackAction } from '../feedback_handler/store/FeedbackStore';
import VueComponentBase from '../VueComponentBase';
import './NavBarUserComponent.scss';

@Component({
    template: require('./NavBarUserComponent.pug')
})
export default class NavBarUserComponent extends VueComponentBase {

    @ModuleFeedbackAction
    public set_hidden: (hidden: boolean) => void;

    @ModuleBootstrapTemplateGetter
    private get_fa_navbarbtn_style: string;

    @ModuleBootstrapTemplateGetter
    private get_nav_btn: string;

    get avatar_img_path(): string {
        return null;
    }

    get user_name(): string {
        if (!VueAppController.getInstance().data_user) {
            return null;
        }

        return VueAppController.getInstance().data_user.name;
    }

    private open_support() {
        this.set_hidden(false);
    }
}