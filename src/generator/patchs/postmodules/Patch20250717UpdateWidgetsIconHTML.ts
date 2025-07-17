/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250717UpdateWidgetsIconHTML implements IGeneratorWorker {


    private static instance: Patch20250717UpdateWidgetsIconHTML = null;
    private constructor() { }

    get uid(): string {
        return 'Patch20250717UpdateWidgetsIconHTML';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250717UpdateWidgetsIconHTML {
        if (!Patch20250717UpdateWidgetsIconHTML.instance) {
            Patch20250717UpdateWidgetsIconHTML.instance = new Patch20250717UpdateWidgetsIconHTML();
        }
        return Patch20250717UpdateWidgetsIconHTML.instance;
    }

    public async work(db: IDatabase<any>) {
        const widgets: DashboardWidgetVO[] = await query(DashboardWidgetVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardWidgetVO>();

        for (const widget of widgets) {

            if ((!!widget.icon_html) && (!widget.icon_component)) {
                continue;
            }

            switch (widget.name) {
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_bloctext:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true' style="filter: invert(100%);">
            <i class='fa-solid fa-text'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_image:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true' style="filter: invert(100%);">
            <i class='fa-solid fa-image'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_linkbutton:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true' style="filter: invert(100%);">
            <i class='fa-solid fa-link'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_visionneusepdf:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true' style="filter: invert(100%);">
            <i class='fa-solid fa-file-pdf'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_TemplateConsultation_crudbuttons:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true' style="filter: invert(100%);">
            <i class='fa-solid fa-database fa-stack-2x'></i>
            <i class='fa-solid fa-trash fa-stack-1x' style="position: absolute;    left: 18px;    bottom: -5px;    width: auto;    height: auto;    color: dodgerblue;    background: transparent;    padding: 1px 3px;    margin: 0;    line-height: 1.1em;"></i>
            <i class='fa-solid fa-pen fa-stack-1x' style="position: absolute;    left: 18px;    bottom: 15px;    width: auto;    height: auto;    color: dodgerblue;    background: transparent;    padding: 1px 3px;    margin: 0; line-height: 1.1em;"></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmsbloctext:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-text'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmsimage:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-image'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmslinkbutton:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-link'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmslikebutton:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-heart-circle'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmsvisionneusepdf:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-file-pdf'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmsbooleanbutton:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-toggle-on'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_cmsprintparam:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-file fa-stack-2x'></i>
            <i class='fa-solid fa-cogs fa-stack-1x'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_crudbuttons:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true' style="filter: invert(100%);">
            <i class='fa-solid fa-database fa-stack-2x'></i>
            <i class='fa-solid fa-trash fa-stack-1x' style="position: absolute;    left: 18px;    bottom: -5px;    width: auto;    height: auto;    color: dodgerblue;    background: transparent;    padding: 1px 3px;    margin: 0;    line-height: 1.1em;"></i>
            <i class='fa-solid fa-pen fa-stack-1x' style="position: absolute;    left: 18px;    bottom: 15px;    width: auto;    height: auto;    color: dodgerblue;    background: transparent;    padding: 1px 3px;    margin: 0; line-height: 1.1em;"></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_bloctext:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-text'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_suivicompetences:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-memo-circle-check'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_oseliarungraphwidget:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa fa-chart-diagram' aria-hidden='true'></i>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_varpiechart:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa-duotone fa-chart-pie' aria-hidden='true'></i>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_varchoroplethchart:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa-duotone fa-map-location-dot' aria-hidden='true'></i>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_varradarchart:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa-duotone fa-chart-radar' aria-hidden='true'></i>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_varmixedcharts:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa-duotone fa-chart-mixed' aria-hidden='true'></i>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_datatable:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-table fa-stack-2x'></i>
            <i class='fa-solid fa-pencil-square fa-stack-1x' style="position: absolute; left: 0px; bottom: 0px; width: auto; height: auto; color: dodgerblue; background: white; padding: 1px 3px; margin: 0; line-height: 1.1em;"></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_bulkops:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa fa-cogs' aria-hidden='true'></i>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_supervision:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa fa-duotone fa-list-check' aria-hidden='true'></i>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa fa-filter' aria-hidden='true'></i>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_dowfilter:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa-regular fa-calendar' aria-hidden='true'></i>
        <div class='ts_overlay' style="float: left; margin-top: -1.9em; width: -webkit-fill-available; text-align: center; font-size: 0.4em;">7</div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_monthfilter:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa-regular fa-calendar' aria-hidden='true'></i>
        <div class='ts_overlay' style="float: left; margin-top: -1.9em; width: -webkit-fill-available; text-align: center; font-size: 0.4em;">31</div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_advanceddatefilter:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa-regular fa-calendar' aria-hidden='true'></i>
        <div class='ts_overlay' style="float: left; margin-top: -1.9em; width: -webkit-fill-available; text-align: center; font-size: 0.4em;">X</div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_yearfilter:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa-regular fa-calendar' aria-hidden='true'></i>
        <div class='ts_overlay' style="float: left; margin-top: -1.9em; width: -webkit-fill-available; text-align: center; font-size: 0.4em;">365</div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_currentuserfilter:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-user fa-stack-2x'></i>
            <i class='fa-solid fa-bullseye fa-stack-1x'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_validationfilters:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-filter fa-stack-2x'></i>
            <i class='fa-solid fa-check fa-stack-1x'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_savefavoritesfilters:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-filter fa-stack-2x'></i>
            <i class='fa-solid fa-save fa-stack-1x'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_showfavoritesfilters:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-filter fa-stack-2x'></i>
            <i class='fa-solid fa-eye fa-stack-1x'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_resetfilters:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-filter fa-stack-2x'></i>
            <i class='fa-solid fa-redo fa-stack-1x'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_pageswitch:
                    widget.icon_html = `
        <div class='fa-stack fa-lg fa-fw' aria-hidden='true'>
            <i class='fa-solid fa-file fa-stack-2x'></i>
            <i class='fa-solid fa-external-link-square fa-stack-1x'></i>
        </div>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_var:
                    widget.icon_html = `
        <i class='fa-lg fa-fw fa fa-bullseye' aria-hidden='true'></i>
        `;
                    break;
                case DashboardWidgetVO.WIDGET_NAME_oseliathread:
                    widget.icon_html = `
        <i class='fa-duotone fa-comments'></i>
        `;
                    break;

                case DashboardWidgetVO.WIDGET_NAME_checklist:
                    widget.icon_html = `
        <i class='.fa-lg.fa-fw.fa.fa-check-circle"></i>
        `;
                    break;

                default:
                    ConsoleHandler.error('No translation found for widget: ' + widget.name + ' (' + widget.label + ')');
                    break;
            }

            widget.icon_component = null; // on supprime l'ancienne icône

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(widget);
        }
    }
}