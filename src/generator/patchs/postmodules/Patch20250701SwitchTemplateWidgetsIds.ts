import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import CMSBlocTextWidgetOptionsVO from "../../../shared/modules/DashboardBuilder/vos/CMSBlocTextWidgetOptionsVO";
import CMSCrudButtonsWidgetOptionsVO from "../../../shared/modules/DashboardBuilder/vos/CMSCrudButtonsWidgetOptionsVO";
import CMSImageWidgetOptionsVO from "../../../shared/modules/DashboardBuilder/vos/CMSImageWidgetOptionsVO";
import CMSLinkButtonWidgetOptionsVO from "../../../shared/modules/DashboardBuilder/vos/CMSLinkButtonWidgetOptionsVO";
import CMSVisionneusePdfWidgetOptionsVO from "../../../shared/modules/DashboardBuilder/vos/CMSVisionneusePdfWidgetOptionsVO";
import DashboardPageWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO";
import DashboardWidgetVO from "../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO";
import { field_names } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250701SwitchTemplateWidgetsIds implements IGeneratorWorker {

    private static instance: Patch20250701SwitchTemplateWidgetsIds = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250701SwitchTemplateWidgetsIds';
    }

    public static getInstance(): Patch20250701SwitchTemplateWidgetsIds {
        if (!Patch20250701SwitchTemplateWidgetsIds.instance) {
            Patch20250701SwitchTemplateWidgetsIds.instance = new Patch20250701SwitchTemplateWidgetsIds();
        }
        return Patch20250701SwitchTemplateWidgetsIds.instance;
    }

    public async work(db: IDatabase<unknown>) {
        /**
         * Le plan c'est qu'à ce stade les nouveaux widgets de CMS et de Templates sont créés, et on veut changer l'id de ref des widgets actuellement configurés comme étant des widgets de cms pour l'équivalent en template si ils utilisent le boolean idoine
         */


        const template_widgets: { [widget_name: string]: DashboardWidgetVO } = {};
        const template_widget_names_correspondances: { [cms_name: string]: string } = {
            [DashboardWidgetVO.WIDGET_NAME_cmsbloctext]: DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_bloctext,
            [DashboardWidgetVO.WIDGET_NAME_cmslinkbutton]: DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_linkbutton,
            [DashboardWidgetVO.WIDGET_NAME_cmsimage]: DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_image,
            [DashboardWidgetVO.WIDGET_NAME_cmsvisionneusepdf]: DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_visionneusepdf,
            [DashboardWidgetVO.WIDGET_NAME_crudbuttons]: DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_crudbuttons,
        };
        for (const cms_widget_name in template_widget_names_correspondances) {
            const widget_name: string = template_widget_names_correspondances[cms_widget_name];
            const template_widget: DashboardWidgetVO = await query(DashboardWidgetVO.API_TYPE_ID).filter_by_text_eq(field_names<DashboardWidgetVO>().name, widget_name).exec_as_server().select_vo<DashboardWidgetVO>();
            if (template_widget) {
                template_widgets[cms_widget_name] = template_widget;
            }
        }

        for (const cms_widget_name in template_widget_names_correspondances) {
            const pages_widgets: DashboardPageWidgetVO[] = await query(DashboardPageWidgetVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<DashboardWidgetVO>().name, cms_widget_name, DashboardWidgetVO.API_TYPE_ID)
                .exec_as_server()
                .select_vos<DashboardPageWidgetVO>();

            for (const i in pages_widgets) {
                const page_widget: DashboardPageWidgetVO = pages_widgets[i];
                const corresponding_template_widget: DashboardWidgetVO = template_widgets[cms_widget_name];

                if (!corresponding_template_widget) {
                    continue; // Pas de widget template correspondant
                }


                let needs_to_switch: boolean = false;

                switch (cms_widget_name) {
                    case DashboardWidgetVO.WIDGET_NAME_cmsbloctext:
                        const current_options: CMSBlocTextWidgetOptionsVO = (page_widget && page_widget.json_options) ? JSON.parse(page_widget.json_options) as CMSBlocTextWidgetOptionsVO : null;

                        needs_to_switch = current_options && current_options.use_for_template;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_cmslinkbutton:
                        const current_link_options: CMSLinkButtonWidgetOptionsVO = (page_widget && page_widget.json_options) ? JSON.parse(page_widget.json_options) as CMSLinkButtonWidgetOptionsVO : null;

                        needs_to_switch = current_link_options && current_link_options.is_url_field;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_cmsimage:
                        const current_image_options: CMSImageWidgetOptionsVO = (page_widget && page_widget.json_options) ? JSON.parse(page_widget.json_options) as CMSImageWidgetOptionsVO : null;

                        needs_to_switch = current_image_options && current_image_options.use_for_template;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_cmsvisionneusepdf:
                        const current_pdf_options: CMSVisionneusePdfWidgetOptionsVO = (page_widget && page_widget.json_options) ? JSON.parse(page_widget.json_options) as CMSVisionneusePdfWidgetOptionsVO : null;

                        needs_to_switch = current_pdf_options && current_pdf_options.use_for_template;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_crudbuttons:
                        const current_crud_buttons_options: CMSCrudButtonsWidgetOptionsVO = (page_widget && page_widget.json_options) ? JSON.parse(page_widget.json_options) as CMSCrudButtonsWidgetOptionsVO : null;

                        needs_to_switch = current_crud_buttons_options && !current_crud_buttons_options.show_manual_vo_type;
                        break;

                    default:
                        break;
                }

                if (needs_to_switch) {
                    // On switch l'id du widget
                    page_widget.widget_id = corresponding_template_widget.id;

                    // On met à jour le widget
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(page_widget);
                }
            }
        }
    }
}