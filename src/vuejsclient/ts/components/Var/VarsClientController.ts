import ModuleVar from '../../../../shared/modules/Var/ModuleVar';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import RegisteredVarDataWrapper from './vos/RegisteredVarDataWrapper';

export default class VarsClientController {

    public static getInstance(): VarsClientController {
        if (!VarsClientController.instance) {
            VarsClientController.instance = new VarsClientController();
        }
        return VarsClientController.instance;
    }

    private static instance: VarsClientController = null;

    /**
     * Les vars params registered et donc registered aussi côté serveur, si on est déjà registered on a pas besoin de rajouter des instances
     *  on stocke aussi le nombre d'enregistrements, pour pouvoir unregister au fur et à mesure
     */
    public registered_var_params: { [index: string]: RegisteredVarDataWrapper } = {};

    public known_values: { [index: string]: number } = {};

    protected constructor() {
    }

    /**
     * L'objectif est de stocker les registered_params et d'envoyer une requête pour avoir une valeur :
     *  - soit par ce qu'on a pas de valeur connue pour cet index
     *  - soit par ce qu'on nous demande explicitement de forcer une nouvelle demande au serveur (ce qui ne devrait pas être utile donc pour le moment on gère pas ce cas)
     * @param var_params
     */
    public async registerParams(var_params: VarDataBaseVO[] | { [index: string]: VarDataBaseVO }) {

        let needs_registration: VarDataBaseVO[] = [];

        for (let i in var_params) {
            let var_param = var_params[i];

            if (!this.registered_var_params[var_param.index]) {
                needs_registration.push(var_param);
                this.registered_var_params[var_param.index] = new RegisteredVarDataWrapper(var_param);
            } else {
                this.registered_var_params[var_param.index].nb_registrations++;
            }
        }

        if (needs_registration && needs_registration.length) {
            await ModuleVar.getInstance().register_params(needs_registration);
        }
    }

    /**
     * Retire 1 sur le nb d'enregistrement de chaque var_param passé en paramètre de la fonction
     *  et si on atteint 0, on désinscrit totalement le var_param et côté serveur également
     * @param var_params Les paramètres à désinscrire
     */
    public async unRegisterParams(var_params: VarDataBaseVO[] | { [index: string]: VarDataBaseVO }) {

        let needs_unregistration: VarDataBaseVO[] = [];

        for (let i in var_params) {
            let var_param = var_params[i];

            if (!this.registered_var_params[var_param.index]) {
                ConsoleHandler.getInstance().error('unRegisterParams on unregistered param... ' + var_param.index);
            } else {
                this.registered_var_params[var_param.index].nb_registrations--;
                if (this.registered_var_params[var_param.index].nb_registrations < 0) {
                    ConsoleHandler.getInstance().error('unRegisterParams on unregistered param... ' + var_param.index);
                }
                if (this.registered_var_params[var_param.index].nb_registrations <= 0) {
                    needs_unregistration.push(var_param);
                    delete this.registered_var_params[var_param.index];
                }
            }
        }

        if (needs_unregistration && needs_unregistration.length) {
            await ModuleVar.getInstance().unregister_params(needs_unregistration);
        }
    }
}