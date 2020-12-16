import { Express } from 'express';
import * as moment from 'moment';
import ModuleAPI from '../../../shared/modules/API/ModuleAPI';
import StringParamVO from '../../../shared/modules/API/vos/apis/StringParamVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IRenderedData from '../../../shared/modules/DataRender/interfaces/IRenderedData';
import ModuleDataRender from '../../../shared/modules/DataRender/ModuleDataRender';
import DataRendererVO from '../../../shared/modules/DataRender/vos/DataRendererVO';
import DataRenderingLogVO from '../../../shared/modules/DataRender/vos/DataRenderingLogVO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ModuleTable from '../../../shared/modules/ModuleTable';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import TimeSegmentHandler from '../../../shared/tools/TimeSegmentHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import DataRenderModuleBase from './DataRenderModuleBase/DataRenderModuleBase';

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

    public async configure() {
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Jour'
        }, 'timesegment.day.type_name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Mois'
        }, 'timesegment.month.type_name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Année glissante'
        }, 'timesegment.rolling_year_month_start.type_name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Semaine'
        }, 'timesegment.week.type_name'));
        DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
            fr: 'Année'
        }, 'timesegment.year.type_name'));
    }

    public registerExpressApis(app: Express): void { }

    public registerServerApiHandlers() {
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataRender.APINAME_GET_DATA_RENDERERS, this.getDataRenderers.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataRender.APINAME_GET_DATA_RENDERER, this.getDataRenderer.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataRender.APINAME_GET_DATA_RENDERING_LOGS, this.getDataRenderingLogs.bind(this));
        ModuleAPI.getInstance().registerServerApiHandler(ModuleDataRender.APINAME_getLatestAvailableSegment, this.getLatestAvailableSegment.bind(this));
    }

    public async getLatestAvailableSegment(text: string): Promise<TimeSegment> {

        // On veut trouver la data rendu de ce type dont la date est la plus récente.
        let dataRenderer: DataRendererVO = await this.getDataRenderer(text);
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

        return TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(moment(latest_data.data_dateindex).utc(true), rendererModule.data_timesegment_type);
    }

    public async getDataRenderers(): Promise<DataRendererVO[]> {
        return await ModuleDAO.getInstance().getVos<DataRendererVO>(DataRendererVO.API_TYPE_ID);
    }

    public async getDataRenderer(text: string): Promise<DataRendererVO> {
        return await ModuleDAOServer.getInstance().selectOne<DataRendererVO>(DataRendererVO.API_TYPE_ID, 'WHERE t.renderer_name = $1', [text]);
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
}