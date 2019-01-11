import { Express, Request, Response } from 'express';
import * as formidable from 'express-formidable';
import * as moment from 'moment';
import { Moment } from 'moment';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IRenderedData from '../../../shared/modules/DataRender/interfaces/IRenderedData';
import IRenderOptions from '../../../shared/modules/DataRender/interfaces/IRenderOptions';
import ModuleDataRender from '../../../shared/modules/DataRender/ModuleDataRender';
import DataRendererVO from '../../../shared/modules/DataRender/vos/DataRendererVO';
import DataRenderingLogVO from '../../../shared/modules/DataRender/vos/DataRenderingLogVO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ModuleTable from '../../../shared/modules/ModuleTable';
import DateHandler from '../../../shared/tools/DateHandler';
import TimeSegmentHandler from '../../../shared/tools/TimeSegmentHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import DataRenderModuleBase from './DataRenderModuleBase/DataRenderModuleBase';
import VOsTypesManager from '../../../shared/modules/VOsTypesManager';

export default class ModuleDataRenderServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleDataRenderServer.instance) {
            ModuleDataRenderServer.instance = new ModuleDataRenderServer();
        }
        return ModuleDataRenderServer.instance;
    }

    private static instance: ModuleDataRenderServer = null;

    private constructor() {
        super(ModuleDataRender.getInstance().name);
    }

    public registerExpressApis(app: Express): void {
        this.registerExpressApi_renderData(app);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataRender.APINAME_GET_DATA_RENDERERS, this.getDataRenderers.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataRender.APINAME_GET_DATA_RENDERER, this.getDataRenderer.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataRender.APINAME_GET_DATA_RENDERING_LOGS, this.getDataRenderingLogs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataRender.APINAME_getLatestAvailableSegment, this.getLatestAvailableSegment.bind(this));
    }

    public async getLatestAvailableSegment(renderer_name: StringParamVO): Promise<TimeSegment> {

        // On veut trouver la data rendu de ce type dont la date est la plus récente.
        let dataRenderer: DataRendererVO = await this.getDataRenderer(renderer_name);
        if (!dataRenderer) {
            return null;
        }

        let rendererModule: DataRenderModuleBase = ModulesManager.getInstance().getModuleByNameAndRole(dataRenderer.render_handler_module, ModuleServerBase.SERVER_MODULE_ROLE_NAME) as DataRenderModuleBase;

        let latest_data: IDistantVOBase & IRenderedData = await ModuleDAOServer.getInstance().selectOne<IDistantVOBase & IRenderedData>(
            rendererModule.database.vo_type,
            "order by data_dateindex desc limit 1"
        );

        let res: TimeSegment = null;

        if ((!latest_data) || (!rendererModule.data_timesegment_type)) {
            return null;
        }

        return TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment(latest_data.data_dateindex), rendererModule.data_timesegment_type);
    }

    public async getDataRenderers(): Promise<DataRendererVO[]> {
        return await ModuleDAO.getInstance().getVos<DataRendererVO>(DataRendererVO.API_TYPE_ID);
    }

    public async getDataRenderer(param: StringParamVO): Promise<DataRendererVO> {
        return await ModuleDAOServer.getInstance().selectOne<DataRendererVO>(DataRendererVO.API_TYPE_ID, 'WHERE t.renderer_name = $1', [param.text]);
    }

    /**
     * @param datatable
     * @param timeSegment
     * @param rendered_data_time_segment_type
     */
    public async getDataSegment<T extends IDistantVOBase>(
        datatable: ModuleTable<T>,
        timeSegment: TimeSegment,
        rendered_data_time_segment_type: number): Promise<T[]> {

        let timeSegments: TimeSegment[] = TimeSegmentHandler.getInstance().getAllDataTimeSegments(
            TimeSegmentHandler.getInstance().getStartTimeSegment(timeSegment),
            TimeSegmentHandler.getInstance().getEndTimeSegment(timeSegment),
            rendered_data_time_segment_type
        );
        let timeSegments_in: string = null;
        for (let i in timeSegments) {
            let timeSegment_: TimeSegment = timeSegments[i];

            if (!timeSegments_in) {
                timeSegments_in = "\'" + timeSegment_.dateIndex + "\'";
            } else {

                timeSegments_in += ", \'" + timeSegment_.dateIndex + "\'";
            }
        }
        return await ModuleDAOServer.getInstance().selectAll<T>(datatable.vo_type, ' where data_dateindex in (' + timeSegments_in + ')') as T[];
    }

    public async clearDataSegments(moduletable: ModuleTable<any>, timeSegments: TimeSegment[], date_field_name: string = 'data_dateindex'): Promise<void> {

        let timeSegments_in: string = null;
        for (let i in timeSegments) {
            let timeSegment: TimeSegment = timeSegments[i];

            if (!timeSegments_in) {
                timeSegments_in = "\'" + timeSegment.dateIndex + "\'";
            } else {

                timeSegments_in += ", \'" + timeSegment.dateIndex + "\'";
            }
        }
        await ModuleServiceBase.getInstance().db.none('DELETE FROM ' + moduletable.full_name + ' t where ' + date_field_name + ' in (' + timeSegments_in + ');');
    }

    public async clearDataSegment(moduletable: ModuleTable<any>, timeSegment: TimeSegment, date_field_name: string = 'data_dateindex'): Promise<void> {

        await ModuleServiceBase.getInstance().db.none('DELETE FROM ' + moduletable.full_name + ' t where ' + date_field_name + ' = $1;', [timeSegment.dateIndex]);
    }

    public async getDataRenderingLogs(): Promise<DataRenderingLogVO[]> {
        return ModuleDAO.getInstance().getVos<DataRenderingLogVO>(DataRenderingLogVO.API_TYPE_ID);
    }

    /**
     * Cette API nécessite un paramètre import_uid qui correspond au DataImportFormatVO.import_uid
     */
    private async resolveExpressApi_renderData(req: Request, res: Response) {
        let renderer_name: string = req.params.renderer_name;
        let render_time_segments_json: string = req.fields.render_time_segments_json as string;
        let render_time_segments: TimeSegment[] = JSON.parse(render_time_segments_json);
        let options: IRenderOptions = req.fields.options ? JSON.parse(req.fields.options as string) : null;
        console.log('RENDER : ' + renderer_name);

        // On ordonne tout de suite les segments, qui doivent dans tous les cas être en ordre chronologique
        render_time_segments.sort((a: TimeSegment, b: TimeSegment): number => {
            let ma: Moment = moment(a.dateIndex);
            let mb: Moment = moment(b.dateIndex);

            if (ma.isBefore(mb)) {
                return -1;
            }
            if (ma.isAfter(mb)) {
                return 1;
            }
            return 0;
        });

        // On prépare tout de suite le Log
        let log: DataRenderingLogVO = new DataRenderingLogVO();
        log.date = DateHandler.getInstance().formatDateTimeForBDD(moment());
        log.state = DataRenderingLogVO.RENDERING_STATE_STARTED;
        log.data_time_segment_json = render_time_segments_json;
        let renderer: DataRendererVO = (await ModuleDataRender.getInstance().getDataRenderer(renderer_name));
        log.rendered_api_type_id = renderer ? renderer.id : null;

        // On charge les informations de ce type d'import
        let dataRender: DataRendererVO = null;

        try {
            dataRender = await ModuleDataRender.getInstance().getDataRenderer(renderer_name);
        } catch (error) {
            console.error(error);
            log.state = DataRenderingLogVO.RENDERING_STATE_FAILED;
            log.message = error + "\n";
        }

        if (!dataRender) {
            return this.handleApiError_importFile(log, "Impossible de charger les informations de ce renderer : '" + renderer_name + "'. Abandon.", res);
        }

        let rendered = false;
        try {

            let rendererModule: DataRenderModuleBase = ModulesManager.getInstance().getModuleByNameAndRole(dataRender.render_handler_module, DataRenderModuleBase.ROLE_NAME) as DataRenderModuleBase;

            if (await rendererModule.hook_render_managed_data_in_database(render_time_segments, log, options)) {

                rendered = true;
            }
        } catch (error) {
            console.error(error);
            log.state = DataRenderingLogVO.RENDERING_STATE_FAILED;
            log.message = error + "\n";
            rendered = false;
        }

        if (!rendered) {
            return this.handleApiError_importFile(log, "Impossible de render les datas : '" + renderer_name + "'. Abandon.", res);
        }

        // à la fin on indique le bon fonctionnement
        log.state = DataRenderingLogVO.RENDERING_STATE_OK;
        log.message = "Fin rendering : " + moment().format("Y-MM-DD HH:mm");
        ModuleDAO.getInstance().insertOrUpdateVOs([log]);
    }
    private handleApiError_importFile(log: DataRenderingLogVO, msg: string, res: Response) {
        log.message += msg;

        // A la limite, le await on s'en fout ici... pour les logs on prend le temps qu'on veut et on bloque pas l'exécution
        ModuleDAO.getInstance().insertOrUpdateVOs([log]);

        console.error("handleApiError_importFile :" + log.message);
        res.statusCode = DataRenderingLogVO.FAILED_HTML_STATUS;
        res.send(log.message);
    }
    private registerExpressApi_renderData(app: Express) {
        app.post('/modules/ModuleDataRender/renderData/:renderer_name', formidable(), this.resolveExpressApi_renderData.bind(this));
    }
}