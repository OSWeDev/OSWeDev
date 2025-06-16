import Component from 'vue-class-component';
import { Inject } from 'vue-property-decorator';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { field_names, reflect } from '../../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../VueComponentBase';
import './CurrentUserFilterWidgetComponent.scss';

@Component({
    template: require('./CurrentUserFilterWidgetComponent.pug'),
    components: {}
})
export default class CurrentUserFilterWidgetComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_active_field_filter(param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) {
        return this.vuexAct(reflect<this>().set_active_field_filter, param);
    }

    private mounted() {
        this.set_active_field_filter({
            field_id: field_names<UserVO>().id,
            vo_type: UserVO.API_TYPE_ID,
            active_field_filter: filter(UserVO.API_TYPE_ID, field_names<UserVO>().id).by_id(this.data_user.id)
        });
    }
}