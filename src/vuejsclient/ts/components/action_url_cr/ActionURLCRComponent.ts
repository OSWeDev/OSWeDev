import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ActionURLVO from '../../../../shared/modules/ActionURL/vos/ActionURLVO';
import ActionURLCRVO from '../../../../shared/modules/ActionURL/vos/ActionURLCRVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './ActionURLCRComponent.scss';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import { field_names } from '../../../../shared/tools/ObjectHandler';

@Component({
    template: require('./ActionURLCRComponent.pug'),
    components: {}
})
export default class ActionURLCRComponent extends VueComponentBase {

    @Prop({ default: null })
    private action_url_id: number;

    private action_url: ActionURLVO = null;
    private action_crs: ActionURLCRVO[] = null;
    private error_message: string = null;

    private throttle_load_action_url: () => void = ThrottleHelper.declare_throttle_without_args(this.load_action_url, 100);

    @Watch('action_url_id', { immediate: true })
    private async onchange_action_url_id() {
        this.throttle_load_action_url();
    }

    private async load_action_url() {

        if (!this.action_url_id) {
            this.action_crs = null;
            this.action_url = null;
            return;
        }

        const action_url = await query(ActionURLVO.API_TYPE_ID)
            .filter_by_id(this.action_url_id)
            .select_vo<ActionURLVO>();
        if (!action_url) {
            this.error_message = this.label('action_url.not_found');
            this.action_url = null;
            return;
        }

        this.action_url = action_url;
        this.action_crs = await query(ActionURLCRVO.API_TYPE_ID).filter_by_id(action_url.id, ActionURLVO.API_TYPE_ID).set_sort(new SortByVO(ActionURLCRVO.API_TYPE_ID, field_names<ActionURLCRVO>().ts, false)).select_vos<ActionURLCRVO>();
    }
}