import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAjaxCache from '../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import DatatableField from '../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ImageVO from '../../../../shared/modules/Image/vos/ImageVO';
import { ModuleDAOAction } from '../../../ts/components/dao/store/DaoStore';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import AjaxCacheClientController from '../../modules/AjaxCache/AjaxCacheClientController';

@Component({
    template: require('./ImageComponent.pug'),
    components: {}
})
export default class ImageComponent extends VueComponentBase {

    private static __UID: number = 1;

    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @Prop({ default: false })
    protected readonly: boolean;

    @Prop()
    protected field: DatatableField<any, any>;

    @Prop({ default: null })
    protected imagevo: IDistantVOBase;

    @Prop({ default: null })
    protected options: any;

    @Prop({ default: false })
    protected muted: boolean;

    protected uid: number = null;

    get dropzoneOptions() {
        const self = this;


        const onInit = (this.options) ? this.options.init : null;
        const onSuccess = (this.options) ? this.options.success : null;
        const dropoptions = {
            url: '/ModuleImageServer/upload',
            // headers: {
            //     'X-CSRF-Token': AjaxCacheClientController.getInstance().csrf_token,
            // },
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
                    if (onInit) {
                        onInit();
                    }
                } catch (error) {
                    self.snotify.error(self.label('import.server_response_error'));
                    return;
                }
            },
            success: async (infos, res) => {

                try {
                    const newvo: ImageVO = JSON.parse(res);
                    self.storeData(newvo);
                    self.$emit('uploaded', newvo);

                    if (onSuccess) {
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

    @Watch('imagevo')
    public async updateImageVO() {
        const dropzone = (this.$refs['filedropzone' + this.uid] as any);

        if (!dropzone) {
            return;
        }
        dropzone.removeAllFiles();
        if (!this.imagevo) {
            return;
        }

        const path: string = this.imagevo[this.field.module_table_field_id];

        if (!path) {
            return;
        }

        const mock = {
            accepted: true,
            name: path.replace(/^.*[\\/]([^\\/]+)$/, '$1'),
            url: path
        };

        mock.accepted = true;

        dropzone.files.push(mock);
        dropzone.emit('addedfile', mock);
        dropzone.createThumbnailFromUrl(mock, mock.url);
        dropzone.emit('complete', mock);
    }

    public async mounted() {
        this.uid = ImageComponent.__UID++;
    }
}