/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardWidgetTagVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetTagVO';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import RangeHandler from '../../../shared/tools/RangeHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250717AddWidgetsTags implements IGeneratorWorker {


    private static instance: Patch20250717AddWidgetsTags = null;
    private constructor() { }

    get uid(): string {
        return 'Patch20250717AddWidgetsTags';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250717AddWidgetsTags {
        if (!Patch20250717AddWidgetsTags.instance) {
            Patch20250717AddWidgetsTags.instance = new Patch20250717AddWidgetsTags();
        }
        return Patch20250717AddWidgetsTags.instance;
    }

    public async work(db: IDatabase<any>) {
        let tag_oselia: DashboardWidgetTagVO = await query(DashboardWidgetTagVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetTagVO>().name, DashboardWidgetTagVO.WIDGET_TAG_OSELIA)
            .exec_as_server()
            .select_vo<DashboardWidgetTagVO>();

        if (!tag_oselia) {
            tag_oselia = new DashboardWidgetTagVO();
            tag_oselia.name = DashboardWidgetTagVO.WIDGET_TAG_OSELIA;
            tag_oselia.description = "Widgets Oselia, Graphs Osélia, ...";
            tag_oselia.icon_classname = "fa fa-robot";
            tag_oselia.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(tag_oselia);
        }

        let tag_table: DashboardWidgetTagVO = await query(DashboardWidgetTagVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetTagVO>().name, DashboardWidgetTagVO.WIDGET_TAG_TABLE)
            .exec_as_server()
            .select_vo<DashboardWidgetTagVO>();

        if (!tag_table) {
            tag_table = new DashboardWidgetTagVO();
            tag_table.name = DashboardWidgetTagVO.WIDGET_TAG_TABLE;
            tag_table.description = "Tableaux de données, BulkOpts, Supervision ...";
            tag_table.icon_classname = "fa fa-table";
            tag_table.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(tag_table);
        }

        let tag_vars: DashboardWidgetTagVO = await query(DashboardWidgetTagVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetTagVO>().name, DashboardWidgetTagVO.WIDGET_TAG_VARS)
            .exec_as_server()
            .select_vo<DashboardWidgetTagVO>();

        if (!tag_vars) {
            tag_vars = new DashboardWidgetTagVO();
            tag_vars.name = DashboardWidgetTagVO.WIDGET_TAG_VARS;
            tag_vars.description = "Graphs, KPIs, ...";
            tag_vars.icon_classname = "fa fa-chart-line";
            tag_vars.weight = 2;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(tag_vars);
        }

        let tag_filter: DashboardWidgetTagVO = await query(DashboardWidgetTagVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetTagVO>().name, DashboardWidgetTagVO.WIDGET_TAG_FILTER)
            .exec_as_server()
            .select_vo<DashboardWidgetTagVO>();

        if (!tag_filter) {
            tag_filter = new DashboardWidgetTagVO();
            tag_filter.name = DashboardWidgetTagVO.WIDGET_TAG_FILTER;
            tag_filter.description = "Filtres";
            tag_filter.icon_classname = "fa fa-filter";
            tag_filter.weight = 3;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(tag_filter);
        }

        let tag_template: DashboardWidgetTagVO = await query(DashboardWidgetTagVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetTagVO>().name, DashboardWidgetTagVO.WIDGET_TAG_TEMPLATE)
            .exec_as_server()
            .select_vo<DashboardWidgetTagVO>();

        if (!tag_template) {
            tag_template = new DashboardWidgetTagVO();
            tag_template.name = DashboardWidgetTagVO.WIDGET_TAG_TEMPLATE;
            tag_template.description = "Modèles de pages";
            tag_template.icon_classname = "fa fa-file-alt";
            tag_template.weight = 4;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(tag_template);
        }

        let tag_cms: DashboardWidgetTagVO = await query(DashboardWidgetTagVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetTagVO>().name, DashboardWidgetTagVO.WIDGET_CMS)
            .exec_as_server()
            .select_vo<DashboardWidgetTagVO>();

        if (!tag_cms) {
            tag_cms = new DashboardWidgetTagVO();
            tag_cms.name = DashboardWidgetTagVO.WIDGET_CMS;
            tag_cms.description = "Texte, images, vidéos, ...";
            tag_cms.icon_classname = "fa fa-file-alt";
            tag_cms.weight = 5;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(tag_cms);
        }

        let tag_favoris: DashboardWidgetTagVO = await query(DashboardWidgetTagVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<DashboardWidgetTagVO>().name, DashboardWidgetTagVO.WIDGET_FAVORIS)
            .exec_as_server()
            .select_vo<DashboardWidgetTagVO>();

        if (!tag_favoris) {
            tag_favoris = new DashboardWidgetTagVO();
            tag_favoris.name = DashboardWidgetTagVO.WIDGET_FAVORIS;
            tag_favoris.description = "Gestion des filtres favoris";
            tag_favoris.icon_classname = "fa fa-star";
            tag_favoris.weight = 6;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(tag_favoris);
        }

        // Now we need to update the existing widgets to add the tags
        const widgets = await query(DashboardWidgetVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardWidgetVO>();

        for (const widget of widgets) {
            const tags: DashboardWidgetTagVO[] = [];

            switch (widget.name) {
                case DashboardWidgetVO.WIDGET_NAME_oseliarungraphwidget:
                case DashboardWidgetVO.WIDGET_NAME_oseliathread:
                    tags.push(tag_oselia);
                    break;

                case DashboardWidgetVO.WIDGET_NAME_varpiechart:
                case DashboardWidgetVO.WIDGET_NAME_varchoroplethchart:
                case DashboardWidgetVO.WIDGET_NAME_varradarchart:
                case DashboardWidgetVO.WIDGET_NAME_varmixedcharts:
                case DashboardWidgetVO.WIDGET_NAME_var:
                    tags.push(tag_vars);
                    break;

                case DashboardWidgetVO.WIDGET_NAME_datatable:
                case DashboardWidgetVO.WIDGET_NAME_bulkops:
                case DashboardWidgetVO.WIDGET_NAME_supervision:
                case DashboardWidgetVO.WIDGET_NAME_suivicompetences:
                case DashboardWidgetVO.WIDGET_NAME_checklist:
                case DashboardWidgetVO.WIDGET_NAME_supervision_type:
                    tags.push(tag_table);
                    break;

                case DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter:
                case DashboardWidgetVO.WIDGET_NAME_dowfilter:
                case DashboardWidgetVO.WIDGET_NAME_monthfilter:
                case DashboardWidgetVO.WIDGET_NAME_advanceddatefilter:
                case DashboardWidgetVO.WIDGET_NAME_yearfilter:
                case DashboardWidgetVO.WIDGET_NAME_currentuserfilter:
                case DashboardWidgetVO.WIDGET_NAME_validationfilters:
                case DashboardWidgetVO.WIDGET_NAME_resetfilters:
                    tags.push(tag_filter);
                    break;

                case DashboardWidgetVO.WIDGET_NAME_savefavoritesfilters:
                case DashboardWidgetVO.WIDGET_NAME_showfavoritesfilters:
                    tags.push(tag_favoris);
                    break;

                case DashboardWidgetVO.WIDGET_NAME_bloctext:
                case DashboardWidgetVO.WIDGET_NAME_cmsbloctext:
                case DashboardWidgetVO.WIDGET_NAME_cmsimage:
                case DashboardWidgetVO.WIDGET_NAME_cmslinkbutton:
                case DashboardWidgetVO.WIDGET_NAME_cmslikebutton:
                case DashboardWidgetVO.WIDGET_NAME_cmsvisionneusepdf:
                case DashboardWidgetVO.WIDGET_NAME_cmsbooleanbutton:
                case DashboardWidgetVO.WIDGET_NAME_cmsprintparam:
                    tags.push(tag_cms);
                    break;

                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_crudbuttons:
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_bloctext:
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_image:
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_linkbutton:
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_visionneusepdf:
                    tags.push(tag_template);
                    break;

                case DashboardWidgetVO.WIDGET_NAME_crudbuttons:
                case DashboardWidgetVO.WIDGET_NAME_perfreportgraph:
                case DashboardWidgetVO.WIDGET_NAME_pageswitch:
                    // ????
                    break;

                case 'varlinechart':
                    // Bah en fait on le supprime celui là par ce que je vois pas la ref ....
                    await ModuleDAOServer.getInstance().deleteVOs_as_server([widget]);
                    break;

                default:
                    ConsoleHandler.error('Patch20250717AddWidgetsTags:work:widget:name:Unknown:' + widget.name);
                    break;
            }

            if (tags.length > 0) {
                widget.tags_id_ranges = RangeHandler.get_ids_ranges_from_vos(tags);
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(widget);
            }
        }
    }
}