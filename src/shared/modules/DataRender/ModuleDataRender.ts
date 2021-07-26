import APIControllerWrapper from '../API/APIControllerWrapper';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import DataRenderController from './DataRenderController';
import IRenderedData from './interfaces/IRenderedData';
import DataRendererVO from './vos/DataRendererVO';
import DataRenderingLogVO from './vos/DataRenderingLogVO';
import TimeSegment from './vos/TimeSegment';

export default class ModuleDataRender extends Module {

    public static APINAME_GET_DATA_RENDERERS = "GET_DATA_RENDERERS";
    public static APINAME_GET_DATA_RENDERER = "GET_DATA_RENDERER";
    public static APINAME_GET_DATA_RENDERING_LOGS = "GET_DATA_RENDERING_LOGS";
    public static APINAME_getLatestAvailableSegment = "getLatestAvailableSegment";

    public static getInstance(): ModuleDataRender {
        if (!ModuleDataRender.instance) {
            ModuleDataRender.instance = new ModuleDataRender();
        }
        return ModuleDataRender.instance;
    }

    private static instance: ModuleDataRender = null;

    public getDataRenderers: () => Promise<DataRendererVO[]> = APIControllerWrapper.sah(ModuleDataRender.APINAME_GET_DATA_RENDERERS);
    public getDataRenderer: (renderer_name: string) => Promise<DataRendererVO> = APIControllerWrapper.sah(ModuleDataRender.APINAME_GET_DATA_RENDERER);
    public getDataRenderingLogs: () => Promise<DataRenderingLogVO[]> = APIControllerWrapper.sah(ModuleDataRender.APINAME_GET_DATA_RENDERING_LOGS);
    public getLatestAvailableSegment: (api_name: string) => Promise<TimeSegment> = APIControllerWrapper.sah(ModuleDataRender.APINAME_getLatestAvailableSegment);

