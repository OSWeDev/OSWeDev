import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableFieldController from '../../../../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import CMSImageWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSImageWidgetOptionsVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ImageVO from '../../../../../../shared/modules/Image/vos/ImageVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import './CMSImageWidgetComponent.scss';
import { reflect } from '../../../../../../shared/tools/ObjectHandler';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../page/DashboardPageStore';

@Component({
    template: require('./CMSImageWidgetComponent.pug'),
    components: {}
})
export default class CMSImageWidgetComponent extends VueComponentBase implements IDashboardPageConsumer {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    public all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    public dashboard: DashboardVO;

    @Prop({ default: null })
    public dashboard_page: DashboardPageVO;

    public file_id: number = null;
    public file_path: string = null;
    public radius: number = null;
    public use_for_template: boolean = false;
    public field_ref_for_template: VOFieldRefVO = null;
    public mise_en_page: number = null;
    public position: number = null;

    get get_crud_vo(): IDistantVOBase {
        return this.vuexGet(reflect<this>().get_crud_vo);
    }

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

    get widget_style() {
        const res = {};

        if (this.radius) {
            res['borderRadius'] = this.radius + '%';
        }

        if (this.img_path) {
            res['backgroundImage'] = 'url("' + this.img_path + '")';
        }

        if (this.mise_en_page) {
            switch (this.mise_en_page) {
                case CMSImageWidgetOptionsVO.MISE_EN_PAGE_COUVRIR:
                    res['backgroundSize'] = 'cover';
                    break;
                case CMSImageWidgetOptionsVO.MISE_EN_PAGE_CONTENIR:
                    res['backgroundSize'] = 'contain';
                    break;
            }
        }

        if (this.position) {
            switch (this.position) {
                case CMSImageWidgetOptionsVO.POSITION_CENTRE_CENTRE:
                    res['backgroundPosition'] = 'center center';
                    break;
                case CMSImageWidgetOptionsVO.POSITION_CENTRE_GAUCHE:
                    res['backgroundPosition'] = 'center left';
                    break;
                case CMSImageWidgetOptionsVO.POSITION_CENTRE_DROITE:
                    res['backgroundPosition'] = 'center right';
                    break;
                case CMSImageWidgetOptionsVO.POSITION_CENTRE_HAUT:
                    res['backgroundPosition'] = 'center top';
                    break;
                case CMSImageWidgetOptionsVO.POSITION_CENTRE_BAS:
                    res['backgroundPosition'] = 'center bottom';
                    break;
                case CMSImageWidgetOptionsVO.POSITION_HAUT_GAUCHE:
                    res['backgroundPosition'] = 'left top';
                    break;
                case CMSImageWidgetOptionsVO.POSITION_HAUT_DROITE:
                    res['backgroundPosition'] = 'right top';
                    break;
                case CMSImageWidgetOptionsVO.POSITION_BAS_GAUCHE:
                    res['backgroundPosition'] = 'left bottom';
                    break;
                case CMSImageWidgetOptionsVO.POSITION_BAS_DROITE:
                    res['backgroundPosition'] = 'right bottom';
                    break;
            }
        }

        return res;
    }

    @Watch('get_crud_vo')
    public async onchange_get_crud_vo() {
        this.file_path = await this.get_value(this.widget_options.file_id, this.widget_options.field_ref_for_template);
    }

    @Watch('widget_options', { immediate: true, deep: true })
    public async onchange_widget_options() {
        if (!this.widget_options) {
            this.file_id = null;
            this.radius = null;
            this.use_for_template = false;
            this.field_ref_for_template = null;
            return;
        }

        this.file_id = this.widget_options.file_id;
        this.radius = this.widget_options.radius;
        this.use_for_template = this.widget_options.use_for_template;
        this.field_ref_for_template = this.widget_options.field_ref_for_template;
        this.mise_en_page = this.widget_options.mise_en_page;
        this.position = this.widget_options.position;

        this.file_path = await this.get_value(this.widget_options.file_id, this.widget_options.field_ref_for_template);
    }

    public async mounted() {
        this.onchange_widget_options();
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

    public async get_value(data: any, field_ref: VOFieldRefVO): Promise<string> {
        if (!this.widget_options.use_for_template) {
            if (data) {
                const file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(data).select_vo();
                return file ? file.path : null;
            }

            return null;
        }

        if (this.get_crud_vo && field_ref?.field_id && this.get_crud_vo[field_ref.field_id]) {
            const field: ModuleTableFieldVO = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[field_ref.api_type_id][field_ref.field_id];

            if (!field) {
                return null;
            }

            let file: FileVO = null;
            const available_api_type_ids: string[] = [
                FileVO.API_TYPE_ID,
                ImageVO.API_TYPE_ID
            ];

            switch (field.field_type) {
                case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                case ModuleTableFieldVO.FIELD_TYPE_image_ref:
                case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    if (!available_api_type_ids.includes(field.foreign_ref_vo_type)) {
                        return null;
                    }

                    file = await query(field.foreign_ref_vo_type).filter_by_id(this.get_crud_vo[field_ref.field_id]).select_vo();
                    return file ? file.path : null;

                case ModuleTableFieldVO.FIELD_TYPE_file_field:
                case ModuleTableFieldVO.FIELD_TYPE_image_field:
                case ModuleTableFieldVO.FIELD_TYPE_string:
                    return this.get_crud_vo[field_ref.field_id];
            }
        }

        return null;
    }
}