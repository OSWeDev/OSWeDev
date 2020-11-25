import throttle from 'lodash/throttle';
import ModuleVar from '../../../../shared/modules/Var/ModuleVar';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../shared/modules/Var/vos/VarUpdateCallback';
import TypesHandler from '../../../../shared/tools/TypesHandler';
import VueAppBase from '../../../VueAppBase';
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
    public throttled_for_server_registration: VarDataBaseVO[] = [];
    public throttled_for_server_unregistration: VarDataBaseVO[] = [];

    public throttled_server_registration = throttle(this.do_server_registration.bind(this), 100, { leading: false });
    public throttled_server_unregistration = throttle(this.do_server_unregistration.bind(this), 100, { leading: false });

    private timeout_check_registrations: number = 10000;

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
            this.throttled_for_server_registration = this.throttled_for_server_registration.concat(needs_registration);
            this.throttled_server_registration();
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
            this.throttled_for_server_registration = this.throttled_for_server_registration.concat(needs_registration);
            this.throttled_server_registration();
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
            this.throttled_for_server_unregistration = this.throttled_for_server_unregistration.concat(needs_unregistration);
            this.throttled_server_unregistration();
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

    private async check_invalid_valued_params_registration() {

        try {

            /**
             * On prend toutes les datas registered et si on en trouve auxquelles il manque des valeurs, on renvoie un register pour s'assurer qu'on
             *  est bien en attente d'un résultat de calcul
             */
            let check_params: VarDataBaseVO[] = [];
            for (let i in this.registered_var_params) {
                let registered_var_param: RegisteredVarDataWrapper = this.registered_var_params[i];

                let getVarDatas = VueAppBase.instance_.vueInstance.$store.getters['VarStore/getVarDatas'];

                let var_data: VarDataValueResVO = getVarDatas[registered_var_param.var_param.index];

                if (var_data && (typeof var_data.value !== 'undefined') && !var_data.is_computing) {
                    continue;
                }
                check_params.push(registered_var_param.var_param);
            }

            if ((!check_params) || (!check_params.length)) {
                return;
            }

            this.throttled_for_server_registration = this.throttled_for_server_registration.concat(check_params);
            this.throttled_server_registration();
        } catch (error) {
        }
        this.prepare_next_check();
    }

    private prepare_next_check() {
        let self = this;

        // On lance un process parrallèle qui check en permanence que les vars pour lesquels on a pas de valeurs sont bien enregistrées côté serveur
        setTimeout(() => {
            self.check_invalid_valued_params_registration();
        }, self.timeout_check_registrations);
    }

    private async do_server_registration() {
        let throttled_for_server_registration: VarDataBaseVO[] = this.throttled_for_server_registration;
        this.throttled_for_server_registration = [];

        await ModuleVar.getInstance().register_params(throttled_for_server_registration);
    }

    private async do_server_unregistration() {
        let throttled_for_server_unregistration: VarDataBaseVO[] = this.throttled_for_server_unregistration;
        this.throttled_for_server_unregistration = [];

        await ModuleVar.getInstance().unregister_params(throttled_for_server_unregistration);
    }
}