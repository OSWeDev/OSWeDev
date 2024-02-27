import { Express } from 'express';

import APIControllerWrapper from '../../../shared/modules/API/APIControllerWrapper';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IRenderedData from '../../../shared/modules/DataRender/interfaces/IRenderedData';
import ModuleDataRender from '../../../shared/modules/DataRender/ModuleDataRender';
import DataRendererVO from '../../../shared/modules/DataRender/vos/DataRendererVO';
import DataRenderingLogVO from '../../../shared/modules/DataRender/vos/DataRenderingLogVO';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import IDistantVOBase from '../../../shared/modules/IDistantVOBase';
import ModulesManager from '../../../shared/modules/ModulesManager';
import ModuleTableVO from '../../../shared/modules/DAO/vos/ModuleTableVO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import TimeSegmentHandler from '../../../shared/tools/TimeSegmentHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleServerBase from '../ModuleServerBase';
import ModuleServiceBase from '../ModuleServiceBase';
import DataRenderModuleBase from './DataRenderModuleBase/DataRenderModuleBase';

export default class ModuleDataRenderServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ModuleDataRenderServer.instance) {
            ModuleDataRenderServer.instance = new ModuleDataRenderServer();
        }
        return ModuleDataRenderServer.instance;
    }

    private static instance: ModuleDataRenderServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleDataRender.getInstance().name);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Jour'
        }, 'timesegment.day.type_name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Mois'
        }, 'timesegment.month.type_name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année glissante'
        }, 'timesegment.rolling_year_month_start.type_name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Semaine'
        }, 'timesegment.week.type_name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année'
        }, 'timesegment.year.type_name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Heure'
        }, 'timesegment.hour.type_name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Minute'
        }, 'timesegment.minute.type_name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Seconde'
        }, 'timesegment.second.type_name'));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Jour'
        }, 'HourSegment.day.type_name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Mois'
        }, 'HourSegment.month.type_name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année glissante'
        }, 'HourSegment.rolling_year_month_start.type_name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Semaine'
        }, 'HourSegment.week.type_name'));
        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new({
            'fr-fr': 'Année'
        }, 'HourSegment.year.type_name'));
    }

    public registerExpressApis(app: Express): void { }

    // istanbul ignore next: cannot test registerServerApiHandlers
    public registerServerApiHandlers() {
        APIControllerWrapper.registerServerApiHandler(ModuleDataRender.APINAME_GET_DATA_RENDERERS, this.getDataRenderers.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataRender.APINAME_GET_DATA_RENDERER, this.getDataRenderer.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataRender.APINAME_GET_DATA_RENDERING_LOGS, this.getDataRenderingLogs.bind(this));
        APIControllerWrapper.registerServerApiHandler(ModuleDataRender.APINAME_getLatestAvailableSegment, this.getLatestAvailableSegment.bind(this));
    }

    public async getLatestAvailableSegment(text: string): Promise<TimeSegment> {

        // On veut trouver la data rendu de ce type dont la date est la plus récente.
        const dataRenderer: DataRendererVO = await this.getDataRenderer(text);
        if (!dataRenderer) {
            return null;
        }

        const rendererModule: DataRenderModuleBase = ModulesManager.getInstance().getModuleByNameAndRole(dataRenderer.render_handler_module, ModuleServerBase.SERVER_MODULE_ROLE_NAME) as DataRenderModuleBase;

        const latest_data: IDistantVOBase & IRenderedData = await query(rendererModule.database.vo_type).set_sort(new SortByVO(rendererModule.database.vo_type, 'data_dateindex', false)).set_limit(1).select_vo<IDistantVOBase & IRenderedData>();

        if ((!latest_data) || (!rendererModule.data_timesegment_type)) {
            return null;
        }

        return TimeSegmentHandler.getCorrespondingTimeSegment(latest_data.data_dateindex, rendererModule.data_timesegment_type);
    }

    public async getDataRenderers(): Promise<DataRendererVO[]> {
        return await query(DataRendererVO.API_TYPE_ID).select_vos<DataRendererVO>();
    }

    public async getDataRenderer(text: string): Promise<DataRendererVO> {
        return await query(DataRendererVO.API_TYPE_ID).filter_by_text_eq('renderer_name', text).select_vo<DataRendererVO>();
    }

    /**
     * @param datatable
     * @param timeSegment
     * @param rendered_data_time_segment_type
     */
    public async getDataSegment<T extends IDistantVOBase>(
        datatable: ModuleTableVO<T>,
        timeSegment: TimeSegment,
        rendered_data_time_segment_type: number): Promise<T[]> {

        const timeSegments: TimeSegment[] = TimeSegmentHandler.getAllDataTimeSegments(
            TimeSegmentHandler.getStartTimeSegment(timeSegment),
            TimeSegmentHandler.getEndTimeSegment(timeSegment),
            rendered_data_time_segment_type
        );
        return await query(datatable.vo_type)
            .filter_by_num_has('data_dateindex', timeSegments.map((ts: TimeSegment) => ts.index))
            .select_vos<T>();
    }

    public async clearDataSegments(moduletable: ModuleTableVO, timeSegments: TimeSegment[], date_field_name: string = 'data_dateindex'): Promise<void> {

        let timeSegments_in: string = null;
        for (const i in timeSegments) {
            const timeSegment: TimeSegment = timeSegments[i];

            if (!timeSegments_in) {
                timeSegments_in = "" + timeSegment.index;
            } else {

                timeSegments_in += "," + timeSegment.index;
            }
        }
        await ModuleDAOServer.getInstance().query('DELETE FROM ' + moduletable.full_name + ' t where ' + date_field_name + ' in (' + timeSegments_in + ');');
    }

    public async clearDataSegment(moduletable: ModuleTableVO, timeSegment: TimeSegment, date_field_name: string = 'data_dateindex'): Promise<void> {
        await ModuleDAOServer.getInstance().query('DELETE FROM ' + moduletable.full_name + ' t where ' + date_field_name + ' = $1;', [timeSegment.index]);
    }

    public async getDataRenderingLogs(): Promise<DataRenderingLogVO[]> {
        return query(DataRenderingLogVO.API_TYPE_ID).select_vos<DataRenderingLogVO>();
    }
}