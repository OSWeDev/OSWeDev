
import INamedVO from '../../../interfaces/INamedVO';
import IDistantVOBase from '../../IDistantVOBase';

export default interface ISupervisedItem extends IDistantVOBase, INamedVO {
    last_update: number;
    last_value: number;
    creation_date: number;
    first_update: number;

    state: number;
    state_before_pause: number;

    category_id: number;
    // /**
    //  * champ clé étrangère vers SupervisedProbeVO
    //  * necessaire pour afficher les compteurs par sonde et par état
    //  */
    // probe_id: number;

    invalid: boolean;
}