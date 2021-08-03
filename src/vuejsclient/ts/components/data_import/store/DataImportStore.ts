
import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from "../../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import TimeSegmentHandler from '../../../../../shared/tools/TimeSegmentHandler';
import IStoreModule from '../../../store/IStoreModule';

export type DataImportContext = ActionContext<IDataImportState, any>;

export interface IDataImportState {
    options: any;
    options_validator: (options: any) => boolean;
    historic_options_tester: (historic: DataImportHistoricVO, options: any) => boolean;
    api_type_id_tester: (api_type_id: string) => boolean;
    segment_type: number;
    segment_offset: number;
    lower_segment: TimeSegment;
    segment_number: number;
}


export default class DataImportStore implements IStoreModule<IDataImportState, DataImportContext> {

    public static getInstance(): DataImportStore {
        if (!DataImportStore.instance) {
            DataImportStore.instance = new DataImportStore();
        }
        return DataImportStore.instance;
    }

    private static instance: DataImportStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IDataImportState, DataImportContext>;
    public mutations: MutationTree<IDataImportState>;
    public actions: ActionTree<IDataImportState, DataImportContext>;
    public namespaced: boolean = true;

    protected constructor() {
        let self = this;
        this.module_name = "DataImportStore";


        this.state = {
            options: {},
            options_validator: (options: any) => true,
            historic_options_tester: (historic: DataImportHistoricVO, options: any) => true,
            api_type_id_tester: (api_type_id: string) => true,
            segment_type: TimeSegment.TYPE_MONTH,
            segment_offset: 9,
            lower_segment: TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(Dates.now(), TimeSegment.TYPE_MONTH),
            segment_number: 12
        };


        this.getters = {
            getsegments(state: IDataImportState): TimeSegment[] {
                let res: TimeSegment[] = [];
                let medium_segment_i: number = Math.floor(state.segment_number / 2);

                if (state.segment_number < 1) {
                    return res;
                }

                let lower_time_segment = state.lower_segment ? state.lower_segment : null;
                if (!lower_time_segment) {
                    lower_time_segment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(Dates.now(), state.segment_type);

                    lower_time_segment = TimeSegmentHandler.getInstance().getPreviousTimeSegment(lower_time_segment, state.segment_type, medium_segment_i);
                }

                if (lower_time_segment.type != state.segment_type) {
                    lower_time_segment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(lower_time_segment.index, state.segment_type);
                }

                let segment = lower_time_segment;
                for (let i = 0; i < state.segment_number; i++) {
                    res.push(segment);
                    segment = TimeSegmentHandler.getInstance().getPreviousTimeSegment(segment, state.segment_type, -1);
                }

                return res;
            },

            getsegment_type(state: IDataImportState): number {
                return state.segment_type;
            },

            getsegment_offset(state: IDataImportState): number {
                return state.segment_offset;
            },

            getlower_segment(state: IDataImportState): TimeSegment {
                return state.lower_segment;
            },

            getsegment_number(state: IDataImportState): number {
                return state.segment_number;
            },

            getApiTypeIdTester(state: IDataImportState): (api_type_id: string) => boolean {
                return state.api_type_id_tester;
            },

            hasValidOptions(state: IDataImportState): boolean {
                return state.options_validator(state.options);
            },

            getOptions(state: IDataImportState): any {
                return state.options;
            },

            getHistoricOptionsTester(state: IDataImportState): (historic: DataImportHistoricVO, options: any) => boolean {
                return state.historic_options_tester;
            },
        };



        this.mutations = {

            reinitStoreValues(state: IDataImportState) {
                state.options = {};
                state.options_validator = (options: any) => true;
                state.historic_options_tester = (historic: DataImportHistoricVO, options: any) => true;
                state.api_type_id_tester = (api_type_id: string) => true;
                state.segment_type = TimeSegment.TYPE_MONTH;
                state.segment_offset = 9;
                state.lower_segment = TimeSegmentHandler.getInstance().getCorrespondingTimeSegment(Dates.now(), TimeSegment.TYPE_MONTH);
                state.segment_number = 12;
            },

            previous_segments(state: IDataImportState) {
                state.lower_segment = TimeSegmentHandler.getInstance().getPreviousTimeSegment(state.lower_segment, state.segment_type, state.segment_offset);
            },

            next_segments(state: IDataImportState) {
                state.lower_segment = TimeSegmentHandler.getInstance().getPreviousTimeSegment(state.lower_segment, state.segment_type, -state.segment_offset);
            },

            setApiTypeIdTester(state: IDataImportState, api_type_id_tester: (api_type_id: string) => boolean) {
                state.api_type_id_tester = api_type_id_tester;
            },

            setsegment_type(state: IDataImportState, segment_type: number) {
                state.segment_type = segment_type;
            },

            setsegment_offset(state: IDataImportState, segment_offset: number) {
                state.segment_offset = segment_offset;
            },

            setlower_segment(state: IDataImportState, lower_segment: TimeSegment) {
                state.lower_segment = lower_segment;
            },

            setsegment_number(state: IDataImportState, segment_number: number) {
                state.segment_number = segment_number;
            },

            setOptions(state: IDataImportState, options: any) {
                state.options = options;
            },

            setHistoricOptionsTester(state: IDataImportState, historic_options_tester: (historic: DataImportHistoricVO, options: any) => boolean) {
                state.historic_options_tester = historic_options_tester;
            },

            setOptionsValidator(state: IDataImportState, options_validator: (options: any) => boolean) {
                state.options_validator = options_validator;
            },
        };



        this.actions = {

            reinitStoreValues(context: DataImportContext) {
                commitreinitStoreValues(context, null);
            },

            previous_segments(context: DataImportContext) {
                commitprevious_segments(context, null);
            },

            next_segments(context: DataImportContext) {
                commitnext_segments(context, null);
            },

            setApiTypeIdTester(context: DataImportContext, api_type_id_tester: (api_type_id: string) => boolean) {
                commitSetApiTypeIdTester(context, api_type_id_tester);
            },

            setsegment_type(context: DataImportContext, segment_type: number) {
                commitSetsegment_type(context, segment_type);
            },

            setsegment_offset(context: DataImportContext, segment_offset: number) {
                commitSetsegment_offset(context, segment_offset);
            },

            setlower_segment(context: DataImportContext, lower_segment: number) {
                commitSetlower_segment(context, lower_segment);
            },

            setsegment_number(context: DataImportContext, segment_number: number) {
                commitSetsegment_number(context, segment_number);
            },

            setOptions(context: DataImportContext, options: any) {
                commitSetOptions(context, options);
            },

            setHistoricOptionsTester(context: DataImportContext, historic_options_tester: (historic: DataImportHistoricVO, options: any) => boolean) {
                commitSetHistoricOptionsTester(context, historic_options_tester);
            },

            setOptionsValidator(context: DataImportContext, options_validator: (options: any) => boolean) {
                commitSetOptionsValidator(context, options_validator);
            },
        };
    }
}

