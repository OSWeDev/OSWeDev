import * as $ from 'jquery';
import Component from 'vue-class-component';
import ModuleAjaxCache from '../../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import FileVO from '../../../../../shared/modules/File/vos/FileVO';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import { Prop, Watch } from 'vue-property-decorator';
import VueAppBase from '../../../../VueAppBase';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import { ModuleDAOGetter, ModuleDAOAction } from '../../../../ts/components/dao/store/DaoStore';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';


@Component({
    template: require('./FileAdminVueBase.pug'),
    components: {}
})
export default class FileAdminVueBase extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @Prop()
    protected filevoid: number;

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

        try {

            if (!this.hasFileInputData(selector)) {
                this.uploading = false;
                return;
            }
            let file: File = $(selector)[0]['files'][0];

            let formData = new FormData();
            formData.append('file', file);

            let fileVO: FileVO = await ModuleAjaxCache.getInstance().post(
                '/modules/ModuleFile/UploadFile',
                [FileVO.API_TYPE_ID],
                formData,
                null,
                null,
                false,
                30000) as FileVO;

            if (!fileVO) {
                this.uploading = false;
                this.snotify.error('Erreur lors de l\'upload. Merci de recharger la page');
                return;
            }

            this.$emit('uploaded', fileVO);
        } catch (error) {
            if (error && error.statusText == "timeout") {
                this.snotify.warning('Upload trop long. Merci de recharger la page');
            }
        }
        this.uploading = false;
        return;
    }

    protected hasFileInputData(selector: string): boolean {
        return $(selector) && $(selector)[0] && $(selector)[0]['files'] && $(selector)[0]['files'][0];
    }
}