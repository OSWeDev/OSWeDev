
import VarsComputeController from '../../../../server/modules/Var/VarsComputeController';
import TimeSegment from '../../DataRender/vos/TimeSegment';
import Dates from '../../FormatDatesNombres/Dates/Dates';
import VarDataBaseVO from './VarDataBaseVO';

export default class VarDataProxyWrapperVO<T extends VarDataBaseVO> {

    public creation_date: number;

    public var_data_origin_value: number;
    public var_data_origin_type: number;

    public nb_reads_since_last_check: number = 0;
    public timeout: number = null;

    /**
     *
     * @param var_data la var à wrapper
     * @param client_tab_id Le socket id du client qui a demandé la var
     * @param reason La raison ou le contexte de la demande de la var (l'index du sub par exemple, ou la raison de la demande plus généralement qui a poussé à ajouter dans le cache - on ne modifie pas le cache si il existe déjà)
     * @param needs_insert_or_update_
     * @param nb_reads_since_last_insert_or_update
     * @param last_insert_or_update
     */
    public constructor(
        public var_data: T,
        public client_tab_id: string = null,
        public is_server_request: boolean = false,
        public reason: string = null,
        public needs_insert_or_update_: boolean = false,
        public nb_reads_since_last_insert_or_update: number = 0,
        public last_insert_or_update: number = null) {
        this.var_data_origin_value = var_data.value;
        this.var_data_origin_type = var_data.value_type;
        this.last_insert_or_update = last_insert_or_update ? last_insert_or_update : Dates.now();
        this.nb_reads_since_last_check = 0;
        this.update_timeout();
        this.creation_date = Dates.now();
    }

    public update_timeout() {
        this.timeout = Dates.add(Dates.now(), 1, TimeSegment.TYPE_MINUTE);
    }

    get needs_insert_or_update(): boolean {
        return this.needs_insert_or_update_ || !((this.var_data_origin_type == this.var_data.value_type) && (this.var_data_origin_value == this.var_data.value));
    }
}