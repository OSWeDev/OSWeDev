/* istanbul ignore file : nothing to test in this VO */

import VarsCacheController from '../../../../server/modules/Var/VarsCacheController';
import ConsoleHandler from '../../../tools/ConsoleHandler';
import VarDataBaseVO from './VarDataBaseVO';

export default class VarDataInvalidatorVO {

    public static INVALIDATOR_TYPE_LABELS: string[] = ['invalidator.value_type.exact', 'invalidator.value_type.included_or_exact', 'invalidator.value_type.intersected'];
    public static INVALIDATOR_TYPE_EXACT: number = 0;
    public static INVALIDATOR_TYPE_INCLUDED_OR_EXACT: number = 1;
    public static INVALIDATOR_TYPE_INTERSECTED: number = 2;

    public constructor(
        public var_data: VarDataBaseVO,
        public invalidator_type: number = VarDataInvalidatorVO.INVALIDATOR_TYPE_EXACT,
        public propagate_to_parents: boolean = true,
        public invalidate_denied: boolean = false,
        public invalidate_imports: boolean = false
    ) { }

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
        let invalidator_name = 'invalidator_' + VarsCacheController.get_validator_config_id(this);
        ConsoleHandler.log('const ' + invalidator_name + ': VarDataInvalidatorVO = new VarDataInvalidatorVO();');
        ConsoleHandler.log(invalidator_name + '.var_data = VarDataBaseVO.from_index(' + this.var_data.index + ');');
        ConsoleHandler.log(invalidator_name + '.invalidator_type = ' + this.invalidator_type + ';');
        ConsoleHandler.log(invalidator_name + '.propagate_to_parents = ' + this.propagate_to_parents + ';');
        ConsoleHandler.log(invalidator_name + '.invalidate_denied = ' + this.invalidate_denied + ';');
        ConsoleHandler.log(invalidator_name + '.invalidate_imports = ' + this.invalidate_imports + ';');
    }
}