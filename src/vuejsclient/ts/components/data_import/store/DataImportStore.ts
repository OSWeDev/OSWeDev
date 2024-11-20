
import { ActionContext, ActionTree, GetterTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from "../../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import TimeSegmentHandler from '../../../../../shared/tools/TimeSegmentHandler';
import IStoreModule from '../../../store/IStoreModule';
import { store_mutations_names } from "../../../store/StoreModuleBase";

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

    private static instance: DataImportStore;

    public module_name: string;
    public state: any;
    public getters: GetterTree<IDataImportState, DataImportContext>;
    public mutations = {

        reinitStoreValues(state: IDataImportState) {
            state.options = {};
            state.options_validator = (options: any) => true;
            state.historic_options_tester = (historic: DataImportHistoricVO, options: any) => true;
            state.api_type_id_tester = (api_type_id: string) => true;
            state.segment_type = TimeSegment.TYPE_MONTH;
            state.segment_offset = 9;
            state.lower_segment = TimeSegmentHandler.getCorrespondingTimeSegment(Dates.now(), TimeSegment.TYPE_MONTH);
            state.segment_number = 12;
        },

        previous_segments(state: IDataImportState) {
            state.lower_segment = TimeSegmentHandler.getPreviousTimeSegment(state.lower_segment, state.segment_type, state.segment_offset);
        },

        next_segments(state: IDataImportState) {
            state.lower_segment = TimeSegmentHandler.getPreviousTimeSegment(state.lower_segment, state.segment_type, -state.segment_offset);
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
    public actions: ActionTree<IDataImportState, DataImportContext>;
    public namespaced: boolean = true;

    protected constructor() {
        const self = this;
        this.module_name = "DataImportStore";


        this.state = {
            options: {},
            options_validator: (options: any) => true,
            historic_options_tester: (historic: DataImportHistoricVO, options: any) => true,
            api_type_id_tester: (api_type_id: string) => true,
            segment_type: TimeSegment.TYPE_MONTH,
            segment_offset: 9,
            lower_segment: TimeSegmentHandler.getCorrespondingTimeSegment(Dates.now(), TimeSegment.TYPE_MONTH),
            segment_number: 12
        };


        this.getters = {
            getsegments(state: IDataImportState): TimeSegment[] {
                const res: TimeSegment[] = [];
                const medium_segment_i: number = Math.floor(state.segment_number / 2);

                if (state.segment_number < 1) {
                    return res;
                }

                let lower_time_segment = state.lower_segment ? state.lower_segment : null;
                if (!lower_time_segment) {
                    lower_time_segment = TimeSegmentHandler.getCorrespondingTimeSegment(Dates.now(), state.segment_type);

                    lower_time_segment = TimeSegmentHandler.getPreviousTimeSegment(lower_time_segment, state.segment_type, medium_segment_i);
                }

                if (lower_time_segment.type != state.segment_type) {
                    lower_time_segment = TimeSegmentHandler.getCorrespondingTimeSegment(lower_time_segment.index, state.segment_type);
                }

                let segment = lower_time_segment;
                for (let i = 0; i < state.segment_number; i++) {
                    res.push(segment);
                    segment = TimeSegmentHandler.getPreviousTimeSegment(segment, state.segment_type, -1);
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

        this.actions = {
            reinitStoreValues: (context: DataImportContext) => context.commit(store_mutations_names(this).reinitStoreValues, null),
            previous_segments: (context: DataImportContext) => context.commit(store_mutations_names(this).previous_segments, null),
            next_segments: (context: DataImportContext) => context.commit(store_mutations_names(this).next_segments, null),
            setApiTypeIdTester: (context: DataImportContext, api_type_id_tester: (api_type_id: string) => boolean) => context.commit(store_mutations_names(this).setApiTypeIdTester, api_type_id_tester),
            setsegment_type: (context: DataImportContext, segment_type: number) => context.commit(store_mutations_names(this).setsegment_type, segment_type),
            setsegment_offset: (context: DataImportContext, segment_offset: number) => context.commit(store_mutations_names(this).setsegment_offset, segment_offset),
            setlower_segment: (context: DataImportContext, lower_segment: number) => context.commit(store_mutations_names(this).setlower_segment, lower_segment),
            setsegment_number: (context: DataImportContext, segment_number: number) => context.commit(store_mutations_names(this).setsegment_number, segment_number),
            setOptions: (context: DataImportContext, options: any) => context.commit(store_mutations_names(this).setOptions, options),
            setHistoricOptionsTester: (context: DataImportContext, historic_options_tester: (historic: DataImportHistoricVO, options: any) => boolean) => context.commit(store_mutations_names(this).setHistoricOptionsTester, historic_options_tester),
            setOptionsValidator: (context: DataImportContext, options_validator: (options: any) => boolean) => context.commit(store_mutations_names(this).setOptionsValidator, options_validator),
        };
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): DataImportStore {
        if (!DataImportStore.instance) {
            DataImportStore.instance = new DataImportStore();
        }
        return DataImportStore.instance;
    }
}

export const DataImportStoreInstance = DataImportStore.getInstance();

const __namespace = namespace('DataImportStore');
export const ModuleDataImportGetter = __namespace.Getter;
export const ModuleDataImportAction = __namespace.Action;