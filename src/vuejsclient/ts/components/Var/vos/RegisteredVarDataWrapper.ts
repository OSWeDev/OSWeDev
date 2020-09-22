import VarDataBaseVO from '../../../../../shared/modules/Var/vos/VarDataBaseVO';

export default class RegisteredVarDataWrapper {
    public nb_registrations: number = 1;

    public constructor(
        public var_param: VarDataBaseVO
    ) { }
}