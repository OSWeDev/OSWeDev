import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { field_names } from '../../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageAction } from '../../page/DashboardPageStore';
import './CurrentUserFilterWidgetComponent.scss';

@Component({
    template: require('./CurrentUserFilterWidgetComponent.pug'),
    components: {}
})
export default class CurrentUserFilterWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    /**
     * Watch on page_widget
     *
     * @returns {void}
     */
    @Watch('page_widget', { immediate: true })
    private mounted() {
        this.set_active_field_filter({
            field_id: field_names<UserVO>().id,
            vo_type: UserVO.API_TYPE_ID,
            active_field_filter: filter(UserVO.API_TYPE_ID, field_names<UserVO>().id).by_id(this.data_user.id)
        });
    }
}