export const DataImportStoreInstance = DataImportStore.getInstance();


const { commit, read, dispatch } =
    getStoreAccessors<IDataImportState, any>("DataImportStore"); // We pass namespace here, if we make the module namespaced: true.
export const ModuleDataImportGetter = namespace('DataImportStore', Getter);
export const ModuleDataImportAction = namespace('DataImportStore', Action);

export const commitSetOptions = commit(DataImportStoreInstance.mutations.setOptions);
export const commitSetHistoricOptionsTester = commit(DataImportStoreInstance.mutations.setHistoricOptionsTester);
export const commitSetOptionsValidator = commit(DataImportStoreInstance.mutations.setOptionsValidator);
export const commitSetApiTypeIdTester = commit(DataImportStoreInstance.mutations.setApiTypeIdTester);
export const commitSetsegment_type = commit(DataImportStoreInstance.mutations.setsegment_type);
export const commitSetsegment_offset = commit(DataImportStoreInstance.mutations.setsegment_offset);
export const commitSetlower_segment = commit(DataImportStoreInstance.mutations.setlower_segment);
export const commitSetsegment_number = commit(DataImportStoreInstance.mutations.setsegment_number);
export const commitprevious_segments = commit(DataImportStoreInstance.mutations.previous_segments);
export const commitnext_segments = commit(DataImportStoreInstance.mutations.next_segments);
export const commitreinitStoreValues = commit(DataImportStoreInstance.mutations.reinitStoreValues);