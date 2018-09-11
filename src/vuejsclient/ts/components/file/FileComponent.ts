import * as $ from 'jquery';
import Component from 'vue-class-component';
import ModuleAjaxCache from '../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import { Prop, Watch } from 'vue-property-decorator';
import VueAppBase from '../../../VueAppBase';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import { ModuleDAOGetter, ModuleDAOAction } from '../../../ts/components/dao/store/DaoStore';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import FileComponentManager from './FileComponentManager';


@Component({
    template: require('./FileComponent.pug'),
    components: {}
})
export default class FileComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @Prop()
    protected filevoid: number;
    @Prop({ default: false })
    protected readonly: boolean;

    protected uploading: boolean = false;
    protected datafile = null;

    protected filevo: FileVO = null;

    @Watch('filevoid')
    public async updateFileVo() {
        this.isLoading = true;
        this.uploading = false;

        if (this.filevoid && ((!this.getStoredDatas[FileVO.API_TYPE_ID]) || (!this.getStoredDatas[FileVO.API_TYPE_ID][this.filevoid]))) {
            this.storeData(await ModuleDAO.getInstance().getVoById(FileVO.API_TYPE_ID, this.filevoid));
        }

        if (!this.filevoid) {
            this.filevo = null;
        } else {
            this.filevo = (this.getStoredDatas[FileVO.API_TYPE_ID] ? this.getStoredDatas[FileVO.API_TYPE_ID][this.filevoid] : null) as FileVO;
        }
        this.isLoading = false;
    }

    public async mounted() {

        await this.updateFileVo();
    }

    /**
     * On lance l'upload
     * @param selector Selecteur CSS du input type file
     */
    protected async importFile(selector: string): Promise<void> {

        this.uploading = true;

        let fileVO: FileVO = await FileComponentManager.uploadFileVO('#file_import_input');
        if (!fileVO) {
            this.uploading = false;
            this.snotify.error('Erreur lors de l\'upload');
            return;
        }
        this.$emit('uploaded', fileVO);
        this.uploading = false;
        return;
    }
}