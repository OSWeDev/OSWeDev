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

    private this_uid: number = SortableListComponent.UID++;
    private initialized: boolean = false;

    get this_id(): string {
        if (!this.this_uid) {
            return null;
        }

        return 'sortable_list_' + this.this_uid;
    }

    @Watch('drag_options', { immediate: true })
    private watch_drag_options() {
        if (!this.this_id) {
            return;
        }

        if (!this.drag_options) {
            return;
        }

        if (this.initialized) {
            ConsoleHandler.error('SortableListComponent: drag_options already initialized. Changing drag_options is not supported.');
            return;
        }
        this.initialized = true;

        Sortable.create(
            this.this_id,
            this.drag_options
        );
    }
}