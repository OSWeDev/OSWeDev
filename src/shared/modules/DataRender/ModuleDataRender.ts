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

    public dataRenderers_by_name: { [name: string]: DataRendererVO } = {};
    public dataRenderers_by_id: { [id: number]: DataRendererVO } = {};

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

    public async hook_module_async_client_admin_initialization() {
        await this.preload();
    }

    public async hook_module_configure() {
        await this.preload();
        return true;
    }

    private async preload() {
        // On précharge les DataImportFile pour être synchrone sur l'admin sur ce sujet et pouvoir créer les menus adaptés
        let dataRenderers: DataRendererVO[] = await this.getDataRenderers();

        for (let i in dataRenderers) {
            let dataRenderer: DataRendererVO = dataRenderers[i];

            this.dataRenderers_by_name[dataRenderer.renderer_name] = dataRenderer;
            this.dataRenderers_by_id[dataRenderer.id] = dataRenderer;
        }
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

    /**
     *
     * @param start
     * @param end
     * @param time_segment_type
     */
    public getAllDataTimeSegments(start: Moment, end: Moment, time_segment_type: string, exclude_end: boolean = false): TimeSegment[] {
        let res: TimeSegment[] = [];
        let date: Moment = moment(start);
        let stop_at: Moment = moment(end);

        switch (time_segment_type) {
            case TimeSegment.TYPE_YEAR:
                date = start.startOf('year');
                stop_at = end.startOf('year');
                break;
            case TimeSegment.TYPE_MONTH:
                date = start.startOf('month');
                stop_at = end.startOf('month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                date = start.startOf('day');
                stop_at = end.startOf('day');
        }

        while (((!exclude_end) && date.isSameOrBefore(stop_at)) || (exclude_end && date.isBefore(stop_at))) {

            let timeSegment: TimeSegment = new TimeSegment();
            timeSegment.dateIndex = DateHandler.getInstance().formatDayForIndex(date);
            timeSegment.type = time_segment_type;
            res.push(timeSegment);

            switch (time_segment_type) {
                case TimeSegment.TYPE_YEAR:
                    date = date.add(1, 'year');
                    break;
                case TimeSegment.TYPE_MONTH:
                    date = date.add(1, 'month');
                    break;
                case TimeSegment.TYPE_DAY:
                default:
                    date = date.add(1, 'day');
            }
        }

        return res;
    }

    /**
     *
     * @param timeSegment
     * @param type_cumul Type > au timesegment.type (YEAR si le segment est MONTH par exemple au minimum)
     * @returns Corresponding CumulTimeSegment
     */
    public getParentTimeSegment(timeSegment: TimeSegment): TimeSegment {
        let res: TimeSegment = new TimeSegment();
        let date_segment: Moment = moment(timeSegment.dateIndex);

        switch (timeSegment.type) {
            case TimeSegment.TYPE_YEAR:
                // Impossible de gérer ce cas;
                return null;
            case TimeSegment.TYPE_MONTH:
                res.type = TimeSegment.TYPE_YEAR;
                date_segment = date_segment.startOf('year');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                res.type = TimeSegment.TYPE_MONTH;
                date_segment = date_segment.startOf('month');
        }

        res.dateIndex = DateHandler.getInstance().formatDayForIndex(date_segment);
        return res;
    }

    /**
     *
     * @param timeSegment
     * @returns Corresponding CumulTimeSegment
     */
    public getCumulTimeSegments(timeSegment: TimeSegment): TimeSegment[] {
        let res: TimeSegment[] = [];
        let parentTimeSegment: TimeSegment = this.getParentTimeSegment(timeSegment);

        let start_period = this.getStartTimeSegment(parentTimeSegment);
        let end_period = this.getEndTimeSegment(timeSegment);

        return this.getAllDataTimeSegments(start_period, end_period, timeSegment.type, true);
    }

    /**
     *
     * @param timeSegment
     * @returns Inclusive lower bound of the timeSegment
     */
    public getStartTimeSegment(timeSegment: TimeSegment): Moment {
        return moment(timeSegment.dateIndex);
    }

    /**
     *
     * @param timeSegment
     * @returns Exclusive upper bound of the timeSegment
     */
    public getEndTimeSegment(timeSegment: TimeSegment): Moment {
        let res: Moment = moment(timeSegment.dateIndex);

        switch (timeSegment.type) {
            case TimeSegment.TYPE_YEAR:
                res = res.add(1, 'year');
                break;
            case TimeSegment.TYPE_MONTH:
                res = res.add(1, 'month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                res = res.add(1, 'day');
        }

        return res;
    }

    public getPreviousTimeSegments(timeSegments: TimeSegment[], type: string = null, offset: number = 1): TimeSegment[] {
        let res: TimeSegment[] = [];

        for (let i in timeSegments) {
            res.push(this.getPreviousTimeSegment(timeSegments[i], type, offset));
        }
        return res;
    }

    /**
     * @param monthSegment TimeSegment de type month (sinon renvoie null)
     * @param date Numéro du jour dans le mois [1,31]
     * @returns Le moment correspondant
     */
    public getDateInMonthSegment(monthSegment: TimeSegment, date: number): Moment {

        if (monthSegment.type != TimeSegment.TYPE_MONTH) {
            return null;
        }

        // La dateIndex d'un segment mois est le premier jour du mois.
        let res: Moment = moment(monthSegment.dateIndex);
        res.date(date);
        return res;
    }

    /**
     *
     * @param timeSegment
     * @returns Exclusive upper bound of the timeSegment
     */
    public getPreviousTimeSegment(timeSegment: TimeSegment, type: string = null, offset: number = 1): TimeSegment {
        let res: TimeSegment = new TimeSegment();
        res.type = timeSegment.type;
        let date_segment: Moment = moment(timeSegment.dateIndex);
        type = type ? type : timeSegment.type;

        switch (type) {
            case TimeSegment.TYPE_YEAR:
                date_segment = date_segment.add(-offset, 'year');
                break;
            case TimeSegment.TYPE_MONTH:
                date_segment = date_segment.add(-offset, 'month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                date_segment = date_segment.add(-offset, 'day');
        }

        res.dateIndex = DateHandler.getInstance().formatDayForIndex(date_segment);
        return res;
    }

    public getCorrespondingTimeSegment(date: Moment, type: string): TimeSegment {
        let res: TimeSegment = new TimeSegment();
        res.type = type;
        let date_segment: Moment = moment(date);

        switch (type) {
            case TimeSegment.TYPE_YEAR:
                date_segment = date_segment.startOf('year');
                break;
            case TimeSegment.TYPE_MONTH:
                date_segment = date_segment.startOf('month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                date_segment = date_segment.startOf('day');
        }

        res.dateIndex = DateHandler.getInstance().formatDayForIndex(date_segment);
        return res;
    }

    public isMomentInTimeSegment(date: Moment, time_segment: TimeSegment): boolean {
        let start: Moment = moment(time_segment.dateIndex);
        let end: Moment;

        switch (time_segment.type) {
            case TimeSegment.TYPE_YEAR:
                end = moment(start).add(1, 'year');
                break;
            case TimeSegment.TYPE_MONTH:
                end = moment(start).add(1, 'month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                end = moment(start).add(1, 'day');
        }

        return date.isSameOrAfter(start) && date.isBefore(end);
    }

    public isInSameSegmentType(ts1: TimeSegment, ts2: TimeSegment, type: string = TimeSegment.TYPE_YEAR): boolean {
        let start: Moment = moment(ts1.dateIndex);
        let end: Moment;

        switch (type) {
            case TimeSegment.TYPE_YEAR:
                start = start.startOf('year');
                end = moment(start).add(1, 'year');
                break;
            case TimeSegment.TYPE_MONTH:
                start = start.startOf('month');
                end = moment(start).add(1, 'month');
                break;
            case TimeSegment.TYPE_DAY:
            default:
                start = start.startOf('day');
                end = moment(start).add(1, 'day');
        }

        let ts2Moment: Moment = moment(ts2.dateIndex);

        return ts2Moment.isSameOrAfter(start) && ts2Moment.isBefore(end);
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

            if (!this.isMomentInTimeSegment(moment(row.data_dateindex), timeSegment)) {
                continue;
            }

            res.push(row);
        }

        return res;
    }

    public getCumul<T extends IRenderedData>(
        timeSegment: TimeSegment, id: number, field_name: string, field_name_cumul: string, segclient_id: number,
        ventesExtBySegmentAndConcessionId: { [date_index: string]: { [concession_id: number]: { [segclient_id: number]: T } } }): number {

        let timeSegment_prec: TimeSegment = ModuleDataRender.getInstance().getPreviousTimeSegment(timeSegment);

        let previousCumul: number = this.getValueFromRendererData(timeSegment_prec, id, field_name_cumul, segclient_id, ventesExtBySegmentAndConcessionId);
        let value: number = this.getValueFromRendererData(timeSegment, id, field_name, segclient_id, ventesExtBySegmentAndConcessionId);

        let hasPreviousValue: boolean = isNumber(previousCumul);
        let hasValue: boolean = isNumber(value);
        let isInSameSegmentType: boolean = ModuleDataRender.getInstance().isInSameSegmentType(timeSegment, timeSegment_prec, TimeSegment.TYPE_YEAR);

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

        let timeSegment_mm1: TimeSegment = ModuleDataRender.getInstance().getPreviousTimeSegment(timeSegment);
        let timeSegment_mm2: TimeSegment = ModuleDataRender.getInstance().getPreviousTimeSegment(timeSegment);
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
        rendered_api_type_id.addManyToOneRelation(this.datatable_log, this.datatable_renderer);
        this.datatables.push(this.datatable_log);
    }
}