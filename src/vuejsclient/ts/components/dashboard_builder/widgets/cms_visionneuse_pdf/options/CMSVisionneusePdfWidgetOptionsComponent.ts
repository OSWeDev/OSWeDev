import { isEqual } from 'lodash';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSVisionneusePdfWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSVisionneusePdfWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import FileVO from '../../../../../../../shared/modules/File/vos/FileVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import './CMSVisionneusePdfWidgetOptionsComponent.scss';
import AjaxCacheClientController from '../../../../../modules/AjaxCache/AjaxCacheClientController';

@Component({
    template: require('./CMSVisionneusePdfWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
    }
})
export default class CMSVisionneusePdfWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private file_id: number = null;
    private file_path: string = null;
    private use_for_template: boolean = false;
    private field_ref_for_template: VOFieldRefVO = null;

    private next_update_options: CMSVisionneusePdfWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    get widget_options(): CMSVisionneusePdfWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSVisionneusePdfWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSVisionneusePdfWidgetOptionsVO;
                options = options ? new CMSVisionneusePdfWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get dropzoneOptions() {
        let self = this;

        return {
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
            },
            success: async (infos, res) => {

                try {
                    const newvo: FileVO = JSON.parse(res);

                    if (!newvo) {
                        return;
                    }

                    this.file_id = newvo.id;

                    await ModuleDAO.getInstance().insertOrUpdateVO(newvo);

                    (self.$refs['filedropzone'] as any).removeAllFiles();
                } catch (error) {
                    self.snotify.error(self.label('import.server_response_error'));
                    return;
                }
            }
        };
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.file_id = null;
            this.file_path = null;
            this.use_for_template = false;
            this.field_ref_for_template = null;

            return;
        }
        this.file_id = this.widget_options.file_id;
        this.use_for_template = this.widget_options.use_for_template;
        this.field_ref_for_template = this.widget_options.field_ref_for_template ? Object.assign(new VOFieldRefVO(), this.widget_options.field_ref_for_template) : null;

        if (this.file_id) {
            const file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(this.file_id).select_vo();
            this.file_path = file ? file.path : null;
        }
    }

    @Watch('file_id')
    @Watch('use_for_template')
    @Watch('field_ref_for_template')
    private async onchange_image() {
        if (!this.widget_options) {
            return;
        }

        if (
            this.widget_options.file_id != this.file_id ||
            this.widget_options.use_for_template != this.use_for_template ||
            !isEqual(this.widget_options.field_ref_for_template, this.field_ref_for_template)
        ) {

            this.next_update_options.file_id = this.file_id;
            this.next_update_options.use_for_template = this.use_for_template;
            this.next_update_options.field_ref_for_template = this.field_ref_for_template;

            if (this.file_id) {
                const file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(this.file_id).select_vo();
                this.file_path = file ? file.path : null;
            }

            await this.throttled_update_options();
        }
    }

    private async mounted() {

        if (!this.widget_options) {
            this.next_update_options = this.get_default_options();
        } else {
            this.next_update_options = this.widget_options;
        }

        this.file_id = this.next_update_options.file_id;
        this.use_for_template = this.next_update_options.use_for_template;
        this.field_ref_for_template = this.next_update_options.field_ref_for_template;

        if (this.file_id) {
            const file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(this.file_id).select_vo();
            this.file_path = file ? file.path : null;
        }

        await this.throttled_update_options();
    }

    private get_default_options(): CMSVisionneusePdfWidgetOptionsVO {
        return CMSVisionneusePdfWidgetOptionsVO.createNew(
            null,
            false,
            null,
        );
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        if (!this.widget_options) {
            return;
        }

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);
    }

    private async switch_use_for_template() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.use_for_template = !this.next_update_options.use_for_template;

        await this.throttled_update_options();
    }

    private async add_field_ref_for_template(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        const vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options.field_ref_for_template = vo_field_ref;

        await this.throttled_update_options();
    }

    private async remove_field_ref_for_template() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.field_ref_for_template) {
            return null;
        }

        this.next_update_options.field_ref_for_template = null;

        await this.throttled_update_options();
    }

    private clear_file_path() {
        this.file_id = null;
        this.file_path = null;
    }
}