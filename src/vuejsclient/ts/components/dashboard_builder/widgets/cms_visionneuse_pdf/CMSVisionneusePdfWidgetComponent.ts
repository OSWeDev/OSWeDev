import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VueComponentBase from '../../../VueComponentBase';
import './CMSVisionneusePdfWidgetComponent.scss';
import CMSVisionneusePdfWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSVisionneusePdfWidgetOptionsVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleTableFieldVO from '../../../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableFieldController from '../../../../../../shared/modules/DAO/ModuleTableFieldController';
import {
    PdfViewerComponent, Toolbar, Magnification, Navigation, LinkAnnotation,
    BookmarkView, ThumbnailView, Print, TextSelection, TextSearch,
    Annotation, FormDesigner, FormFields, PageOrganizer
} from '@syncfusion/ej2-vue-pdfviewer';

@Component({
    template: require('./CMSVisionneusePdfWidgetComponent.pug'),
    components: {
        "ejs-pdfviewer": PdfViewerComponent,
    }
})
export default class CMSVisionneusePdfWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    @ModuleDashboardPageGetter
    private get_cms_vo: IDistantVOBase;

    private file_id: number = null;
    private file_path: string = null;
    private use_for_template: boolean = false;
    private field_ref_for_template: VOFieldRefVO = null;

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

    @Watch('get_cms_vo')
    private async onchange_get_cms_vo() {
        this.file_path = await this.get_value(this.widget_options.file_id, this.widget_options.field_ref_for_template);
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
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

    private async mounted() {
        this.onchange_widget_options();
    }

    private async get_value(data: any, field_ref: VOFieldRefVO): Promise<string> {
        if (!this.widget_options.use_for_template) {
            if (data) {
                const file: FileVO = await query(FileVO.API_TYPE_ID).filter_by_id(data).select_vo();
                return file ? file.path : null;
            }

            return null;
        }

        if (this.get_cms_vo && field_ref?.field_id && this.get_cms_vo[field_ref.field_id]) {
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

                    file = await query(field.foreign_ref_vo_type).filter_by_id(this.get_cms_vo[field_ref.field_id]).select_vo();
                    return file ? file.path : null;

                case ModuleTableFieldVO.FIELD_TYPE_file_field:
                case ModuleTableFieldVO.FIELD_TYPE_string:
                    // on retourne le chemin absolu du fichier base-url + path auquel on retire le ./
                    return this.get_cms_vo[field_ref.field_id];
            }
        }

        return null;
    }
}