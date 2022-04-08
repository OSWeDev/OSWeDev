import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../../../../../shared/modules/File/vos/FileVO';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import './file_datatable_field.scss';

@Component({
    template: require('./file_datatable_field.pug'),
    components: {}
})
export default class FileDatatableFieldComponent extends VueComponentBase {
    @Prop({ default: null })
    public file_id: number;

    @Prop({ default: null })
    public file_path: string;

    private file: FileVO = null;
    private loaded: boolean = false;

    private throttled_load_file = ThrottleHelper.getInstance().declare_throttle_without_args(this.load_file.bind(this), 100);

    @Watch('file_id', { immediate: true })
    @Watch('file_path')
    private onchange_file() {
        if (this.loaded) {
            this.loaded = false;
        }
        this.throttled_load_file();
    }

    private async load_file() {

        if ((!this.file_id) && (!this.file_path)) {
            this.file = null;
            this.loaded = true;
            return null;
        }

        this.file = this.file_id ?
            await query(FileVO.API_TYPE_ID).filter_by_id(this.file_id).select_vo() :
            await query(FileVO.API_TYPE_ID).filter_by_text_eq('path', this.file_path).select_vo();

        if (!this.loaded) {
            this.loaded = true;
        }
    }
}