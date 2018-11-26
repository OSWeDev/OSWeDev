import * as moment from 'moment';
import { Moment } from 'moment';
import { isNumber } from 'util';
import DateHandler from '../../tools/DateHandler';
import ModuleAPI from '../API/ModuleAPI';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import Module from '../Module';
import ModulesManager from '../ModulesManager';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import IRenderedData from './interfaces/IRenderedData';
import DataRendererVO from './vos/DataRendererVO';
import DataRenderingLogVO from './vos/DataRenderingLogVO';
import TimeSegment from './vos/TimeSegment';
import StringParamVO from '../API/vos/apis/StringParamVO';
import TimeSegmentHandler from '../../tools/TimeSegmentHandler';

export default class ModuleDataRender extends Module {

    public static APINAME_GET_DATA_RENDERERS = "GET_DATA_RENDERERS";
    public static APINAME_GET_DATA_RENDERER = "GET_DATA_RENDERER";
    public static APINAME_CLEAR_DATA_SEGMENTS = "CLEAR_DATA_SEGMENTS";
    public static APINAME_GET_DATA_RENDERING_LOGS = "GET_DATA_RENDERING_LOGS";
    public static APINAME_getLatestAvailableSegment = "getLatestAvailableSegment";

    public static getInstance(): ModuleDataRender {
        if (!ModuleDataRender.instance) {
            ModuleDataRender.instance = new ModuleDataRender();
        }
        return ModuleDataRender.instance;
    }

    private static instance: ModuleDataRender = null;

    private datatable_log: ModuleTable<DataRenderingLogVO>;
    private datatable_renderer: ModuleTable<DataRendererVO>;

