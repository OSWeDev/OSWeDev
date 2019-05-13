import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import FileVO from '../../../../../../../shared/modules/File/vos/FileVO';
import FileComponent from '../../../../file/FileComponent';
import VueComponentBase from '../../../../VueComponentBase';
import './file_datatable_field.scss';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';

@Component({
    template: require('./file_datatable_field.pug'),
    components: {
        FileComponent
    }
})
export default class FileDatatableFieldComponent extends VueComponentBase {
    @Prop()
    public file_id: number;

    private file: FileVO = null;

    @Watch('file_id')
    private async  load_file() {
        if (!this.file_id) {
            this.file = null;
            return null;
        }

        this.file = await ModuleDAO.getInstance().getVoById<FileVO>(FileVO.API_TYPE_ID, this.file_id);
    }
}