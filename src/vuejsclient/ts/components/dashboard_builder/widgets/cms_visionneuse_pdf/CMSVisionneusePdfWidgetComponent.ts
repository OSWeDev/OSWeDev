import Component from 'vue-class-component';
import { Inject, Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleTableFieldController from '../../../../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import CMSVisionneusePdfWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSVisionneusePdfWidgetOptionsVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { reflect } from '../../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../VueComponentBase';
import './CMSVisionneusePdfWidgetComponent.scss';
import { IDashboardGetters, IDashboardPageActionsMethods, IDashboardPageConsumer } from '../../page/DashboardPageStore';

@Component({
    template: require('./CMSVisionneusePdfWidgetComponent.pug'),
    components: {}
})
export default class CMSVisionneusePdfWidgetComponent extends VueComponentBase implements IDashboardPageConsumer {
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
    public use_for_template: boolean = false;
    public field_ref_for_template: VOFieldRefVO = null;

    public pdfjs_viewer: string = '/public/client/js/pdfjs/web/viewer.html?file=';

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

    get get_crud_vo(): IDistantVOBase {
        return this.vuexGet(reflect<this>().get_crud_vo);
    }

    @Watch('get_crud_vo')
    public async onchange_get_crud_vo() {
        this.file_path = await this.get_value(this.widget_options.file_id, this.widget_options.field_ref_for_template);
    }

    @Watch('widget_options', { immediate: true, deep: true })
    public async onchange_widget_options() {
        if (!this.widget_options) {
            this.file_id = null;
            this.use_for_template = false;
            this.field_ref_for_template = null;
            return;
        }

        this.file_id = this.widget_options.file_id;
        this.use_for_template = this.widget_options.use_for_template;
        this.field_ref_for_template = this.widget_options.field_ref_for_template;

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
                return file?.path ? (this.pdfjs_viewer + '' + file.path.replace('./', '/')) : null;
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
            ];

            switch (field.field_type) {
                case ModuleTableFieldVO.FIELD_TYPE_foreign_key:
                case ModuleTableFieldVO.FIELD_TYPE_file_ref:
                    if (!available_api_type_ids.includes(field.foreign_ref_vo_type)) {
                        return null;
                    }

                    file = await query(field.foreign_ref_vo_type).filter_by_id(this.get_crud_vo[field_ref.field_id]).select_vo();
                    return file?.path ? (this.pdfjs_viewer + '' + file.path.replace('./', '/')) : null;

                case ModuleTableFieldVO.FIELD_TYPE_file_field:
                case ModuleTableFieldVO.FIELD_TYPE_string:
                    // on retourne le chemin absolu du fichier base-url + path auquel on retire le ./
                    return (this.pdfjs_viewer + '' + this.get_crud_vo[field_ref.field_id].replace('./', '/'));
            }
        }

        return null;
    }
}