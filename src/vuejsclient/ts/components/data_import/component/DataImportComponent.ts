
import moment from 'moment';
import Component from 'vue-class-component';
import { Prop, Vue, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ModuleDataImport from '../../../../../shared/modules/DataImport/ModuleDataImport';
import DataImportFormatVO from '../../../../../shared/modules/DataImport/vos/DataImportFormatVO';
import DataImportHistoricVO from '../../../../../shared/modules/DataImport/vos/DataImportHistoricVO';
import DataImportLogVO from '../../../../../shared/modules/DataImport/vos/DataImportLogVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import FileVO from '../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import TimeSegmentHandler from '../../../../../shared/tools/TimeSegmentHandler';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../../ts/components/dao/store/DaoStore';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import VueAppController from '../../../../VueAppController';
import AjaxCacheClientController from '../../../modules/AjaxCache/AjaxCacheClientController';
import FileComponent from '../../file/FileComponent';
import DataImportComponentBase from '../base/DataImportComponentBase';
import DataImportAdminVueModule from '../DataImportAdminVueModule';
import { ModuleDataImportAction, ModuleDataImportGetter } from '../store/DataImportStore';
import './DataImportComponent.scss';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import NumRange from '../../../../../shared/modules/DataRender/vos/NumRange';
import RangeHandler from '../../../../../shared/tools/RangeHandler';
import { debounce } from 'lodash';
import { field_names } from '../../../../../shared/tools/ObjectHandler';

@Component({
    template: require('./DataImportComponent.pug'),
    components: {
        fileinput: FileComponent
    }
})
export default class DataImportComponent extends DataImportComponentBase {
    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @ModuleDataImportAction
    public previous_segments: () => void;
    @ModuleDataImportAction
    public next_segments: () => void;

    @ModuleDataImportAction
    public setlower_segment: (getlower_segment: TimeSegment) => void;

    @ModuleDataImportGetter
    public hasValidOptions: boolean;

    @ModuleDataImportGetter
    public getHistoricOptionsTester: (historic: DataImportHistoricVO, options: any) => boolean;

    @ModuleDataImportGetter
    public getOptions: any;

    @ModuleDataImportGetter
    public getsegments: TimeSegment[];

    @ModuleDataImportGetter
    public getsegment_type: number;

    @ModuleDataImportGetter
    public getsegment_offset: number;

    @ModuleDataImportGetter
    public getlower_segment: TimeSegment;

    @ModuleDataImportGetter
    public getsegment_number: number;

    @ModuleDataImportGetter
    public getApiTypeIdTester: (api_type_id: string) => boolean;

    @ModuleDataImportAction
    public setOptionsValidator: (options_validator: (options: any) => boolean) => void;

    @Prop()
    public title: string;

    @Prop({ default: null })
    public import_overview_component: VueComponentBase;
    @Prop({ default: null })
    public import_param_component: VueComponentBase;
    @Prop({ default: false })
    public autovalidate_default_value: boolean;
    @Prop({ default: true })
    public show_autovalidate: boolean;

    @Prop()
    public api_type_ids: string[];

    @Prop()
    public route_path: string;

    @Prop({ default: null })
    public valid_segments: TimeSegment[];

    @Prop({ default: null })
    public initial_selected_segment: number;

    @Prop({ default: false })
    public modal_show: boolean;

    @Prop({ default: null })
    public get_url_for_modal: (segment_date_index: number) => string;

    @Prop({ default: false })
    public force_show_overview: boolean;

    @Prop({ default: true })
    public show_import: boolean;

    @Prop({ default: null })
    public accordion_elements: Array<{ id: number, label: string }>;

    @Prop({ default: null })
    public validate_previous_segment: TimeSegment;

    @Prop({ default: true })
    public show_multiple_segments: boolean;

    @Prop({ default: false })
    public hide_btn_delete_file: boolean;

    public show_new_import: boolean = false;

    private selected_segment: TimeSegment = null;

    private autovalidate: boolean = false;

    private lower_selected_date_index: string = null;
    private upper_selected_date_index: string = null;

    private importing_multiple_segments: boolean = false;
    private importing_multiple_segments_current_segment: TimeSegment = null;
    private importing_multiple_segments_filevo_id: number = null;

    private debounced_reload_datas = debounce(this.reload_datas, 300);

    @Watch("$route")
    public async onrouteChange() {
        await this.handle_modal_show_hide();
    }

    @Watch('getOptions')
    public onChangeOptions() {
        if (this.importing_multiple_segments) {
            this.snotify.info(this.label('imports.stop_imports_multiples'));
            this.importing_multiple_segments = false;
        }
    }

    @Watch('autovalidate')
    public onChangeAutovalidate() {
        if (this.importing_multiple_segments) {
            this.snotify.info(this.label('imports.stop_imports_multiples'));
            this.importing_multiple_segments = false;
        }
    }

    @Watch('lower_selected_date_index')
    public onChangeLowerSelectedDateIndex() {
        if (this.importing_multiple_segments) {
            this.snotify.info(this.label('imports.stop_imports_multiples'));
            this.importing_multiple_segments = false;
        }
    }

    @Watch('upper_selected_date_index')
    public onChangeUpperSelectedDateIndex() {
        if (this.importing_multiple_segments) {
            this.snotify.info(this.label('imports.stop_imports_multiples'));
            this.importing_multiple_segments = false;
        }
    }

    @Watch('valid_api_type_ids', { immediate: true })
    @Watch('getsegments')
    public async onchange_getsegments() {
        await this.debounced_reload_datas();
    }

    @Watch('import_historics')
    public async loadRawImportedDatasSelected_segment(timeSegment: TimeSegment) {
        await this.loadRawImportedDatas(this.selected_segment);
    }

    @Watch('selected_segment')
    public async onchange_selected_segment() {
        if (this.selected_segment && this.import_historics) {
            this.show_new_import = (!this.import_historics[this.selected_segment.index]) ? true : false;
        }
    }

    @Watch('selected_import_is_finished')
    public async onselected_import_is_finished() {
        if (!this.importing_multiple_segments) {
            return;
        }

        if (!this.selected_import_is_finished) {
            return;
        }

        // On attend un peu pour lancer potentiellement le suivant, il y a des délais de mise à jour des historiques parfois, il faut les prendre en compte
        setTimeout(this.continue_multiple_importation.bind(this), 1000);
    }

    public toggleShowNewImport(): void {
        this.show_new_import = !this.show_new_import;
    }

    public async uploadedFile(target_segment_date_index: number, fileVo: FileVO) {
        if ((!fileVo) || (!fileVo.id)) {
            return;
        }

        let segment_date_index: number = target_segment_date_index;
        // Si on ne fournit pas le segment, c'est qu'on veut faire un import sur les segments sélectionnés
        if (!segment_date_index) {
            if ((!this.lower_selected_segment) || (!this.upper_selected_segment) || (this.upper_selected_segment.index < this.lower_selected_segment.index)) {
                return;
            }
            segment_date_index = this.lower_selected_segment.index;
            this.importing_multiple_segments_current_segment = this.lower_selected_segment;
            this.importing_multiple_segments_filevo_id = fileVo.id;
            this.importing_multiple_segments = true;
        } else {
            this.importing_multiple_segments = false;
        }

        await this.importSegment(segment_date_index, fileVo.id);
    }

    public async initialize_on_mount() {
        if (this.getlower_segment) {

            if (!this.lower_selected_date_index) {
                this.lower_selected_date_index = this.getlower_segment.dateIndex;
            }
            if (!this.upper_selected_date_index) {
                this.upper_selected_date_index = TimeSegmentHandler.getPreviousTimeSegment(this.getlower_segment, this.getsegment_type, -this.getsegment_number + 1).dateIndex;
            }
        }
    }

    public async on_show_modal() {

        this.selected_segment = null;
        if (!this.initial_selected_segment) {
            return;
        }
        for (const i in this.getsegments) {
            if (this.getsegments[i].index == this.initial_selected_segment) {
                await this.select_segment(this.getsegments[i]);
                return;
            }
        }

        // Si le segment est pas chargé on le cible pour le trouver dans la liste
        this.setlower_segment(TimeSegmentHandler.getCorrespondingTimeSegment(this.initial_selected_segment, this.getsegment_type, -Math.floor(this.getsegment_number / 2)));
        await this.select_segment(TimeSegmentHandler.getCorrespondingTimeSegment(this.initial_selected_segment, this.getsegment_type));
    }

    public hasSelectedOptions(historic: DataImportHistoricVO): boolean {
        return this.getHistoricOptionsTester(historic, this.getOptions);
    }

    protected async mounted() {
        this.autovalidate = this.autovalidate_default_value;
        await this.on_mount();
    }

    private define_lower_selection(segment: TimeSegment) {
        this.lower_selected_date_index = segment.dateIndex;
    }

    private define_upper_selection(segment: TimeSegment) {
        this.upper_selected_date_index = segment.dateIndex;
    }

    private async select_segment(segment: TimeSegment) {
        await this.loadRawImportedDatas(segment);
        this.selected_segment = segment;
    }

    private async loadRawImportedDatas(timeSegment: TimeSegment) {
        const promises: Array<Promise<any>> = [];
        const files_ids: number[] = [];

        if ((!this.import_historics) || (!timeSegment) || (!this.import_historics[timeSegment.index])) {
            return;
        }

        ConsoleHandler.log('loadRawImportedDatas:' + timeSegment.index);

        for (const i in this.import_historics[timeSegment.index]) {

            const historic: DataImportHistoricVO = this.import_historics[timeSegment.index][i];
            this.pushPromisesToLoadDataFromHistoric(historic, files_ids, promises);
        }

        await all_promises(promises);
    }

    private async continue_importation(api_type_id: string) {
        if ((!this.selected_segment) || (!this.import_historics) || (!this.import_historics[this.selected_segment.index])) {
            return;
        }

        if (this.import_historics[this.selected_segment.index][api_type_id].state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) {
            return;
        }

        this.import_historics[this.selected_segment.index][api_type_id].state = ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.import_historics[this.selected_segment.index][api_type_id]);

        this.storeData(this.import_historics[this.selected_segment.index][api_type_id]);
    }

    private async cancel_importation(api_type_id: string) {
        if ((!this.selected_segment) || (!this.import_historics) || (!this.import_historics[this.selected_segment.index])) {
            return;
        }

        if (this.import_historics[this.selected_segment.index][api_type_id].state != ModuleDataImport.IMPORTATION_STATE_FORMATTED) {
            return;
        }

        this.import_historics[this.selected_segment.index][api_type_id].state = ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.import_historics[this.selected_segment.index][api_type_id]);

        this.storeData(this.import_historics[this.selected_segment.index][api_type_id]);
    }

    private async checkReplaceExistingImport(segment_date_index: number, done) {
        const self = this;

        if (((!!segment_date_index) && ((!!this.import_historics) && (!!this.import_historics[segment_date_index]))) ||
            ((!segment_date_index) && this.has_imports_on_selected_segments)) {
            self.snotify.confirm(self.label('import.new_historic_confirmation.body'), self.label('import.new_historic_confirmation.title'), {
                timeout: 10000,
                showProgressBar: true,
                closeOnClick: false,
                pauseOnHover: true,
                buttons: [
                    {
                        text: self.t('YES'),
                        action: (toast) => {
                            done();
                            self.$snotify.remove(toast.id);
                            self.snotify.info(self.label('import.upload_started'));
                        },
                        bold: false
                    },
                    {
                        text: self.t('NO'),
                        action: (toast) => {
                            done(self.label('import.new_historic_confirmation.cancelled'));
                            self.$snotify.remove(toast.id);
                        }
                    }
                ]
            });
        } else {
            done();
            self.snotify.info(self.label('import.upload_started'));
        }
    }

    private async continue_multiple_importation() {
        if (!this.importing_multiple_segments) {
            return;
        }

        if (!this.selected_import_is_finished) {
            return;
        }

        // On est en import multiple, soit on passe au suivant, soit c'est terminé
        this.importing_multiple_segments_current_segment = TimeSegmentHandler.getPreviousTimeSegment(this.importing_multiple_segments_current_segment, this.getsegment_type, -1);
        if (this.upper_selected_segment.index < this.importing_multiple_segments_current_segment.index) {
            this.importing_multiple_segments = false;
            return;
        }
        await this.importSegment(this.importing_multiple_segments_current_segment.index, this.importing_multiple_segments_filevo_id);
    }

    private async planif_reimport(segment: TimeSegment) {
        if ((!this.import_historics) || (!this.import_historics[segment.index])) {
            return;
        }

        for (const i in this.import_historics[segment.index]) {
            let historic: DataImportHistoricVO = this.import_historics[segment.index][i];

            while (historic.reimport_of_dih_id) {
                historic = await query(DataImportHistoricVO.API_TYPE_ID).filter_by_id(historic.reimport_of_dih_id).select_vo<DataImportHistoricVO>();
            }

            await ModuleDataImport.getInstance().reimportdih(historic);
        }

        this.snotify.info(this.label('imports.reimport.planified'));
    }

    private async importSegment(segment_date_index: number, filevo_id: number) {
        const importHistorics: DataImportHistoricVO[] = [];
        for (const i in this.valid_api_type_ids) {
            const api_type_id: string = this.valid_api_type_ids[i];

            const importHistoric: DataImportHistoricVO = new DataImportHistoricVO();
            importHistoric.api_type_id = api_type_id;
            importHistoric.file_id = filevo_id;
            importHistoric.autovalidate = this.autovalidate;
            importHistoric.segment_type = this.getsegment_type;
            importHistoric.import_type = DataImportHistoricVO.IMPORT_TYPE_REPLACE;
            importHistoric.params = JSON.stringify(this.getOptions);
            importHistoric.segment_date_index = segment_date_index;
            importHistoric.state = ModuleDataImport.IMPORTATION_STATE_UPLOADED;
            importHistoric.user_id = (VueAppController.getInstance().data_user) ? VueAppController.getInstance().data_user.id : null;

            importHistorics.push(importHistoric);
            const res = await ModuleDAO.getInstance().insertOrUpdateVO(importHistoric);
            importHistoric.id = res.id;

            this.storeData(importHistoric);
        }

        this.$router.push(this.get_url_for_modal ? this.get_url_for_modal(segment_date_index) : this.route_path + '/' + DataImportAdminVueModule.IMPORT_MODAL + '/' + segment_date_index);

        this.openModalDateIndex(segment_date_index);
    }

    private openModalDateIndex(segment_date_index: number) {
        this.$router.push(this.get_url_for_modal ? this.get_url_for_modal(segment_date_index) : this.route_path + '/' + DataImportAdminVueModule.IMPORT_MODAL + '/' + segment_date_index);
    }

    private openModal(segment: TimeSegment) {
        this.openModalDateIndex(segment.index);
    }

    private getRaw_datas_path(import_state: string): { [api_type_id: string]: string } {
        const res: { [api_type_id: string]: string } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            res[historic.api_type_id] = this.getCRUDLink(ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id)) + (import_state ? "?FILTER__importation_state=" + import_state : '');
        }
        return res;
    }

    private async reload_datas() {
        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([DataImportHistoricVO.API_TYPE_ID]);

        if (!this.getsegments || !this.getsegments.length || !this.valid_api_type_ids || !this.valid_api_type_ids.length) {
            return;
        }

        const num_ranges: NumRange[] = [];

        for (const i in this.getsegments) {
            const segment: TimeSegment = this.getsegments[i];

            num_ranges.push(RangeHandler.create_single_elt_NumRange(segment.index, NumRange.RANGE_TYPE));
        }

        const dihs: DataImportHistoricVO[] = await query(DataImportHistoricVO.API_TYPE_ID)
            .filter_by_text_including(field_names<DataImportHistoricVO>().api_type_id, this.valid_api_type_ids)
            .filter_by_num_x_ranges(field_names<DataImportHistoricVO>().segment_date_index, num_ranges)
            .select_vos<DataImportHistoricVO>();

        this.storeDatas({
            API_TYPE_ID: DataImportHistoricVO.API_TYPE_ID,
            vos: dihs
        });
    }

    get import_historics(): { [segment_date_index: number]: { [api_type_id: string]: DataImportHistoricVO } } {
        const res: { [segment_date_index: number]: { [api_type_id: string]: DataImportHistoricVO } } = {};

        for (const i in this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID]) {
            const dih: DataImportHistoricVO = this.getStoredDatas[DataImportHistoricVO.API_TYPE_ID][i] as DataImportHistoricVO;

            if (!this.hasSelectedOptions(dih)) {
                continue;
            }

            if (!res[dih.segment_date_index]) {
                res[dih.segment_date_index] = {};
            }

            if (res[dih.segment_date_index][dih.api_type_id] && (res[dih.segment_date_index][dih.api_type_id].start_date > dih.start_date)) {
                continue;
            }

            res[dih.segment_date_index][dih.api_type_id] = dih;
        }

        return res;
    }

    get selected_import_is_finished(): boolean {

        if ((!this.selected_segment) || (!this.valid_api_type_ids) || (!this.posttreated)) {
            return false;
        }

        for (const i in this.valid_api_type_ids) {
            if (!this.posttreated[this.valid_api_type_ids[i]]) {
                return false;
            }
        }
        return true;
    }

    get logs_path(): { [api_type_id: string]: string } {
        const res: { [api_type_id: string]: string } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            res[historic.api_type_id] = this.getCRUDLink(DataImportLogVO.API_TYPE_ID) + "?FILTER__data_import_historic_id=" + historic.id;
        }
        return res;
    }

    get raw_datas_path(): { [api_type_id: string]: string } {
        return this.getRaw_datas_path(null); //'import.state.ready_to_import');
    }

    get modal_historics(): { [api_type_id: string]: DataImportHistoricVO; } {
        return this.import_historics[this.selected_segment.index];
    }

    get modal_dropzone_options(): any {
        return this.dropzoneOptions[this.selected_segment.index];
    }

    get modal_dropzone_key(): string {
        return 'fileinput_' + this.selected_segment.index;
    }

    get lower_selected_segment(): TimeSegment {
        return this.lower_selected_date_index ? TimeSegmentHandler.getCorrespondingTimeSegment(moment(this.lower_selected_date_index).utc(true).unix(), this.getsegment_type) : null;
    }

    get upper_selected_segment(): TimeSegment {
        return this.upper_selected_date_index ? TimeSegmentHandler.getCorrespondingTimeSegment(moment(this.upper_selected_date_index).utc(true).unix(), this.getsegment_type) : null;
    }

    get is_selected_segment(): { [date_index: string]: boolean } {
        const res: { [date_index: string]: boolean } = {};
        let segment: TimeSegment = this.lower_selected_segment;

        if ((!this.upper_selected_segment) || (!this.lower_selected_segment)) {
            return res;
        }

        if (this.upper_selected_segment.index < this.lower_selected_segment.index) {
            return res;
        }

        while (segment.index <= this.upper_selected_segment.index) {

            res[segment.index] = true;
            segment = TimeSegmentHandler.getPreviousTimeSegment(segment, this.getsegment_type, -1);
        }
        return res;
    }

    get is_valid_lower(): { [date_index: string]: boolean } {
        const res: { [date_index: string]: boolean } = {};

        for (const i in this.getsegments) {
            const segment: TimeSegment = this.getsegments[i];

            res[segment.index] = !(this.upper_selected_segment.index < segment.index);
        }

        return res;
    }

    get is_valid_upper(): { [date_index: string]: boolean } {
        const res: { [date_index: string]: boolean } = {};

        for (const i in this.getsegments) {
            const segment: TimeSegment = this.getsegments[i];

            res[segment.index] = !(this.lower_selected_segment.index > segment.index);
        }

        return res;
    }

    get show_overview(): boolean {
        return this.force_show_overview;
    }

    get valid_api_type_ids(): string[] {
        const res: string[] = [];

        for (const i in this.api_type_ids) {
            if (this.getApiTypeIdTester(this.api_type_ids[i])) {
                res.push(this.api_type_ids[i]);
            }
        }

        return res;
    }

    get segment_states(): { [date_index: string]: string } {
        const res: { [date_index: string]: string } = {};

        if ((!this.valid_api_type_ids) || (!this.valid_api_type_ids.length)) {
            return res;
        }

        for (const i in this.getsegments) {
            const segment: TimeSegment = this.getsegments[i];

            if (!this.is_valid_segments[segment.index]) {
                res[segment.index] = this.state_unavail;
                continue;
            }

            // Un segment est ko si tous les valid_api_type_ids sont ko
            //  Un api_type est ko si il n'y a pas d'historique
            //      ou si l'historique est en erreur
            // Un segment est ok si tous les api_types_ids sont ok
            //  Un api_type est ok si il y a un historique et
            //      que celui-ci est en statut posttreated
            // Un segment est info si un api_type est en info
            //  Un api_type est info si il est est en attente de validation du formattage
            // Un segment est none si tous les api_type_id sont none
            // Un segment est warn dans tous les autres cas
            let all_ok: boolean = true;
            let all_ko: boolean = true;
            let all_none: boolean = true;
            let has_info: boolean = false;
            for (const j in this.api_types_ids_states[segment.index]) {
                if (this.api_types_ids_states[segment.index][j] != this.state_ok) {
                    all_ok = false;
                }
                if (this.api_types_ids_states[segment.index][j] != this.state_none) {
                    all_none = false;
                }
                if (this.api_types_ids_states[segment.index][j] != this.state_ko) {
                    all_ko = false;
                }
                if (this.api_types_ids_states[segment.index][j] == this.state_info) {
                    has_info = true;
                }
            }
            if (all_none) {
                res[segment.index] = this.state_none;
            } else if (all_ko) {
                res[segment.index] = this.state_ko;
            } else if (all_ok && !has_info) {
                res[segment.index] = this.state_ok;
            } else if (has_info) {
                res[segment.index] = this.state_info;
            } else {
                res[segment.index] = this.state_warn;
            }

            if (res[segment.index] == this.state_none) {
                if (this.validate_previous_segment && (this.validate_previous_segment.index >= segment.index)) {
                    res[segment.index] = this.state_ok;
                }
            }
        }

        return res;
    }

    get api_types_ids_states(): { [segment_date_index: number]: { [api_type_id: string]: string } } {
        const res: { [segment_date_index: number]: { [api_type_id: string]: string } } = {};

        if (!this.import_historics) {
            return res;
        }

        for (const i in this.getsegments) {
            const segment: TimeSegment = this.getsegments[i];
            res[segment.index] = {};

            for (const j in this.valid_api_type_ids) {
                const api_type_id: string = this.valid_api_type_ids[j];
                const historic: DataImportHistoricVO = this.import_historics[segment.index] ? this.import_historics[segment.index][api_type_id] : null;

                if (!this.is_valid_segments[segment.index]) {
                    res[segment.index][api_type_id] = this.state_unavail;
                    continue;
                }

                if (!historic) {
                    res[segment.index][api_type_id] = this.state_none;
                    continue;
                }

                switch (historic.state) {
                    case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                        res[segment.index][api_type_id] = this.state_ok;
                        break;
                    case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                    case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                        res[segment.index][api_type_id] = this.state_ko;
                        break;
                    case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                        res[segment.index][api_type_id] = this.state_info;
                        break;
                    case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                    case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                    case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                    case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                    case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                    default:
                        res[segment.index][api_type_id] = this.state_warn;
                }
            }
        }

        return res;
    }

    get is_valid_segments(): { [date_index: string]: boolean } {
        const res: { [date_index: string]: boolean } = {};

        for (const i in this.getsegments) {
            const segment: TimeSegment = this.getsegments[i];

            res[segment.index] = this.valid_segments ? false : true;
            for (const j in this.valid_segments) {
                if (this.valid_segments[j].index == segment.index) {
                    res[segment.index] = true;
                }
            }
        }

        return res;
    }

    get imported_file(): FileVO {

        if ((!this.getStoredDatas) || (!this.getStoredDatas[FileVO.API_TYPE_ID]) || (!this.import_historics)) {
            return null;
        }

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return null;
        }

        for (const api_type_id in this.import_historics[this.selected_segment.index]) {
            const historic = this.import_historics[this.selected_segment.index][api_type_id];

            if (!historic) {
                continue;
            }

            return this.getStoredDatas[FileVO.API_TYPE_ID][historic.file_id] as FileVO;
        }
    }

    get api_types_ids_formats(): { [api_type_id: string]: DataImportFormatVO[] } {
        const res: { [api_type_id: string]: DataImportFormatVO[] } = {};

        if ((!this.getStoredDatas) || (!this.getStoredDatas[DataImportFormatVO.API_TYPE_ID])) {
            return res;
        }

        for (const i in this.getStoredDatas[DataImportFormatVO.API_TYPE_ID]) {
            const format: DataImportFormatVO = this.getStoredDatas[DataImportFormatVO.API_TYPE_ID][i] as DataImportFormatVO;

            if ((!format) || (this.valid_api_type_ids.indexOf(format.api_type_id) < 0)) {
                continue;
            }

            if (!res[format.api_type_id]) {
                res[format.api_type_id] = [];
            }
            res[format.api_type_id].push(format);
        }

        return res;
    }

    get labels(): { [api_type_id: string]: string } {
        const res: { [api_type_id: string]: string } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {

            if (!this.import_historics[this.selected_segment.index][i]) {
                continue;
            }

            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];
            const format: DataImportFormatVO = this.getStoredDatas[DataImportFormatVO.API_TYPE_ID][historic.data_import_format_id] as DataImportFormatVO;

            if (!format) {
                res[historic.api_type_id] = this.label('import.api_type_ids.' + historic.api_type_id);
                continue;
            }

            res[historic.api_type_id] = this.label(format.import_uid);
        }

        return res;
    }

    get format_validated(): { [api_type_id: string]: boolean } {
        const res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                    res[historic.api_type_id] = true;
                    break;

                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }
    get has_formatted_datas(): { [api_type_id: string]: boolean } {
        const res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                    res[historic.api_type_id] = true;
                    break;

                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get format_invalidated(): { [api_type_id: string]: boolean } {
        const res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get nb_validated_format_elements(): { [api_type_id: string]: number } {
        const res: { [api_type_id: string]: number } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            res[historic.api_type_id] = historic.nb_row_validated;
            // res[historic.api_type_id] = 0;

            // let raw_imported_datas: { [id: number]: IImportedData } = this.getStoredDatas[ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id)] as { [id: number]: IImportedData };
            // for (let j in raw_imported_datas) {
            //     switch (raw_imported_datas[j].importation_state) {
            //         case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
            //         case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
            //         case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
            //         case ModuleDataImport.IMPORTATION_STATE_READY_TO_IMPORT:
            //         case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
            //         case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
            //         case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
            //             res[historic.api_type_id]++;
            //             break;

            //         default:
            //     }
            // }
        }
        return res;
    }

    get nb_unvalidated_format_elements(): { [api_type_id: string]: number } {
        const res: { [api_type_id: string]: number } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            res[historic.api_type_id] = historic.nb_row_unvalidated;
            // res[historic.api_type_id] = 0;

            // let raw_imported_datas: { [id: number]: IImportedData } = this.getStoredDatas[ModuleDataImport.getInstance().getRawImportedDatasAPI_Type_Id(historic.api_type_id)] as { [id: number]: IImportedData };
            // for (let j in raw_imported_datas) {
            //     switch (raw_imported_datas[j].importation_state) {
            //         case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
            //         case ModuleDataImport.IMPORTATION_STATE_IMPORTATION_NOT_ALLOWED:
            //         case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
            //         case ModuleDataImport.IMPORTATION_STATE_UPLOADED:
            //             res[historic.api_type_id]++;
            //             break;
            //         default:
            //     }
            // }
        }
        return res;
    }

    get needs_format_validation(): { [api_type_id: string]: boolean } {
        const res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            res[historic.api_type_id] = false;
            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FORMATTED:
                    res[historic.api_type_id] = true;
                    break;

                default:
            }
        }
        return res;
    }

    get imported(): { [api_type_id: string]: boolean } {
        const res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                case ModuleDataImport.IMPORTATION_STATE_IMPORTED:
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get import_failed(): { [api_type_id: string]: boolean } {
        const res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FAILED_IMPORTATION:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    get posttreated(): { [api_type_id: string]: boolean } {
        const res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATED:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }


    get formatting(): { [api_type_id: string]: boolean } {
        const res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FORMATTING:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }


    get importing(): { [api_type_id: string]: boolean } {
        const res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_IMPORTING:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }


    get posttreating(): { [api_type_id: string]: boolean } {
        const res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_POSTTREATING:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }


    get posttreat_failed(): { [api_type_id: string]: boolean } {
        const res: { [api_type_id: string]: boolean } = {};

        if ((!this.import_historics) || (!this.selected_segment) || (!this.import_historics[this.selected_segment.index])) {
            return res;
        }

        for (const i in this.import_historics[this.selected_segment.index]) {
            const historic: DataImportHistoricVO = this.import_historics[this.selected_segment.index][i];

            switch (historic.state) {
                case ModuleDataImport.IMPORTATION_STATE_FAILED_POSTTREATMENT:
                    res[historic.api_type_id] = true;
                    break;

                default:
                    res[historic.api_type_id] = false;
            }
        }
        return res;
    }

    /**
     * On veut la liste des formats de fichiers acceptables pour importation,
     *  en prenant l'ensemble commun à tous les valid_api_type_ids (si on peut importer un CSV
     *  mais sur un seul api_type_id et pas sur les autres on refuse, le but sur la page
     *  est de gérer un seul fichier pour plusieurs imports)
     */
    get acceptedFiles(): string {
        let res: string[] = null;

        for (const i in this.valid_api_type_ids) {
            const api_type_id: string = this.valid_api_type_ids[i];

            const api_type_id_accepted_files: string[] = [];
            for (const j in this.api_types_ids_formats) {
                const api_type_id_formats: DataImportFormatVO[] = this.api_types_ids_formats[j];

                for (const k in api_type_id_formats) {
                    const api_type_id_format: DataImportFormatVO = api_type_id_formats[k];

                    switch (api_type_id_format.type) {
                        case DataImportFormatVO.TYPE_CSV:
                            if (api_type_id_accepted_files.indexOf('.csv') < 0) {
                                api_type_id_accepted_files.push('.csv');
                            }
                        case DataImportFormatVO.TYPE_XML:
                            if (api_type_id_accepted_files.indexOf('.xml') < 0) {
                                api_type_id_accepted_files.push('.xml');
                            }
                        case DataImportFormatVO.TYPE_XLS:
                        case DataImportFormatVO.TYPE_XLSX:
                            if (api_type_id_accepted_files.indexOf('.xls') < 0) {
                                api_type_id_accepted_files.push('.xls');
                            }
                            if (api_type_id_accepted_files.indexOf('.xlsx') < 0) {
                                api_type_id_accepted_files.push('.xlsx');
                            }
                        default:
                    }
                }
            }

            if (!res) {
                res = api_type_id_accepted_files;
                continue;
            }

            const new_res: string[] = [];
            for (const j in res) {
                const test_res: string = res[j];

                if (api_type_id_accepted_files.indexOf(test_res) >= 0) {
                    new_res.push(test_res);
                }
            }

            res = new_res;
        }

        return res ? res.join(',') : "";
    }

    get dropzoneOptions_multiple(): any {
        const self = this;
        return {
            createImageThumbnails: false,
            acceptedFiles: self.acceptedFiles,
            timeout: 3600000,
            init: function () {
                this.on('maxfilesexceeded', function (file) {
                    this.removeFile(file);
                });
            },
            error: (infos, error_message) => {
                self.snotify.error(error_message);
            },
            accept: async (file, done) => {

                await this.checkReplaceExistingImport(null, done);
                // this.checkUnfinishedImportsAndReplacement(null, done);
            },
        };
    }

    get dropzoneOptions(): { [segment_date_index: number]: any } {

        const res: { [segment_date_index: number]: any } = {};
        const self = this;

        for (const i in this.getsegments) {
            const segment = this.getsegments[i];

            res[segment.index] = ((segment_date_index: number): any => {
                return {
                    createImageThumbnails: false,
                    acceptedFiles: self.acceptedFiles,
                    timeout: 3600000,
                    init: function () {
                        this.on('maxfilesexceeded', function (file) {
                            this.removeFile(file);
                        });
                    },
                    error: (infos, error_message) => {
                        self.snotify.error(error_message);
                    },
                    accept: async (file, done) => {

                        await this.checkReplaceExistingImport(segment_date_index, done);
                        // this.checkUnfinishedImportsAndReplacement(segment_date_index, done);
                    },
                };
            })(segment.index);
        }
        return res;
    }

    get has_imports_on_selected_segments(): boolean {
        let segment: TimeSegment = this.lower_selected_segment;
        while (segment.index <= this.upper_selected_segment.index) {

            if ((!!this.import_historics) && (!!this.import_historics[segment.index])) {
                return true;
            }
            segment = TimeSegmentHandler.getPreviousTimeSegment(segment, this.getsegment_type, -1);
        }
        return false;
    }
}