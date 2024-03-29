import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import 'vue-slider-component/theme/default.css';
import VueComponentBase from '../VueComponentBase';
import './SortableListComponent.scss';
import Sortable from 'sortablejs';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';

@Component({
    template: require('./SortableListComponent.pug'),
    components: {
    }
})
export default class SortableListComponent extends VueComponentBase {

    private static UID: number = 1;

    @Prop({ default: null })
    private drag_options: string;

    @Prop({ default: null })
    private elts: any[];

    @Prop()
    private get_elt_id: (elt: any) => number;

    @Prop({ default: null })
    private list_id: string;

    @Prop({ default: false })
    private disabled: boolean;

    private this_uid: number = SortableListComponent.UID++;
    private initialized: boolean = false;
    private is_mounted: boolean = false;

    get this_id(): string {
        if (!this.this_uid) {
            return null;
        }

        return 'sortable_list_' + this.this_uid;
    }

    private mounted() {
        this.is_mounted = true;
        this.watch_drag_options();
    }

    @Watch('drag_options', { immediate: true })
    private watch_drag_options() {
        if (!this.this_id) {
            return;
        }

        if (!this.drag_options) {
            return;
        }

        if (!this.is_mounted) {
            return;
        }

        if (this.initialized) {
            ConsoleHandler.error('SortableListComponent: drag_options already initialized. Changing drag_options is not supported.');
            return;
        }
        this.initialized = true;

        if (!this.disabled) {
            Sortable.create(
                this.$el as any,
                this.drag_options
            );
        }
    }
}