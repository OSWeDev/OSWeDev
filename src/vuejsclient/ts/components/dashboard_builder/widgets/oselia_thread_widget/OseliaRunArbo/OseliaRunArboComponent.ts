import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import OseliaRunVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunVO';
import VueComponentBase from '../../../../VueComponentBase';
import './OseliaRunArboComponent.scss';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import { field_names, reflect } from '../../../../../../../shared/tools/ObjectHandler';
import { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';

@Component({
    name: 'Oseliarunarbocomponent',
    template: require('./OseliaRunArboComponent.pug'),
    components: {
        Oseliarunarbocomponent: OseliaRunArboComponent
    }
})
export default class OseliaRunArboComponent extends VueComponentBase {

    @Prop({ default: null })
    private thread_id: number;

    @Prop({ default: null })
    private parent_run_id: number;

    @Prop({ default: true })
    private show_weights: boolean;

    public oselia_runs_from_thread_or_parent_run: OseliaRunVO[] = null;

    private show_children: boolean = true;

    private current_thread_id: number = null;
    private current_parent_run_id: number = null;

    private use_only_parent_free_runs: boolean = false;

    private states_labels: { [state: number]: string } = OseliaRunVO.STATE_LABELS;

    private error_states: { [state: number]: boolean } = {
        [OseliaRunVO.STATE_ERROR]: true,
    };
    private rerun_states: { [state: number]: boolean } = {
        [OseliaRunVO.STATE_NEEDS_RERUN]: true,
        [OseliaRunVO.STATE_RERUN_ASKED]: true,
    };
    private encours_states: { [state: number]: boolean } = {
        [OseliaRunVO.STATE_RUNNING]: true,
        [OseliaRunVO.STATE_VALIDATING]: true,
        [OseliaRunVO.STATE_SPLITTING]: true,
        [OseliaRunVO.STATE_WAITING_SPLITS_END]: true,
    };

    private throttled_update_oselia_runs = ThrottleHelper.declare_throttle_without_args(this.update_oselia_runs.bind(this), 100);

    // get has_childrens(): boolean {
    //     return (!!this.oselia_runs) && this.oselia_runs.length > 0;
    // }

    get oselia_runs(): OseliaRunVO[] {

        if (!this.oselia_runs_from_thread_or_parent_run) {
            return null;
        }

        let res = Array.from(this.oselia_runs_from_thread_or_parent_run);

        if (!res) {
            return null;
        }

        if (this.use_only_parent_free_runs) {
            res = res.filter((run) => !run.parent_run_id);
        }

        res.sort((a, b) => a.weight - b.weight);

        return res;
    }

    @Watch('thread_id', { immediate: true })
    @Watch('parent_run_id', { immediate: true })
    private async on_changes() {
        this.throttled_update_oselia_runs();
    }

    private async update_oselia_runs() {

        if (!this.thread_id && !this.parent_run_id) {
            this.oselia_runs_from_thread_or_parent_run = [];
            return;
        }

        if (this.current_thread_id != this.thread_id) {
            this.current_thread_id = this.thread_id;
            this.current_parent_run_id = null;
            await this.unregister_all_vo_event_callbacks();

            if (this.current_thread_id) {
                this.use_only_parent_free_runs = true;
                await this.register_vo_updates_on_list(
                    OseliaRunVO.API_TYPE_ID,
                    reflect<this>().oselia_runs_from_thread_or_parent_run,
                    [filter(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().thread_id).by_num_eq(this.current_thread_id)]
                );
                return;
            }
        }

        if (this.current_thread_id) {
            return;
        }

        if (this.current_parent_run_id != this.parent_run_id) {
            this.current_parent_run_id = this.parent_run_id;

            if (this.current_parent_run_id) {
                this.use_only_parent_free_runs = false;
                await this.register_vo_updates_on_list(
                    OseliaRunVO.API_TYPE_ID,
                    reflect<this>().oselia_runs_from_thread_or_parent_run,
                    [filter(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().parent_run_id).by_num_eq(this.current_parent_run_id)]
                );
                return;
            }
        }
    }
}