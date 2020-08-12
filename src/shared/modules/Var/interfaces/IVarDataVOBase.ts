import { Moment } from 'moment';
import IMatroid from '../../Matroid/interfaces/IMatroid';

/**
 * N'a pas vocation a être stocké en base a priori, c'est la classe qui va gérer la data calculée dynamiquement
 */
export default interface IVarDataVOBase extends IMatroid {

    var_id?: number;
    index: string;

    value?: number;

    value_type?: number;
    value_ts?: Moment;
}