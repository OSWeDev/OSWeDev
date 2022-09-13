import ModuleVar from '../../../../shared/modules/Var/ModuleVar';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../shared/modules/Var/vos/VarUpdateCallback';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import TypesHandler from '../../../../shared/tools/TypesHandler';
import RegisteredVarDataWrapper from './vos/RegisteredVarDataWrapper';

export default class VarsClientController {

    public static get_CB_UID(): number {
        return this.CB_UID++;
    }

    public static getInstance(): VarsClientController {
        if (!VarsClientController.instance) {
            VarsClientController.instance = new VarsClientController();
        }
        return VarsClientController.instance;
    }

    private static CB_UID: number = 0;
    private static instance: VarsClientController = null;

    /**
     * Les vars params registered et donc registered aussi côté serveur, si on est déjà registered on a pas besoin de rajouter des instances
     *  on stocke aussi le nombre d'enregistrements, pour pouvoir unregister au fur et à mesure
     */
    public registered_var_params: { [index: string]: RegisteredVarDataWrapper } = {};

    /**
     * On stocke les dernières Vardatares reçues (TODO FIXME à nettoyer peut-etre au bout d'un moment)
     */
    public cached_var_datas: { [index: string]: VarDataValueResVO } = {};

    /**
     * On utilise pour se donner un délai de 30 secondes pour les calculs et si on dépasse (entre 30 et 60 secondes) on relance un register sur la var pour rattrapper un oublie de notif
     */
    public registered_var_params_to_check_next_time: { [index: string]: boolean } = {};

    /**
     * appelle la fonction {@link ModuleVarServer.register_params register_params} coté server (ModuleVarServer)
     * @see {@link ModuleVarServer.register_params}
     */

    public throttled_server_registration = ThrottleHelper.getInstance().declare_throttle_with_mappable_args(this.do_server_registration.bind(this), 50, { leading: false, trailing: true });
    public throttled_server_unregistration = ThrottleHelper.getInstance().declare_throttle_with_mappable_args(this.do_server_unregistration.bind(this), 100, { leading: false, trailing: true });

    /**
     * Utilisé comme sémaphore pour l'édition inline des vars
     */
    public inline_editing_cb = null;

    private timeout_check_registrations: number = 30000;

    protected constructor() {

        // On lance un process parallèle qui check en permanence que les vars pour lesquels on a pas de valeurs sont bien enregistrées côté serveur
        this.prepare_next_check();
    }

    /**
     * L'objectif est de stocker les registered_params et d'envoyer une requête pour avoir une valeur :
     *  - soit par ce qu'on a pas de valeur connue pour cet index
     *  - soit par ce qu'on nous demande explicitement de forcer une nouvelle demande au serveur (ce qui ne devrait pas être utile donc pour le moment on gère pas ce cas)
     * @param var_params les params sur lesquels on veut s'abonner
     * @param callbacks les callbacks pour le suivi des mises à jour si on utilise pas simplement le store des vars (exemple les directives). Attention il faut bien les unregisters aussi
     * @remark rajoute les callbacks dans registered_var_params pour les var_params spécifiés
     */
    public async registerParams(
        var_params: VarDataBaseVO[] | { [index: string]: VarDataBaseVO },
        callbacks: { [cb_uid: number]: VarUpdateCallback } = null) {

        let needs_registration: { [index: string]: VarDataBaseVO } = {};

        for (let i in var_params) {
            let var_param = var_params[i];

            if (!var_param) {
                continue;
            }

            if (!this.registered_var_params[var_param.index]) {
                needs_registration[var_param.index] = var_param;
                this.registered_var_params[var_param.index] = new RegisteredVarDataWrapper(var_param);
                if (callbacks) {
                    await this.registered_var_params[var_param.index].add_callbacks(callbacks);
                }
            } else {
                if (callbacks) {
                    await this.registered_var_params[var_param.index].add_callbacks(callbacks);
                }

                if (this.registered_var_params[var_param.index]) {
                    this.registered_var_params[var_param.index].nb_registrations++;
                }
            }
        }

        if (needs_registration && ObjectHandler.getInstance().hasAtLeastOneAttribute(needs_registration)) {
            this.throttled_server_registration(needs_registration);
        }
    }

    /**
     * En cas de reco du serveur, qui peut avoir reboot par exemple, on relance tous les registers sans exception
     */
    public async registerAllParamsAgain() {

        let needs_registration: { [index: string]: VarDataBaseVO } = {};

        for (let i in this.registered_var_params) {
            let var_param_wrapper = this.registered_var_params[i];
            needs_registration[var_param_wrapper.var_param.index] = var_param_wrapper.var_param;
        }

        if (needs_registration && ObjectHandler.getInstance().hasAtLeastOneAttribute(needs_registration)) {
            this.throttled_server_registration(needs_registration);
        }
    }