    private constructor() {

        super("data_render", "DataRender");
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, DataRendererVO[]>(
            ModuleDataRender.APINAME_GET_DATA_RENDERERS,
            [DataRendererVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<StringParamVO, DataRendererVO>(
            ModuleDataRender.APINAME_GET_DATA_RENDERER,
            [DataRendererVO.API_TYPE_ID],
            StringParamVO.translateCheckAccessParams,
            StringParamVO.URL,
            StringParamVO.translateToURL,
            StringParamVO.translateFromREQ
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<void, DataRenderingLogVO[]>(
            ModuleDataRender.APINAME_GET_DATA_RENDERING_LOGS,
            [DataRenderingLogVO.API_TYPE_ID]
        ));
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<StringParamVO, TimeSegment>(
            ModuleDataRender.APINAME_getLatestAvailableSegment,
            [DataRendererVO.API_TYPE_ID],
            StringParamVO.translateCheckAccessParams,
            StringParamVO.URL,
            StringParamVO.translateToURL,
            StringParamVO.translateFromREQ
        ));
    }

    public async getLatestAvailableSegment(api_name: string): Promise<TimeSegment> {
        return await ModuleAPI.getInstance().handleAPI<StringParamVO, TimeSegment>(ModuleDataRender.APINAME_getLatestAvailableSegment, api_name);
    }

    /**
     * Calcul le % de trend pour aller du départ à l'arrivée
     * @param value_a Valeur de départ
     * @param value_b Valeur d'arrivée
     * @returns number entre 0 et 1, ou 999 pour + infini
     */
    public getTrendP(value_a: number, value_b: number): number {

        if ((!value_a) || ((value_a < 0) && (value_b > 0))
            || ((value_a > 0) && (value_b < 0))) {
            return value_b > 0 ? 999 : (value_b < 0 ? -999 : 0);
        }

        if (((value_b / value_a) - 1) > 99) {
            return 999;
        }

        if (((value_b / value_a) - 1) < -99) {
            return -999;
        }

        return (value_b / value_a) - 1;
    }

    /**
     * Calcul le trend (en number) pour aller du départ à l'arrivée
     * @param value_a Valeur de départ
     * @param value_b Valeur d'arrivée
     * @returns la différence entre l'arrivée et le départ
     */
    public getTrend(value_a: number, value_b: number): number {

        if (!isNumber(value_a)) {
            return value_b;
        }

        if (!isNumber(value_b)) {
            return -value_a;
        }

        return (value_b - value_a);
    }

    /**
     * Calcul le pourcentage entre 2 valeurs
     * @param value_a Numérateur
     * @param value_b Dénominateur
     */
    public getPrct(value_a: number, value_b: number): number {

        if (!isNumber(value_a) || !isNumber(value_b) || !value_b) {
            return null;
        }

        return value_a / value_b;
    }

    public async getDataRenderers(): Promise<DataRendererVO[]> {
        return await ModuleAPI.getInstance().handleAPI<void, DataRendererVO[]>(ModuleDataRender.APINAME_GET_DATA_RENDERERS);
    }

    public async getDataRenderer(renderer_name: string): Promise<DataRendererVO> {
        return await ModuleAPI.getInstance().handleAPI<StringParamVO, DataRendererVO>(ModuleDataRender.APINAME_GET_DATA_RENDERER, renderer_name);
    }

    public async getDataRenderingLogs(): Promise<DataRenderingLogVO[]> {
        return await ModuleAPI.getInstance().handleAPI<void, DataRenderingLogVO[]>(ModuleDataRender.APINAME_GET_DATA_RENDERING_LOGS);
    }

    public getCount(rows: IRenderedData[], conditionFunc: (row: IRenderedData) => boolean): number {
        let res = 0;
        for (let i in rows) {
            let row: IRenderedData = rows[i];

            if (!row) {
                continue;
            }

            if (conditionFunc && (!conditionFunc(row))) {
                continue;
            }

            res++;
        }
        return res;
    }

    public getColSomme(rows: IRenderedData[], field_name: string, conditionFunc: (row: IRenderedData) => boolean): number {
        let res = 0;
        let has_data: boolean = false;
        for (let i in rows) {
            let row: IRenderedData = rows[i];

            if ((!row) || (typeof row[field_name] == 'undefined') || (!isNumber(row[field_name]))) {
                continue;
            }

            if (conditionFunc && (!conditionFunc(row))) {
                continue;
            }

            has_data = true;
            res += row[field_name];
        }

        if (!has_data) {
            return null;
        }
        return res;
    }

    public getColMean(rows: IRenderedData[], field_name: string, conditionFunc: (row: IRenderedData) => boolean): number {
        let res = 0;
        let nb_datas: number = 0;
        for (let i in rows) {
            let row: IRenderedData = rows[i];

            if ((!row) || (typeof row[field_name] == 'undefined') || (!isNumber(row[field_name])) || (!row[field_name])) {
                continue;
            }

            if (conditionFunc && (!conditionFunc(row))) {
                continue;
            }

            nb_datas++;
            res += row[field_name];
        }

        if (!nb_datas) {
            return null;
        }
        return res / nb_datas;
    }

    public getColMeanPonderee(rows: IRenderedData[], field_name: string, field_ponderation_name: string, conditionFunc: (row: IRenderedData) => boolean): number {
        let res = 0;
        let nb_datas: number = 0;
        let ponderation: number = 0;

        for (let i in rows) {
            let row: IRenderedData = rows[i];

            if ((!row) || (typeof row[field_name] == 'undefined') || (!isNumber(row[field_name]))) {
                continue;
            }

            if (conditionFunc && (!conditionFunc(row))) {
                continue;
            }

            let poids = row[field_ponderation_name];
            if ((typeof poids == 'undefined') || (!isNumber(poids))) {
                poids = 1;
            }

            nb_datas++;
            ponderation += poids;
            res += (row[field_name] * poids);
        }

        if ((!nb_datas) || (!ponderation)) {
            return null;
        }
        return res / ponderation;
    }

    public filterDataBySegment(rows: IRenderedData[], timeSegment: TimeSegment): IRenderedData[] {
        let res: IRenderedData[] = [];
        for (let i in rows) {
            let row: IRenderedData = rows[i];

            if ((!row) || (typeof row.data_dateindex == 'undefined')) {
                continue;
            }

            if (!TimeSegmentHandler.getInstance().isMomentInTimeSegment(moment(row.data_dateindex), timeSegment)) {
                continue;
            }

            res.push(row);
        }

        return res;
    }

    public getCumul<T extends IRenderedData>(
        timeSegment: TimeSegment, id: number, field_name: string, field_name_cumul: string, segclient_id: number,
        ventesExtBySegmentAndConcessionId: { [date_index: string]: { [concession_id: number]: { [segclient_id: number]: T } } }): number {

        let timeSegment_prec: TimeSegment = TimeSegmentHandler.getInstance().getPreviousTimeSegment(timeSegment);

        let previousCumul: number = this.getValueFromRendererData(timeSegment_prec, id, field_name_cumul, segclient_id, ventesExtBySegmentAndConcessionId);
        let value: number = this.getValueFromRendererData(timeSegment, id, field_name, segclient_id, ventesExtBySegmentAndConcessionId);

        let hasPreviousValue: boolean = isNumber(previousCumul);
        let hasValue: boolean = isNumber(value);
        let isInSameSegmentType: boolean = TimeSegmentHandler.getInstance().isInSameSegmentType(timeSegment, timeSegment_prec, TimeSegment.TYPE_YEAR);

        if (hasValue && hasPreviousValue && isInSameSegmentType) {
            return previousCumul + value;
        }

        if (hasPreviousValue && isInSameSegmentType) {
            return previousCumul;
        }

        if (hasValue) {
            return value;
        }

        return null;
    }

    public getCumul_m_mm1_mm2<T extends IRenderedData>(
        timeSegment: TimeSegment, concession_id: number, field_name: string, segclient_id: number,
        ventesExtBySegmentAndConcessionId: { [date_index: string]: { [concession_id: number]: { [segclient_id: number]: T } } }): number {

        let timeSegment_mm1: TimeSegment = TimeSegmentHandler.getInstance().getPreviousTimeSegment(timeSegment);
        let timeSegment_mm2: TimeSegment = TimeSegmentHandler.getInstance().getPreviousTimeSegment(timeSegment);
        let value_m: number = this.getValueFromRendererData(timeSegment, concession_id, field_name, segclient_id, ventesExtBySegmentAndConcessionId);
        let value_mm1: number = this.getValueFromRendererData(timeSegment_mm1, concession_id, field_name, segclient_id, ventesExtBySegmentAndConcessionId);
        let value_mm2: number = this.getValueFromRendererData(timeSegment_mm2, concession_id, field_name, segclient_id, ventesExtBySegmentAndConcessionId);

        let hasValue_m: boolean = isNumber(value_m);
        let hasValue_mm1: boolean = isNumber(value_mm1);
        let hasValue_mm2: boolean = isNumber(value_mm2);

        value_m = value_m ? value_m : 0;
        value_mm1 = value_mm1 ? value_mm1 : 0;
        value_mm2 = value_mm2 ? value_mm2 : 0;

        if (hasValue_m || hasValue_mm1 || hasValue_mm2) {
            return value_m + value_mm1 + value_mm2;
        }

        return null;
    }

    public getValueFromRendererData<T extends IRenderedData>(
        timeSegment: TimeSegment, concession_id: number, field_name: string, segclient_id: number,
        ventesExtBySegmentAndConcessionId: { [date_index: string]: { [concession_id: number]: { [segclient_id: number]: T } } }): number {

        let hasValue: boolean = (ventesExtBySegmentAndConcessionId[timeSegment.dateIndex] &&
            ventesExtBySegmentAndConcessionId[timeSegment.dateIndex][concession_id] &&
            ventesExtBySegmentAndConcessionId[timeSegment.dateIndex][concession_id][segclient_id ? segclient_id : 0] &&
            ventesExtBySegmentAndConcessionId[timeSegment.dateIndex][concession_id][segclient_id ? segclient_id : 0][field_name]);

        if (hasValue) {
            return ventesExtBySegmentAndConcessionId[timeSegment.dateIndex][concession_id][segclient_id ? segclient_id : 0][field_name];
        }
        return null;
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        let label_field = new ModuleTableField('renderer_name', ModuleTableField.FIELD_TYPE_string, 'renderer_name', false);
        let datatable_fields = [
            label_field,
            new ModuleTableField('render_handler_module', ModuleTableField.FIELD_TYPE_string, 'render_handler_module', false),
        ];
        this.datatable_renderer = new ModuleTable(this, DataRendererVO.API_TYPE_ID, datatable_fields, label_field, "Renderers");
        this.datatables.push(this.datatable_renderer);

        label_field = new ModuleTableField('date', ModuleTableField.FIELD_TYPE_string, 'date', false);
        let rendered_api_type_id = new ModuleTableField('rendered_api_type_id', ModuleTableField.FIELD_TYPE_foreign_key, 'rendered_api_type_id', false);
        datatable_fields = [
            rendered_api_type_id,
            new ModuleTableField('data_time_segment_json', ModuleTableField.FIELD_TYPE_string, 'data_time_segment_json', false),
            label_field,
            new ModuleTableField('state', ModuleTableField.FIELD_TYPE_int, 'state', false),
            new ModuleTableField('message', ModuleTableField.FIELD_TYPE_string, 'message', false),
        ];

        this.datatable_log = new ModuleTable(this, DataRenderingLogVO.API_TYPE_ID, datatable_fields, label_field, "Logs de render");
        rendered_api_type_id.addManyToOneRelation(this.datatable_renderer);
        this.datatables.push(this.datatable_log);
    }
}