import { isEqual } from 'lodash';
import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import CMSImageWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CMSImageWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DataFilterOption from '../../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import FileVO from '../../../../../../../shared/modules/File/vos/FileVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import './CMSImageWidgetOptionsComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../../page/DashboardPageStore';

@Component({
    template: require('./CMSImageWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
    }
})
export default class CMSImageWidgetOptionsComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    public file_id: number = null;
    public file_path: string = null;
    public radius: number = null;
    public use_for_template: boolean = false;
    public field_ref_for_template: VOFieldRefVO = null;
    public position: number = null;
    public position_selected: DataFilterOption = null;
    public mise_en_page: number = null;
    public mise_en_page_selected: DataFilterOption = null;

    public position_options: DataFilterOption[] = [
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE_LABEL), CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSImageWidgetOptionsVO.POSITION_CENTRE_GAUCHE_LABEL), CMSImageWidgetOptionsVO.POSITION_CENTRE_GAUCHE),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSImageWidgetOptionsVO.POSITION_CENTRE_DROITE_LABEL), CMSImageWidgetOptionsVO.POSITION_CENTRE_DROITE),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSImageWidgetOptionsVO.POSITION_CENTRE_HAUT_LABEL), CMSImageWidgetOptionsVO.POSITION_CENTRE_HAUT),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSImageWidgetOptionsVO.POSITION_CENTRE_BAS_LABEL), CMSImageWidgetOptionsVO.POSITION_CENTRE_BAS),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSImageWidgetOptionsVO.POSITION_HAUT_GAUCHE_LABEL), CMSImageWidgetOptionsVO.POSITION_HAUT_GAUCHE),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSImageWidgetOptionsVO.POSITION_HAUT_DROITE_LABEL), CMSImageWidgetOptionsVO.POSITION_HAUT_DROITE),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSImageWidgetOptionsVO.POSITION_BAS_GAUCHE_LABEL), CMSImageWidgetOptionsVO.POSITION_BAS_GAUCHE),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSImageWidgetOptionsVO.POSITION_BAS_DROITE_LABEL), CMSImageWidgetOptionsVO.POSITION_BAS_DROITE),
    ];

    public mise_en_page_options: DataFilterOption[] = [
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSImageWidgetOptionsVO.MISE_EN_PAGE_COUVRIR_LABEL), CMSImageWidgetOptionsVO.MISE_EN_PAGE_COUVRIR),
        new DataFilterOption(DataFilterOption.STATE_SELECTABLE, this.label(CMSImageWidgetOptionsVO.MISE_EN_PAGE_CONTENIR_LABEL), CMSImageWidgetOptionsVO.MISE_EN_PAGE_CONTENIR),
    ];

    public next_update_options: CMSImageWidgetOptionsVO = null;
    public throttled_update_options = ThrottleHelper.declare_throttle_without_args('CMSImageWidgetOptionsComponent.update_options', this.update_options.bind(this), 50, false);

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
    public async onchange_position_selected() {
        this.position = this.position_selected?.id;
    }

    @Watch('mise_en_page_selected')
    public async onchange_mise_en_page_selected() {
        this.mise_en_page = this.mise_en_page_selected?.id;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    public async onchange_widget_options() {
        if (!this.widget_options) {
            this.file_id = null;
            this.radius = 0;
            this.file_path = null;
            this.use_for_template = false;
            this.field_ref_for_template = null;
            this.position = CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE;
            this.mise_en_page = CMSImageWidgetOptionsVO.MISE_EN_PAGE_COUVRIR;

            return;
        }
        this.file_id = this.widget_options.file_id;
        this.radius = this.widget_options.radius;
        this.use_for_template = this.widget_options.use_for_template;
        this.field_ref_for_template = this.widget_options.field_ref_for_template ? Object.assign(new VOFieldRefVO(), this.widget_options.field_ref_for_template) : null;
        this.position = this.widget_options.position;
        this.mise_en_page = this.widget_options.mise_en_page;

        if (this.file_id) {
            const file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(this.file_id).select_vo();
            this.file_path = file ? file.path : null;
        }
    }

    @Watch('file_id')
    @Watch('radius')
    @Watch('use_for_template')
    @Watch('field_ref_for_template')
    @Watch('position')
    @Watch('mise_en_page')
    public async onchange_image() {
        if (!this.widget_options) {
            return;
        }

        if (
            this.widget_options.file_id != this.file_id ||
            this.widget_options.radius != this.radius ||
            this.widget_options.use_for_template != this.use_for_template ||
            !isEqual(this.widget_options.field_ref_for_template, this.field_ref_for_template) ||
            this.widget_options.mise_en_page != this.mise_en_page ||
            this.widget_options.position != this.position
        ) {

            this.next_update_options.file_id = this.file_id;
            this.next_update_options.radius = this.radius;
            this.next_update_options.use_for_template = this.use_for_template;
            this.next_update_options.field_ref_for_template = this.field_ref_for_template;
            this.next_update_options.position = this.position;
            this.next_update_options.mise_en_page = this.mise_en_page;

            if (this.file_id) {
                let file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(this.file_id).select_vo();
                this.file_path = file ? file.path : null;
            }

            await this.throttled_update_options();
        }
    }

    public async mounted() {

        if (!this.widget_options) {
            this.next_update_options = this.get_default_options();
        } else {
            this.next_update_options = this.widget_options;
        }

        this.file_id = this.next_update_options.file_id;
        this.radius = this.next_update_options.radius;
        this.use_for_template = this.next_update_options.use_for_template;
        this.field_ref_for_template = this.next_update_options.field_ref_for_template;
        this.position = this.next_update_options.position;
        this.mise_en_page = this.next_update_options.mise_en_page;

        if (this.file_id) {
            const file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(this.file_id).select_vo();
            this.file_path = file ? file.path : null;
        }

        if (!this.position) {
            this.position = CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE;
        }

        if (!this.mise_en_page) {
            this.mise_en_page = CMSImageWidgetOptionsVO.MISE_EN_PAGE_COUVRIR;
        }

        this.position_selected = this.position_options.find((option) => option.id == this.position);
        this.mise_en_page_selected = this.mise_en_page_options.find((option) => option.id == this.mise_en_page);

        await this.throttled_update_options();
    }

    public get_default_options(): CMSImageWidgetOptionsVO {
        return CMSImageWidgetOptionsVO.createNew(
            null,
            0,
            false,
            null,
            CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE,
            CMSImageWidgetOptionsVO.MISE_EN_PAGE_COUVRIR,
        );
    }

    // Accès dynamiques Vuex
    public vuexGet<K extends keyof IDashboardGetters>(getter: K): IDashboardGetters[K] {
        return this.$store.getters[`${this.storeNamespace}/${String(getter)}`];
    }
    public vuexAct<K extends keyof IDashboardPageActionsMethods>(
        action: K,
        ...args: Parameters<IDashboardPageActionsMethods[K]>
    ) {
        this.$store.dispatch(`${this.storeNamespace}/${String(action)}`, ...args);
    }

    public set_page_widget(page_widget: DashboardPageWidgetVO): void {
        this.vuexAct<DashboardPageWidgetVO>(reflect<this>().set_page_widget, page_widget);
    }

    public async update_options() {
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

    public async switch_use_for_template() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        this.next_update_options.use_for_template = !this.next_update_options.use_for_template;

        await this.throttled_update_options();
    }

    public async add_field_ref_for_template(api_type_id: string, field_id: string) {
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

    public async remove_field_ref_for_template() {
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

    public clear_file_path() {
        this.file_id = null;
        this.file_path = null;
    }
}