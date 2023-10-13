/* istanbul ignore file : nothing to test in this VO */

import ConsoleHandler from '../../../tools/ConsoleHandler';
import IDistantVOBase from '../../IDistantVOBase';
import VarsController from '../VarsController';
import VarDataBaseVO from './VarDataBaseVO';

export default class VarDataInvalidatorVO implements IDistantVOBase {

    public static INVALIDATOR_TYPE_LABELS: string[] = ['invalidator.value_type.exact', 'invalidator.value_type.included_or_exact', 'invalidator.value_type.intersected'];
    public static INVALIDATOR_TYPE_EXACT: number = 0;
    public static INVALIDATOR_TYPE_INCLUDED_OR_EXACT: number = 1;
    public static INVALIDATOR_TYPE_INTERSECTED: number = 2;

    public static API_TYPE_ID: string = "vdinvldtr";

    public static create_new(
        var_data: VarDataBaseVO,
        invalidator_type: number = VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT,
        propagate_to_parents: boolean = true,
        invalidate_denied: boolean = false,
        invalidate_imports: boolean = false): VarDataInvalidatorVO {

        let res: VarDataInvalidatorVO = new VarDataInvalidatorVO();

        res.var_data = var_data;
        res.invalidator_type = invalidator_type;
        res.propagate_to_parents = propagate_to_parents;
        res.invalidate_denied = invalidate_denied;
        res.invalidate_imports = invalidate_imports;

        return res;
    }

    public id: number;

    public _type: string = VarDataInvalidatorVO.API_TYPE_ID;

    public var_data: VarDataBaseVO;
    public invalidator_type: number;
    public propagate_to_parents: boolean;
    public invalidate_denied: boolean;
    public invalidate_imports: boolean;

    /**
     * On log vers la console. JNE : on ajoute l'idée de logguer dans un format qui serait compatible
     *  création d'un TU (donc on recrée une instance dans le log, comme ça on peutprendre le log pour démarrer un TU)
     *  ça serait peut-être pas mal d'appliquer cette idée plus globalement pour facilité la création des TUs sur des cas complexes
     */
    public console_log() {
        ConsoleHandler.log('/**');
        ConsoleHandler.log(' * VarDataInvalidatorVO: ');
        ConsoleHandler.log(' * var_data.index: ' + this.var_data.index);
        ConsoleHandler.log(' * invalidator_type: ' + VarDataInvalidatorVO.INVALIDATOR_TYPE_LABELS[this.invalidator_type]);
        ConsoleHandler.log(' * propagate_to_parents: ' + this.propagate_to_parents);
        ConsoleHandler.log(' * invalidate_denied: ' + this.invalidate_denied);
        ConsoleHandler.log(' * invalidate_imports: ' + this.invalidate_imports);
        ConsoleHandler.log(' */');
        let invalidator_name = 'invalidator_' + VarsController.get_validator_config_id(this);
        ConsoleHandler.log('const ' + invalidator_name + ': VarDataInvalidatorVO = new VarDataInvalidatorVO();');
        ConsoleHandler.log(invalidator_name + '.var_data = VarDataBaseVO.from_index(' + this.var_data.index + ');');
        ConsoleHandler.log(invalidator_name + '.invalidator_type = ' + this.invalidator_type + ';');
        ConsoleHandler.log(invalidator_name + '.propagate_to_parents = ' + this.propagate_to_parents + ';');
        ConsoleHandler.log(invalidator_name + '.invalidate_denied = ' + this.invalidate_denied + ';');
        ConsoleHandler.log(invalidator_name + '.invalidate_imports = ' + this.invalidate_imports + ';');
    }
}