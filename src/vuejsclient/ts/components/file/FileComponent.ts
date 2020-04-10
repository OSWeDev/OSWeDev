import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAjaxCache from '../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleFile from '../../../../shared/modules/File/ModuleFile';
import FileVO from '../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import { ModuleDAOAction } from '../../../ts/components/dao/store/DaoStore';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import AjaxCacheClientController from '../../modules/AjaxCache/AjaxCacheClientController';

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

    protected has_valid_file_linked: boolean = false;

    protected uid: number = null;

    @Watch('filevo', { immediate: true })
    public async updateFileVo() {
        this.has_valid_file_linked = false;
        if (this.filevo && this.filevo.id) {
            this.has_valid_file_linked = await ModuleFile.getInstance().testFileExistenz(this.filevo.id);
        }

        let dropzone = (this.$refs['filedropzone' + this.uid] as any);

        if (!dropzone) {
            return;
        }
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
    }

    public async mounted() {
        this.uid = FileComponent.__UID++;
    }

    get dropzoneOptions() {
        let self = this;


        let onInit = (!!this.options) ? this.options.init : null;
        let onSuccess = (!!this.options) ? this.options.success : null;
        let dropoptions = {
            url: '/ModuleFileServer/upload',
            headers: {
                'X-CSRF-Token': AjaxCacheClientController.getInstance().csrf_token,
            },
            createImageThumbnails: true,
            maxFiles: 1,
            clickable: true,
            timeout: 3600000,
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

                    if (!!self.storeData) {
                        self.storeData(newvo);
                    }
                    self.$emit('uploaded', newvo);

                    if (!!onSuccess) {
                        onSuccess(infos, res);
                    }
                    (self.$refs['filedropzone' + this.uid] as any).removeAllFiles();
                } catch (error) {
                    self.snotify.error(self.label('import.server_response_error'));
                    return;
                }
            }
        };

        return Object.assign(dropoptions, this.options);
    }
}