    private constructor() {

        super("data_render", "DataRender");
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<void, DataRendererVO[]>(
            null,
            ModuleDataRender.APINAME_GET_DATA_RENDERERS,
            [DataRendererVO.API_TYPE_ID]
        ));
        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<StringParamVO, DataRendererVO>(
            null,
            ModuleDataRender.APINAME_GET_DATA_RENDERER,
            [DataRendererVO.API_TYPE_ID],
            StringParamVOStatic
        ));
        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<void, DataRenderingLogVO[]>(
            null,
            ModuleDataRender.APINAME_GET_DATA_RENDERING_LOGS,
            [DataRenderingLogVO.API_TYPE_ID]
        ));
        APIControllerWrapper.getInstance().registerApi(new GetAPIDefinition<StringParamVO, TimeSegment>(
            null,
            ModuleDataRender.APINAME_getLatestAvailableSegment,
            [DataRendererVO.API_TYPE_ID],
            StringParamVOStatic
        ));
    }

    /**
     * TODO: DONOT use this, call the controller directly
     * Calcul le % de trend pour aller du départ à l'arrivée
     * @param value_a Valeur de départ
     * @param value_b Valeur d'arrivée
     * @returns number entre 0 et 1, ou 999 pour + infini
     */
    public getTrendP(value_a: number, value_b: number): number {
        return DataRenderController.getInstance().getTrendP(value_a, value_b);
    }

    /**
     * TODO: DONOT use this, call the controller directly
     * Calcul le trend (en number) pour aller du départ à l'arrivée
     * @param value_a Valeur de départ
     * @param value_b Valeur d'arrivée
     * @returns la différence entre l'arrivée et le départ
     */
    public getTrend(value_a: number, value_b: number): number {

        return DataRenderController.getInstance().getTrend(value_a, value_b);
    }

    /**
     * TODO: DONOT use this, call the controller directly
     * Calcul le pourcentage entre 2 valeurs
     * @param value_a Numérateur
     * @param value_b Dénominateur
     */
    public getPrct(value_a: number, value_b: number): number {
        return DataRenderController.getInstance().getPrct(value_a, value_b);
    }

    /**
     * TODO: DONOT use this, call the controller directly
     * @param rows
     * @param conditionFunc
     */
    public getCount(rows: IRenderedData[], conditionFunc: (row: IRenderedData) => boolean): number {
        return DataRenderController.getInstance().getCount(rows, conditionFunc);
    }

    /**
     * TODO: DONOT use this, call the controller directly
     * @param rows
     * @param field_name
     * @param conditionFunc
     */
    public getColSomme(rows: IRenderedData[], field_name: string, conditionFunc: (row: IRenderedData) => boolean): number {
        return DataRenderController.getInstance().getColSomme(rows, field_name, conditionFunc);
    }

    /**
     * TODO: DONOT use this, call the controller directly
     * @param rows
     * @param field_name
     * @param conditionFunc
     */
    public getColMean(rows: IRenderedData[], field_name: string, conditionFunc: (row: IRenderedData) => boolean): number {
        return DataRenderController.getInstance().getColMean(rows, field_name, conditionFunc);
    }

    /**
     * TODO: DONOT use this, call the controller directly
     * @param rows
     * @param field_name
     * @param field_ponderation_name
     * @param conditionFunc
     */
    public getColMeanPonderee(rows: IRenderedData[], field_name: string, field_ponderation_name: string, conditionFunc: (row: IRenderedData) => boolean): number {
        return DataRenderController.getInstance().getColMeanPonderee(rows, field_name, field_ponderation_name, conditionFunc);
    }

    /**
     * TODO: DONOT use this, call the controller directly
     * @param rows
     * @param timeSegment
     */
    public filterDataBySegment(rows: IRenderedData[], timeSegment: TimeSegment): IRenderedData[] {
        return DataRenderController.getInstance().filterDataBySegment(rows, timeSegment);
    }

    /**
     * TODO: DONOT use this, call the controller directly
     * @param timeSegment
     * @param resource_id
     * @param field_name
     * @param field_name_cumul
     * @param segment_id
     * @param renderedDatasBySegmentAndResourceId
     */
    public getCumul<T extends IRenderedData>(
        timeSegment: TimeSegment, resource_id: number, field_name: string, field_name_cumul: string, segment_id: number,
        renderedDatasBySegmentAndResourceId: { [date_index: string]: { [resource_id: number]: { [segment_id: number]: T } } }): number {

        return DataRenderController.getInstance().getCumul(timeSegment, resource_id, field_name, field_name_cumul, segment_id, renderedDatasBySegmentAndResourceId);
    }

    /**
     * TODO: DONOT use this, call the controller directly
     * @param timeSegment
     * @param resource_id
     * @param field_name
     * @param segment_id
     * @param renderedDatasBySegmentAndResourceId
     */
    public getCumul_m_mm1_mm2<T extends IRenderedData>(
        timeSegment: TimeSegment, resource_id: number, field_name: string, segment_id: number,
        renderedDatasBySegmentAndResourceId: { [date_index: string]: { [resource_id: number]: { [segment_id: number]: T } } }): number {

        return DataRenderController.getInstance().getCumul_m_mm1_mm2(timeSegment, resource_id, field_name, segment_id, renderedDatasBySegmentAndResourceId);
    }

    /**
     * TODO: DONOT use this, call the controller directly
     * @param cumulSegment
     * @param type_segmentation
     * @param resource_id
     * @param field_name
     * @param segment_id
     * @param renderedDatasBySegmentAndResourceId
     */
    public getCumulSegment<T extends IRenderedData>(
        cumulSegment: TimeSegment, type_segmentation: number, resource_id: number, field_name: string, segment_id: number,
        renderedDatasBySegmentAndResourceId: { [date_index: string]: { [resource_id: number]: { [segment_id: number]: T } } }): number {

        return DataRenderController.getInstance().getCumulSegment(cumulSegment, type_segmentation, resource_id, field_name, segment_id, renderedDatasBySegmentAndResourceId);
    }

    /**
     * TODO: DONOT use this, call the controller directly
     * @param timeSegment
     * @param resource_id
     * @param field_name
     * @param segment_id
     * @param renderedDatasBySegmentAndResourceId
     */
    public getValueFromRendererData<T extends IRenderedData>(
        timeSegment: TimeSegment, resource_id: number, field_name: string, segment_id: number,
        renderedDatasBySegmentAndResourceId: { [date_index: string]: { [resource_id: number]: { [segment_id: number]: T } } }): number {

        return DataRenderController.getInstance().getValueFromRendererData(timeSegment, resource_id, field_name, segment_id, renderedDatasBySegmentAndResourceId);
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let label_field = new ModuleTableField('renderer_name', ModuleTableField.FIELD_TYPE_string, 'renderer_name', false);
        let datatable_fields = [
            label_field,
            new ModuleTableField('render_handler_module', ModuleTableField.FIELD_TYPE_string, 'render_handler_module', false),
        ];
        let datatable_renderer = new ModuleTable(this, DataRendererVO.API_TYPE_ID, () => new DataRendererVO(), datatable_fields, label_field, "Renderers");
        this.datatables.push(datatable_renderer);

        label_field = new ModuleTableField('date', ModuleTableField.FIELD_TYPE_string, 'date', false);
        let rendered_api_type_id = new ModuleTableField('rendered_api_type_id', ModuleTableField.FIELD_TYPE_foreign_key, 'rendered_api_type_id', false);
        datatable_fields = [
            rendered_api_type_id,
            new ModuleTableField('data_time_segment_json', ModuleTableField.FIELD_TYPE_string, 'data_time_segment_json', false),
            label_field,
            new ModuleTableField('state', ModuleTableField.FIELD_TYPE_int, 'state', false),
            new ModuleTableField('message', ModuleTableField.FIELD_TYPE_string, 'message', false),
        ];

        let datatable_log = new ModuleTable(this, DataRenderingLogVO.API_TYPE_ID, () => new DataRenderingLogVO(), datatable_fields, label_field, "Logs de render");
        rendered_api_type_id.addManyToOneRelation(datatable_renderer);
        this.datatables.push(datatable_log);
    }
}