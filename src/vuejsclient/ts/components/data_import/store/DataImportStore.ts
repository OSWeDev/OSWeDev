import { ActionContext, ActionTree, GetterTree, MutationTree } from "vuex";
import { Action, Getter, namespace } from 'vuex-class/lib/bindings';
import { getStoreAccessors } from "vuex-typescript";
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import IStoreModule from '../../../../../vuejsclient/ts/store/IStoreModule';
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import { stat } from 'fs';

export type DataImportContext = ActionContext<IDataImportState, any>;

export interface IDataImportState {
    options: any,
    options_validator: (options: any) => boolean,
    historic_options_tester: (historic: DataImportHistoricVO, options: any) => boolean,
    historic_to_pre_select_options_from: DataImportHistoricVO,
    api_type_id_tester: (api_type_id: string) => boolean
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
            historic_to_pre_select_options_from: null,
            api_type_id_tester: (api_type_id: string) => true
        };


        this.getters = {
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

            getHistoricToPreSelectOptionsFrom(state: IDataImportState): DataImportHistoricVO {
                return state.historic_to_pre_select_options_from;
            }
        };



        this.mutations = {
            setApiTypeIdTester(state: IDataImportState, api_type_id_tester: (api_type_id: string) => boolean) {
                state.api_type_id_tester = api_type_id_tester;
            },

            setOptions(state: IDataImportState, options: any) {
                state.options = options;
            },

            setHistoricToPreSelectOptionsFrom(state: IDataImportState, historic_to_pre_select_options_from: DataImportHistoricVO) {
                state.historic_to_pre_select_options_from = historic_to_pre_select_options_from;
            },

            setHistoricOptionsTester(state: IDataImportState, historic_options_tester: (historic: DataImportHistoricVO, options: any) => boolean) {
                state.historic_options_tester = historic_options_tester;
            },

            setOptionsValidator(state: IDataImportState, options_validator: (options: any) => boolean) {
                state.options_validator = options_validator;
            },
        };



        this.actions = {
            setApiTypeIdTester(context: DataImportContext, api_type_id_tester: (api_type_id: string) => boolean) {
                commitSetApiTypeIdTester(context, api_type_id_tester);
            },

            setOptions(context: DataImportContext, options: any) {
                commitSetOptions(context, options);
            },

            setHistoricToPreSelectOptionsFrom(context: DataImportContext, historic_to_pre_select_options_from: DataImportHistoricVO) {
                commitSetHistoricToPreSelectOptionsFrom(context, historic_to_pre_select_options_from);
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
export const commitSetHistoricToPreSelectOptionsFrom = commit(DataImportStoreInstance.mutations.setHistoricToPreSelectOptionsFrom);
export const commitSetApiTypeIdTester = commit(DataImportStoreInstance.mutations.setApiTypeIdTester);