    /**
     * L'objectif est de register et attendre les résultats
     * @param var_params les params sur lesquels on veut s'abonner
     * @param callbacks les callbacks pour le suivi des mises à jour si on utilise pas simplement le store des vars (exemple les directives). Attention il faut bien les unregisters aussi
     */
    public async registerParamsAndWait(var_params: VarDataBaseVO[] | { [index: string]: VarDataBaseVO }, value_type: number = VarUpdateCallback.VALUE_TYPE_VALID): Promise<{ [index: string]: VarDataBaseVO }> {

        return new Promise(async (resolve, reject) => {
            let callbacks: { [cb_uid: number]: VarUpdateCallback } = {};
            let res: { [index: string]: VarDataBaseVO } = {};
            let nb_waited_cbs: number = TypesHandler.getInstance().isArray(var_params) ? (var_params as VarDataBaseVO[]).length : Object.keys(var_params).length;

            let callback = VarUpdateCallback.newCallbackOnce(async (varData: VarDataBaseVO) => {
                res[varData.index] = varData;
                nb_waited_cbs--;
                if (nb_waited_cbs <= 0) {
                    resolve(res);
                }
            }, value_type);
            callbacks[callback.UID] = callback;

            await this.registerParams(var_params, callbacks);
        });
    }

    /**
     * créé un calback et l'enregistre dans registered_var_params pour le var_param de la variable à calculer
     * @param var_param
     * @param value_type
     * @returns
     */
    public async registerParamAndWait<T extends VarDataBaseVO>(var_param: T, value_type: number = VarUpdateCallback.VALUE_TYPE_VALID): Promise<T> {

        return new Promise(async (resolve, reject) => {
            let callback = VarUpdateCallback.newCallbackOnce(
                async (varData: T) => { resolve(varData); },
                value_type
            );

            await this.registerParams([var_param], { [callback.UID]: callback });
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

        let needs_unregistration: { [index: string]: VarDataBaseVO } = {};

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
                needs_unregistration[var_param.index] = var_param;
                delete this.registered_var_params[var_param.index];
            } else {
                if (callbacks) {
                    this.registered_var_params[var_param.index].remove_callbacks(callbacks);
                }
            }
        }

        if (needs_unregistration && ObjectHandler.getInstance().hasAtLeastOneAttribute(needs_unregistration)) {
            this.throttled_server_unregistration(needs_unregistration);
        }
    }

    /**
     * Objectif : appeler les callbacks suite à une mise à jour de VarDatas
     * @param var_datas Les datas reçues via les notifications
     */
    public async notifyCallbacks(var_datas: VarDataValueResVO[] | { [index: string]: VarDataValueResVO }) {

        for (let i in var_datas) {
            let var_data: VarDataValueResVO = var_datas[i];
            let registered_var = this.registered_var_params[var_data.index];
            let uids_to_remove: number[] = [];

            if (!registered_var) {
                continue;
            }

            for (let j in registered_var.callbacks) {
                let callback = registered_var.callbacks[j];

                // cas d'un callback en VALID uniquement
                if ((callback.value_type == VarUpdateCallback.VALUE_TYPE_VALID) && (
                    (!var_data) ||
                    (typeof VarsClientController.getInstance().cached_var_datas[var_data.index].value == 'undefined') ||
                    (!VarsClientController.getInstance().cached_var_datas[var_data.index].value_ts))
                ) {
                    continue;
                }

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

    private async check_invalid_valued_params_registration() {

        try {

            /**
             * On prend toutes les datas registered et si on en trouve auxquelles il manque des valeurs, on renvoie un register pour s'assurer qu'on
             *  est bien en attente d'un résultat de calcul
             */
            let check_params: { [index: string]: VarDataBaseVO } = {};

            for (let i in this.registered_var_params) {
                let registered_var_param: RegisteredVarDataWrapper = this.registered_var_params[i];

                let var_data: VarDataValueResVO = VarsClientController.getInstance().cached_var_datas[registered_var_param.var_param.index];

                if (var_data && (typeof var_data.value !== 'undefined') && !var_data.is_computing) {
                    if (this.registered_var_params_to_check_next_time[registered_var_param.var_param.index]) {
                        delete this.registered_var_params_to_check_next_time[registered_var_param.var_param.index];
                    }

                    continue;
                }

                if (!this.registered_var_params_to_check_next_time[registered_var_param.var_param.index]) {
                    this.registered_var_params_to_check_next_time[registered_var_param.var_param.index] = true;
                    continue;
                }

                check_params[registered_var_param.var_param.index] = registered_var_param.var_param;
            }

            if (check_params && ObjectHandler.getInstance().hasAtLeastOneAttribute(check_params)) {
                this.throttled_server_registration(check_params);
            }
        } catch (error) {
        }
        this.prepare_next_check();
    }

    private prepare_next_check() {
        let self = this;

        // On lance un process parrallèle qui check en permanence que les vars pour lesquels on a pas de valeurs sont bien enregistrées côté serveur
        setTimeout(async () => {
            await self.check_invalid_valued_params_registration();
        }, self.timeout_check_registrations);
    }

    /**
     * appelle la fonction {@link ModuleVarServer.register_params register_params} coté server (ModuleVarServer)
     * @see {@link ModuleVarServer.register_params }
     * @param params
     */
    private async do_server_registration(params: { [index: string]: VarDataBaseVO }) {
        await ModuleVar.getInstance().register_params(Object.values(params));
    }

    private async do_server_unregistration(params: { [index: string]: VarDataBaseVO }) {

        let filtered_unregistrations: { [index: string]: VarDataBaseVO } = {};

        for (let i in params) {
            if ((!this.registered_var_params[i]) || (!this.registered_var_params[i].nb_registrations)) {
                filtered_unregistrations[i] = params[i];
            }
        }

        await ModuleVar.getInstance().unregister_params(Object.values(filtered_unregistrations));
    }
}