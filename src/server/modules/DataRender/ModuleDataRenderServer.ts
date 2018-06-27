import * as formidable from 'express-formidable';
import * as moment from 'moment';
import { Moment } from 'moment';
import ModuleServerBase from '../ModuleServerBase';
import { Express, Request, Response } from 'express';
import DataRenderingLogVO from '../../../shared/modules/DataRender/vos/DataRenderingLogVO';
import DateHandler from '../../../shared/tools/DateHandler';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ModuleDataRender from '../../../shared/modules/DataRender/ModuleDataRender';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import IRenderOptions from '../../../shared/modules/DataRender/interfaces/IRenderOptions';
import DataRendererVO from '../../../shared/modules/DataRender/vos/DataRendererVO';
import DataRenderModuleBase from './DataRenderModuleBase/DataRenderModuleBase';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServiceBase from '../ModuleServiceBase';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import GetAPIDefinition from '../../../shared/modules/API/vos/GetAPIDefinition';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModuleTable from '../../../shared/modules/ModuleTable';

export default class ModuleDataRenderServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleDataRenderServer.instance) {
            ModuleDataRenderServer.instance = new ModuleDataRenderServer();
        }
        return ModuleDataRenderServer.instance;
    }

    private static instance: ModuleDataRenderServer = null;

    get actif(): boolean {
        return ModuleDataRender.getInstance().actif;
    }

    public registerExpressApis(app: Express): void {
        this.registerExpressApi_renderData(app);
    }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataRender.APINAME_GET_DATA_RENDERERS, this.getDataRenderers.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataRender.APINAME_GET_DATA_RENDERER, this.getDataRenderer.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataRender.APINAME_GET_DATA_RENDERING_LOGS, this.getDataRenderingLogs.bind(this));
    }

    public async getDataRenderers(): Promise<DataRendererVO[]> {
        return await ModuleDAO.getInstance().getVos<DataRendererVO>(DataRendererVO.API_TYPE_ID);
    }

    public async getDataRenderer(renderer_name: string): Promise<DataRendererVO> {
        return await ModuleDAOServer.getInstance().selectOne<DataRendererVO>(DataRendererVO.API_TYPE_ID, 'WHERE t.renderer_name = $1', [renderer_name]);
    }

    /**
     * Attention le résultat doit passer par un force numerics approprié
     * @param bdd_full_name
     * @param timeSegment
     */
    public async getDataSegment_needs_force_numerics<T extends IDistantVOBase>(
        datatable: ModuleTable<T>,
        timeSegment: TimeSegment,
        rendered_data_time_segment_type: string): Promise<T[]> {

        let timeSegments: TimeSegment[] = ModuleDataRender.getInstance().getAllDataTimeSegments(
            ModuleDataRender.getInstance().getStartTimeSegment(timeSegment),
            ModuleDataRender.getInstance().getEndTimeSegment(timeSegment),
            rendered_data_time_segment_type
        );
        let timeSegments_in: string = null;
        for (let i in timeSegments) {
            let timeSegment: TimeSegment = timeSegments[i];

            if (!timeSegments_in) {
                timeSegments_in = "\'" + timeSegment.dateIndex + "\'";
            } else {

                timeSegments_in += ", \'" + timeSegment.dateIndex + "\'";
            }
        }
        return await ModuleDAOServer.getInstance().selectAll<T>(datatable.vo_type, ' where data_dateindex in (' + timeSegments_in + ')') as T[];
    }

    public async clearDataSegments(bdd_full_name: string, timeSegments: TimeSegment[], date_field_name: string = 'data_dateindex'): Promise<void> {

        let timeSegments_in: string = null;
        for (let i in timeSegments) {
            let timeSegment: TimeSegment = timeSegments[i];

            if (!timeSegments_in) {
                timeSegments_in = "\'" + timeSegment.dateIndex + "\'";
            } else {

                timeSegments_in += ", \'" + timeSegment.dateIndex + "\'";
            }
        }
        await ModuleServiceBase.getInstance().db.none('DELETE FROM ' + bdd_full_name + ' t where ' + date_field_name + ' in (' + timeSegments_in + ');');
    }

    public async getDataRenderingLogs(): Promise<DataRenderingLogVO[]> {
        return ModuleDAO.getInstance().getVos<DataRenderingLogVO>(DataRenderingLogVO.API_TYPE_ID);
    }

    /**
     * Cette API nécessite un paramètre import_name qui correspond au DataImportFileVO.import_name
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
        log.renderer_name = renderer_name;

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

        res.statusCode = DataRenderingLogVO.FAILED_HTML_STATUS;
        res.send(log.message);
    }
    private registerExpressApi_renderData(app: Express) {
        app.post('/modules/ModuleDataRender/renderData/:renderer_name', formidable(), this.resolveExpressApi_renderData.bind(this));
    }
}