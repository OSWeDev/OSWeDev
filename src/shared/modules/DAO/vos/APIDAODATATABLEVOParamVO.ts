import IDistantVOBase from '../../IDistantVOBase';
import Datatable from './datatable/Datatable';

export default class APIDAODATATABLEVOParamVO {

    public constructor(
        public datatable_vo: IDistantVOBase,
        public datatable: Datatable<any>) {
    }
}