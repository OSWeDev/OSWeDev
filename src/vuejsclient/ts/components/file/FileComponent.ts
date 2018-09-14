import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import { ModuleDAOAction } from '../../../ts/components/dao/store/DaoStore';
import VueComponentBase from '../../../ts/components/VueComponentBase';

@Component({
    template: require('./FileComponent.pug'),
    components: {}
})
export default class FileComponent extends VueComponentBase {

    private static __UID: number = 1;

    // @ModuleDAOGetter
    // public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @Prop({ default: false })
    protected readonly: boolean;

    @Prop({ default: null })
    protected filevo: FileVO;

    @Prop({ default: null })
    protected options: any;

    @Prop({ default: false })
    protected muted: boolean;

    // protected uploading: boolean = false;
    // protected datafile = null;

    protected uid: number = null;

    @Watch('filevo')
    public async updateFileVo() {
        let dropzone = (this.$refs['filedropzone' + this.uid] as any);
        dropzone.removeAllFiles();
        if (!this.filevo) {
            return;
        }

        var mock = {
            accepted: true,
            name: this.filevo.path.replace(/^.*[\\/]([^\\/]+)$/, '$1'),
            url: this.filevo.path
        };

        mock.accepted = true;

        dropzone.files.push(mock);
        dropzone.emit('addedfile', mock);
        dropzone.createThumbnailFromUrl(mock, mock.url);
        dropzone.emit('complete', mock);
        // this.isLoading = true;
        // this.uploading = false;

        // if (this.filevoid && ((!this.getStoredDatas[FileVO.API_TYPE_ID]) || (!this.getStoredDatas[FileVO.API_TYPE_ID][this.filevoid]))) {
        //     this.storeData(await ModuleDAO.getInstance().getVoById(FileVO.API_TYPE_ID, this.filevoid));
        // }

        // if (!this.filevoid) {
        //     this.filevo = null;
        // } else {
        //     this.filevo = (this.getStoredDatas[FileVO.API_TYPE_ID] ? this.getStoredDatas[FileVO.API_TYPE_ID][this.filevoid] : null) as FileVO;
        // }
        // this.isLoading = false;
    }

    public async mounted() {
        this.uid = FileComponent.__UID++;
        // await this.updateFileVo();
    }

    // /**
    //  * On lance l'upload
    //  * @param selector Selecteur CSS du input type file
    //  */
    // protected async importFile(selector: string): Promise<void> {

    //     this.uploading = true;

    //     let fileVO: FileVO = await FileComponentManager.uploadFileVO('#file_import_input');
    //     if (!fileVO) {
    //         this.uploading = false;
    //         this.snotify.error('Erreur lors de l\'upload');
    //         return;
    //     }
    //     this.$emit('uploaded', fileVO);
    //     this.uploading = false;
    //     return;
    // }

    get dropzoneOptions() {
        let self = this;


        let onInit = (!!this.options) ? this.options.init : null;
        let onSuccess = (!!this.options) ? this.options.success : null;
        let dropoptions = {
            url: '/ModuleFileServer/upload',
            createImageThumbnails: true,
            maxFiles: 1,
            clickable: true,
            dictDefaultMessage: self.label('dropzone.dictDefaultMessage'),
            dictFallbackMessage: self.label('dropzone.dictFallbackMessage'),
            dictFallbackText: self.label('dropzone.dictFallbackText'),
            dictFileTooBig: self.label('dropzone.dictFileTooBig'),
            dictInvalidFileType: self.label('dropzone.dictInvalidFileType'),
            dictResponseError: self.label('dropzone.dictResponseError'),
            dictCancelUpload: self.label('dropzone.dictCancelUpload'),
            dictUploadCanceled: self.label('dropzone.dictUploadCanceled'),
            dictCancelUploadConfirmation: self.label('dropzone.dictCancelUploadConfirmation'),
            dictRemoveFile: self.label('dropzone.dictRemoveFile'),
            dictRemoveFileConfirmation: self.label('dropzone.dictRemoveFileConfirmation'),
            dictMaxFilesExceeded: self.label('dropzone.dictMaxFilesExceeded'),
            dictFileSizeUnits: self.label('dropzone.dictFileSizeUnits'),
            init: function () {

                this.on('maxfilesexceeded', function (file) {
                    this.removeAllFiles();
                    this.addFile(file);
                });

                try {
                    if (!!onInit) {
                        onInit();
                    }
                } catch (error) {
                    self.snotify.error(self.label('import.server_response_error'));
                    return;
                }
            },
            success: async (infos, res) => {

                try {
                    let newvo = JSON.parse(res);
                    self.storeData(newvo);
                    self.$emit('uploaded', newvo);

                    if (!!onSuccess) {
                        onSuccess(infos, res);
                    }
                } catch (error) {
                    self.snotify.error(self.label('import.server_response_error'));
                    return;
                }
            }
        };

        return Object.assign(dropoptions, this.options);
    }
}