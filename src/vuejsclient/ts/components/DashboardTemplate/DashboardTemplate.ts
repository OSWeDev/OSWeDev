import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import VueAppController from '../../../VueAppController';
import DocumentHandlerModalComponent from '../document_handler/modal/DocumentHandlerModalComponent';
import FeedbackHandlerComponent from '../feedback_handler/FeedbackHandlerComponent';
import SideBarMenuComponent from '../menu/SideBarMenu/SideBarMenuComponent';
import NavBarComponent from '../NavBar/NavBarComponent';
import NavBarBottomComponent from '../NavBarBottom/NavBarBottomComponent';
import OnPageTranslation from '../OnPageTranslation/component/OnPageTranslation';
import VarsManagerComponent from '../Var/components/manager/VarsManagerComponent';
import VueComponentBase from '../VueComponentBase';
import './DashboardTemplate.scss';

@Component({
    template: require('./DashboardTemplate.pug'),
    components: {
        Navbarcomponent: NavBarComponent,
        Sidebarmenucomponent: SideBarMenuComponent,
        Onpagetranslation: OnPageTranslation,
        Varsmanagercomponent: VarsManagerComponent,
        Feedbackhandlercomponent: FeedbackHandlerComponent,
        Documenthandlermodalcomponent: DocumentHandlerModalComponent,
        Navbarbottomcomponent: NavBarBottomComponent
    }
})
export default class DashboardTemplate extends VueComponentBase {

    @Prop()
    private app_name: string;

    get has_access_to_onpage_translation(): boolean {
        return VueAppController.getInstance().has_access_to_onpage_translation;
    }

    get user(): UserVO {
        return VueAppController.getInstance().data_user;
    }
}