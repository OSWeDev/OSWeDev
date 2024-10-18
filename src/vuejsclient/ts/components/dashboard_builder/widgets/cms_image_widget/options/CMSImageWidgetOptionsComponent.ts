import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSImageWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSImageWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import './CMSImageWidgetOptionsComponent.scss';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../../../../../shared/modules/File/vos/FileVO';
import AjaxCacheClientController from '../../../../../modules/AjaxCache/AjaxCacheClientController';

@Component({
    template: require('./CMSImageWidgetOptionsComponent.pug')
})
export default class CMSImageWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private file_id: number = null;
    private file_path: string = null;
    private radius: number = null;
    private position: string = null;
    private position_selected: string = null;
    private mise_en_page: string = null;
    private mise_en_page_selected: string = null;

    private position_options: string[] = [
        this.label(CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE),
        this.label(CMSImageWidgetOptionsVO.POSITION_CENTRE_GAUCHE),
        this.label(CMSImageWidgetOptionsVO.POSITION_CENTRE_DROITE),
        this.label(CMSImageWidgetOptionsVO.POSITION_CENTRE_HAUT),
        this.label(CMSImageWidgetOptionsVO.POSITION_HAUT_GAUCHE),
        this.label(CMSImageWidgetOptionsVO.POSITION_HAUT_DROITE),
        this.label(CMSImageWidgetOptionsVO.POSITION_BAS_GAUCHE),
        this.label(CMSImageWidgetOptionsVO.POSITION_BAS_DROITE),
    ];

    private mise_en_page_options: string[] = [
        this.label(CMSImageWidgetOptionsVO.MISE_EN_PAGE_DEFAUT),
        this.label(CMSImageWidgetOptionsVO.MISE_EN_PAGE_COUVRIR),
        this.label(CMSImageWidgetOptionsVO.MISE_EN_PAGE_CONTENIR),
    ];

    private next_update_options: CMSImageWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    get widget_options(): CMSImageWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSImageWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSImageWidgetOptionsVO;
                options = options ? new CMSImageWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    get img_path(): string {
        return this.file_path ? this.file_path : null;
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
                    let newvo: FileVO = JSON.parse(res);

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

    @Watch('position_selected')
    private async onchange_position_selected() {
        this.position = this.position_selected;
    }

    @Watch('mise_en_page_selected')
    private async onchange_mise_en_page_selected() {
        this.mise_en_page = this.mise_en_page_selected;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.file_id = null;
            this.radius = 0;
            this.file_path = null;
            this.position = this.label(CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE);
            this.mise_en_page = this.label(CMSImageWidgetOptionsVO.MISE_EN_PAGE_DEFAUT);

            return;
        }
        this.file_id = this.widget_options.file_id;
        this.radius = this.widget_options.radius;
        this.position = this.widget_options.position;
        this.mise_en_page = this.widget_options.mise_en_page;

        if (this.file_id) {
            const file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(this.file_id).select_vo();
            this.file_path = file ? file.path : null;
        }
    }

    @Watch('file_id')
    @Watch('radius')
    @Watch('position')
    @Watch('mise_en_page')
    private async onchange_image() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.file_id != this.file_id ||
            this.widget_options.position != this.position ||
            this.widget_options.mise_en_page != this.mise_en_page ||
            this.widget_options.radius != this.radius) {

            this.next_update_options.file_id = this.file_id;
            this.next_update_options.radius = this.radius;
            this.next_update_options.position = this.position;
            this.next_update_options.mise_en_page = this.mise_en_page;

            if (this.file_id) {
                let file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(this.file_id).select_vo();
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
        this.radius = this.next_update_options.radius;
        if (this.file_id) {
            const file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(this.file_id).select_vo();
            this.file_path = file ? file.path : null;
        }

        this.position_selected = this.next_update_options?.position ? this.next_update_options.position : this.label(CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE);
        this.mise_en_page_selected = this.next_update_options?.mise_en_page ? this.next_update_options.mise_en_page : this.label(CMSImageWidgetOptionsVO.MISE_EN_PAGE_DEFAUT);

        await this.throttled_update_options();
    }

    private get_default_options(): CMSImageWidgetOptionsVO {
        return CMSImageWidgetOptionsVO.createNew(
            null,
            0,
            this.label(CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE),
            this.label(CMSImageWidgetOptionsVO.MISE_EN_PAGE_DEFAUT),
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

}