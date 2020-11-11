import DefaultTranslation from '../../../../shared/modules/Translation/vos/DefaultTranslation';
import ModuleVar from '../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarUpdateCallback from '../../../../shared/modules/Var/vos/VarUpdateCallback';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import TypesHandler from '../../../../shared/tools/TypesHandler';
import RegisteredVarDataWrapper from './vos/RegisteredVarDataWrapper';

export default class VarsClientController {

    public static getInstance(): VarsClientController {
        if (!VarsClientController.instance) {
            VarsClientController.instance = new VarsClientController();
        }
        return VarsClientController.instance;
    }

    private static VARS_DESC_TRANSLATABLE_PREFIXES: string = "var.desc.";

    private static instance: VarsClientController = null;

    /**
     * Les vars params registered et donc registered aussi côté serveur, si on est déjà registered on a pas besoin de rajouter des instances
     *  on stocke aussi le nombre d'enregistrements, pour pouvoir unregister au fur et à mesure
     */
    public registered_var_params: { [index: string]: RegisteredVarDataWrapper } = {};



    protected constructor() {
    }

    public get_translatable_name_code_by_var_id(var_id: number): string {
        return VarsClientController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.getInstance().var_conf_by_id[var_id].name + '.translatable_name' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_description_code_by_var_id(var_id: number): string {
        return VarsClientController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.getInstance().var_conf_by_id[var_id].name + '.translatable_description' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_explaination(var_id: number): string {
        return VarsClientController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.getInstance().var_conf_by_id[var_id].name + '.translatable_explaination' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_dep_name(dep_id: string): string {
        return VarsClientController.VARS_DESC_TRANSLATABLE_PREFIXES + '__DEPS__' + dep_id + '.name' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_params_desc_code_by_var_id(var_id: number): string {
        return VarsClientController.VARS_DESC_TRANSLATABLE_PREFIXES + VarsController.getInstance().var_conf_by_id[var_id].name + '.translatable_params_desc' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_name_code(var_name: string): string {
        return VarsClientController.VARS_DESC_TRANSLATABLE_PREFIXES + var_name + '.translatable_name' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_description_code(var_name: string): string {
        return VarsClientController.VARS_DESC_TRANSLATABLE_PREFIXES + var_name + '.translatable_description' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    public get_translatable_params_desc_code(var_name: string): string {
        return VarsClientController.VARS_DESC_TRANSLATABLE_PREFIXES + var_name + '.translatable_params_desc' + DefaultTranslation.DEFAULT_LABEL_EXTENSION;
    }

    /**
     * L'objectif est de stocker les registered_params et d'envoyer une requête pour avoir une valeur :
     *  - soit par ce qu'on a pas de valeur connue pour cet index
     *  - soit par ce qu'on nous demande explicitement de forcer une nouvelle demande au serveur (ce qui ne devrait pas être utile donc pour le moment on gère pas ce cas)
     * @param var_params les params sur lesquels on veut s'abonner
     * @param callbacks les callbacks pour le suivi des mises à jour si on utilise pas simplement le store des vars (exemple les directives). Attention il faut bien les unregisters aussi
     */
    public async registerParams(
        var_params: VarDataBaseVO[] | { [index: string]: VarDataBaseVO },
        callbacks: { [cb_uid: number]: VarUpdateCallback } = null) {

        let needs_registration: VarDataBaseVO[] = [];

        for (let i in var_params) {
            let var_param = var_params[i];

            if (!this.registered_var_params[var_param.index]) {
                needs_registration.push(var_param);
                this.registered_var_params[var_param.index] = new RegisteredVarDataWrapper(var_param);
                if (callbacks) {
                    this.registered_var_params[var_param.index].add_callbacks(callbacks);
                }
            } else {
                if (callbacks) {
                    this.registered_var_params[var_param.index].add_callbacks(callbacks);
                }
                this.registered_var_params[var_param.index].nb_registrations++;
            }
        }

        if (needs_registration && needs_registration.length) {
            await ModuleVar.getInstance().register_params(needs_registration);
        }
    }

    /**
     * En cas de reco du serveur, qui peut avoir reboot par exemple, on relance tous les registers sans exception
     */
    public async registerAllParamsAgain() {

        let needs_registration: VarDataBaseVO[] = [];

        for (let i in this.registered_var_params) {
            let var_param_wrapper = this.registered_var_params[i];
            needs_registration.push(var_param_wrapper.var_param);
        }

        if (needs_registration && needs_registration.length) {
            await ModuleVar.getInstance().register_params(needs_registration);
        }
    }

    /**
     * L'objectif est de register et attendre les résultats
     * @param var_params les params sur lesquels on veut s'abonner
     * @param callbacks les callbacks pour le suivi des mises à jour si on utilise pas simplement le store des vars (exemple les directives). Attention il faut bien les unregisters aussi
     */
    public async registerParamsAndWait(var_params: VarDataBaseVO[] | { [index: string]: VarDataBaseVO }): Promise<{ [index: string]: VarDataBaseVO }> {

        return new Promise((resolve, reject) => {
            let callbacks: { [cb_uid: number]: VarUpdateCallback } = {};
            let res: { [index: string]: VarDataBaseVO } = {};
            let nb_waited_cbs: number = TypesHandler.getInstance().isArray(var_params) ? (var_params as VarDataBaseVO[]).length : Object.keys(var_params).length;

            let callback = VarUpdateCallback.newCallbackOnce(async (varData: VarDataBaseVO) => {
                res[varData.index] = varData;
                nb_waited_cbs--;
                if (nb_waited_cbs <= 0) {
                    resolve(res);
                }
            });
            callbacks[callback.UID] = callback;

            this.registerParams(var_params, [callback]);
        });
    }

    /**
     * Retire 1 sur le nb d'enregistrement de chaque var_param passé en paramètre de la fonction
     *  et si on atteint 0, on désinscrit totalement le var_param et côté serveur également
     * @param var_params Les paramètres à désinscrire
     * @param callbacks Les callbacks associés - les mêmes uids que lors du register
     */
    public async unRegisterParams(
        var_params: VarDataBaseVO[] | { [index: string]: VarDataBaseVO },
        callbacks: { [cb_uid: number]: VarUpdateCallback } = null) {

        let needs_unregistration: VarDataBaseVO[] = [];

        for (let i in var_params) {
            let var_param = var_params[i];

            if (!this.registered_var_params[var_param.index]) {
                continue;
                // ConsoleHandler.getInstance().error('unRegisterParams on unregistered param... ' + var_param.index);
            }

            this.registered_var_params[var_param.index].nb_registrations--;
            if (this.registered_var_params[var_param.index].nb_registrations < 0) {
                continue;
                // ConsoleHandler.getInstance().error('unRegisterParams on unregistered param... ' + var_param.index);
            }

            if (this.registered_var_params[var_param.index].nb_registrations <= 0) {
                needs_unregistration.push(var_param);
                delete this.registered_var_params[var_param.index];
            } else {
                if (callbacks) {
                    this.registered_var_params[var_param.index].remove_callbacks(callbacks);
                }
            }
        }

        if (needs_unregistration && needs_unregistration.length) {
            await ModuleVar.getInstance().unregister_params(needs_unregistration);
        }
    }

    /**
     * Objectif : appeler les callbacks suite à une mise à jour de VarDatas
     * @param var_datas Les datas reçues via les notifications
     */
    public async notifyCallbacks(var_datas: VarDataBaseVO[] | { [index: string]: VarDataBaseVO }) {

        for (let i in var_datas) {
            let var_data: VarDataBaseVO = var_datas[i];
            let registered_var = this.registered_var_params[var_data.index];
            let uids_to_remove: number[] = [];

            if (!registered_var) {
                continue;
            }

            for (let j in registered_var.callbacks) {
                let callback = registered_var.callbacks[j];

                if (!!callback.callback) {
                    await callback.callback(var_data);
                }

                if (callback.type == VarUpdateCallback.TYPE_ONCE) {
                    uids_to_remove.push(callback.UID);
                }
            }

            for (let j in uids_to_remove) {
                delete registered_var.callbacks[uids_to_remove[j]];
            }
        }
    }
}