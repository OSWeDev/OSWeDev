import { Moment } from 'moment';
import VarDataBaseVO from './VarDataBaseVO';

export default class VarDataProxyWrapperVO<T extends VarDataBaseVO> {

    public constructor(
        public var_data: T,
        public needs_insert_or_update: boolean = false,
        public nb_reads_since_last_insert_or_update: number = 0,
        public last_insert_or_update: Moment = null) { }
}