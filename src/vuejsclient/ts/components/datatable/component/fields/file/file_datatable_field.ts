import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DatatableField from '../../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import FileVO from '../../../../../../../shared/modules/File/vos/FileVO';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import DatatableRowController from '../../DatatableRowController';
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

    @Prop({ default: false })
    public show_tooltip: boolean;

    @Prop({ default: null })
    public button_label: string;

    @Prop({ default: false })
    public show_file_name: boolean;

    @Prop()
    private vo_id: number;

    @Prop()
    private field: DatatableField<any, any>;

    private loaded: boolean = false;
    private path: string = null;
    private file_name: string = null;
    private file_name_no_extension: string = null;


    private throttled_load_file = ThrottleHelper.declare_throttle_without_args(this.load_file.bind(this), 100);

    @Watch('file_id', { immediate: true })
    @Watch('file_path')
    private onchange_file() {
        if (this.loaded) {
            this.loaded = false;
        }
        this.throttled_load_file();
    }

    private async load_file() {
        this.path = null;

        if ((!this.file_id) && (!this.file_path)) {
            this.loaded = true;
            return null;
        }

        let file: FileVO = null;

        if (this.file_id) {
            file = await query(FileVO.API_TYPE_ID).filter_by_id(this.file_id).select_vo();
        }

        if (file) {
            this.path = file.path;
        } else {
            this.path = this.file_path;
        }

        if (this.path) {
            this.file_name = decodeURIComponent(this.path.substring(this.path.lastIndexOf('/') + 1));
            this.file_name_no_extension = this.file_name.substring(0, this.file_name.lastIndexOf('.'));
        }

        if (!this.loaded) {
            this.loaded = true;
        }
    }

    /**
     * On appelle le callback si ça existe
     */
    private async cb_download() {
        if (!this.vo_id || !this.field) {
            return;
        }

        if (
            DatatableRowController.cb_file_download[this.field.vo_type_id] &&
            DatatableRowController.cb_file_download[this.field.vo_type_id][this.field.module_table_field_id]
        ) {
            await DatatableRowController.cb_file_download[this.field.vo_type_id][this.field.module_table_field_id](this.vo_id);
        }
    }
}