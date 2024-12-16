import { debug } from 'console';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import MatroidController from '../../../../shared/modules/Matroid/MatroidController';
import ModuleVar from '../../../../shared/modules/Var/ModuleVar';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../shared/modules/Var/vos/VarDataValueResVO';
import VarUpdateCallback from '../../../../shared/modules/Var/vos/VarUpdateCallback';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../shared/tools/ThrottleHelper';
import PushDataVueModule from '../../modules/PushData/PushDataVueModule';
import RegisteredVarDataWrapper from './vos/RegisteredVarDataWrapper';

export default class VarsClientController {
    /**
     * Les vars params registered et donc registered aussi côté serveur, si on est déjà registered on a pas besoin de rajouter des instances
     *  on stocke aussi le nombre d'enregistrements, pour pouvoir unregister au fur et à mesure
     */
    public static registered_var_params: { [index: string]: RegisteredVarDataWrapper } = {};

    /**
     * On stocke les dernières Vardatares reçues (TODO FIXME à nettoyer peut-etre au bout d'un moment)
     */
    public static cached_var_datas: { [index: string]: VarDataValueResVO } = {};

    private static CB_UID: number = 0;
    private static instance: VarsClientController = null;

    public last_notif_received: number = 0;

    /**
     * On utilise pour se donner un délai de 30 secondes pour les calculs et si on dépasse (entre 30 et 60 secondes) on relance un register sur la var pour rattrapper un oublie de notif
     */
    public registered_var_params_to_check_next_time: { [index: string]: boolean } = {};

    public throttled_server_registration = ThrottleHelper.declare_throttle_with_mappable_args(this.do_server_registration.bind(this), 50, { leading: false, trailing: true });
    public throttled_server_unregistration = ThrottleHelper.declare_throttle_with_mappable_args(this.do_server_unregistration.bind(this), 100, { leading: false, trailing: true });

    /**
     * Utilisé comme sémaphore pour l'édition inline des vars
     */
    public inline_editing_cb = null;

    private timeout_check_registrations: number = 30000;
    private timeout_update_params_registration: number = 10 * 60 * 1000;

    protected constructor() {

        // On lance un process parallèle qui check en permanence que les vars pour lesquels on a pas de valeurs sont bien enregistrées côté serveur
        this.prepare_next_check();

        // On lance aussi un process pour update les subs côté serveur et pas les perdre sur un timeout
        this.update_params_registration().then().catch((err) => ConsoleHandler.error(err));
    }


    public static get_CB_UID(): number {
        return this.CB_UID++;
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): VarsClientController {
        if (!VarsClientController.instance) {
            VarsClientController.instance = new VarsClientController();
        }
        return VarsClientController.instance;
    }


    /**
     * L'objectif est de stocker les registered_params et d'envoyer une requête pour avoir une valeur :
     *  - soit par ce qu'on a pas de valeur connue pour cet index
     *  - soit par ce qu'on nous demande explicitement de forcer une nouvelle demande au serveur
     *      (ce qui ne devrait pas être utile donc pour le moment on gère pas ce cas)
     *
     * @param var_params les params sur lesquels on veut s'abonner
     * @param callbacks les callbacks pour le suivi des mises à jour si on utilise pas simplement
     *                  le store des vars (exemple les directives). Attention il faut bien les unregisters aussi
     * @remark rajoute les callbacks dans registered_var_params pour les var_params spécifiés
     */
    public registerParams(
        var_params: VarDataBaseVO[] | { [index: string]: VarDataBaseVO },
        callbacks: { [cb_uid: number]: VarUpdateCallback } = null
    ) {

        const needs_registration: { [index: string]: VarDataBaseVO } = {};

        for (const i in var_params) {
            const var_param = var_params[i];

            if (!var_param) {
                continue;
            }

            if (!MatroidController.check_bases_not_max_ranges(var_param)) {
                ConsoleHandler.error('VarsClientController:registerParams:!check_bases_not_max_ranges:' + var_param.index);
                continue;
            }

            if (!VarsClientController.registered_var_params[var_param.index]) {

                needs_registration[var_param.index] = var_param;
                VarsClientController.registered_var_params[var_param.index] = new RegisteredVarDataWrapper(var_param);
                if (callbacks) {
                    VarsClientController.registered_var_params[var_param.index].add_callbacks(callbacks);
                }
            } else {

                VarsClientController.registered_var_params[var_param.index].nb_registrations++;

                if (callbacks) {
                    VarsClientController.registered_var_params[var_param.index].add_callbacks(callbacks);
                }
            }
        }

        if (needs_registration && ObjectHandler.hasAtLeastOneAttribute(needs_registration)) {
            this.throttled_server_registration(needs_registration);
        }
    }

    /**
     * En cas de reco du serveur, qui peut avoir reboot par exemple, on relance tous les registers sans exception
     */
    public async registerAllParamsAgain() {

        const needs_registration: { [index: string]: VarDataBaseVO } = {};

        for (const i in VarsClientController.registered_var_params) {
            const var_param_wrapper = VarsClientController.registered_var_params[i];

            if (!MatroidController.check_bases_not_max_ranges(var_param_wrapper.var_param)) {
                ConsoleHandler.error('VarsClientController:registerParams:!check_bases_not_max_ranges:' + var_param_wrapper.var_param.index);
                continue;
            }

            needs_registration[var_param_wrapper.var_param.index] = var_param_wrapper.var_param;
        }

        if (needs_registration && ObjectHandler.hasAtLeastOneAttribute(needs_registration)) {
            this.throttled_server_registration(needs_registration);
        }
    }

    /**
     * L'objectif est de register et attendre les résultats
     * @param var_params les params sur lesquels on veut s'abonner
     * @param callbacks les callbacks pour le suivi des mises à jour si on utilise pas simplement le store des vars (exemple les directives). Attention il faut bien les unregisters aussi
     */
    public async registerParamsAndWait(var_params: VarDataBaseVO[] | { [index: string]: VarDataBaseVO }, value_type: number = VarUpdateCallback.VALUE_TYPE_VALID): Promise<{ [index: string]: VarDataBaseVO }> {

        const filtered_var_params: VarDataBaseVO[] = [];

        for (const i in var_params) {
            const var_param = var_params[i];

            if (!var_param) {
                continue;
            }

            if (!MatroidController.check_bases_not_max_ranges(var_param)) {
                ConsoleHandler.error('VarsClientController:registerParams:!check_bases_not_max_ranges:' + var_param.index);
                continue;
            }

            filtered_var_params.push(var_param);
        }

        if (!filtered_var_params.length) {
            return null;
        }

        return new Promise(async (resolve, reject) => {
            const callbacks: { [cb_uid: number]: VarUpdateCallback } = {};
            const res: { [index: string]: VarDataBaseVO } = {};
            let nb_waited_cbs: number = filtered_var_params.length;

            const callback = VarUpdateCallback.newCallbackOnce(async (varData: VarDataBaseVO) => {
                res[varData.index] = varData;
                nb_waited_cbs--;
                if (nb_waited_cbs <= 0) {
                    resolve(res);
                }
            }, value_type);
            callbacks[callback.UID] = callback;

            this.registerParams(filtered_var_params, callbacks);
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
            const callback = VarUpdateCallback.newCallbackOnce(
                async (varData: T) => { resolve(varData); },
                value_type
            );

            this.registerParams([var_param], { [callback.UID]: callback });
        });
    }


    /**
     * Retire 1 sur le nb d'enregistrement de chaque var_param passé en paramètre de la fonction
     *  et si on atteint 0, on désinscrit totalement le var_param et côté serveur également
     * @param var_params Les paramètres à désinscrire
     * @param callbacks Les callbacks associés - les mêmes uids que lors du register
     */
    public unRegisterParams(
        var_params: VarDataBaseVO[] | { [index: string]: VarDataBaseVO },
        callbacks: { [cb_uid: number]: VarUpdateCallback } = null
    ) {

        const needs_unregistration: { [index: string]: VarDataBaseVO } = {};

        for (const i in var_params) {
            const var_param = var_params[i];

            if (!VarsClientController.registered_var_params[var_param.index]) {
                continue;
                // ConsoleHandler.error('unRegisterParams on unregistered param... ' + var_param.index);
            }

            if (!MatroidController.check_bases_not_max_ranges(var_param)) {
                ConsoleHandler.error('VarsClientController:registerParams:!check_bases_not_max_ranges:' + var_param.index);
                continue;
            }

            VarsClientController.registered_var_params[var_param.index].nb_registrations--;
            if (VarsClientController.registered_var_params[var_param.index].nb_registrations < 0) {
                continue;
                // ConsoleHandler.error('unRegisterParams on unregistered param... ' + var_param.index);
            }

            if (VarsClientController.registered_var_params[var_param.index].nb_registrations <= 0) {
                needs_unregistration[var_param.index] = var_param;
                delete VarsClientController.registered_var_params[var_param.index];
            } else {
                if (callbacks) {
                    VarsClientController.registered_var_params[var_param.index].remove_callbacks(callbacks);
                }
            }
        }

        if (needs_unregistration && ObjectHandler.hasAtLeastOneAttribute(needs_unregistration)) {
            this.throttled_server_unregistration(needs_unregistration);
        }
    }

    /**
     * Objectif : appeler les callbacks suite à une mise à jour de VarDatas
     * @param var_datas Les datas reçues via les notifications
     */
    public async notifyCallbacks(var_datas: VarDataValueResVO[] | { [index: string]: VarDataValueResVO }) {

        const promises = [];
        for (const i in var_datas) {
            const var_data: VarDataValueResVO = var_datas[i];
            const registered_var = VarsClientController.registered_var_params[var_data.index];
            const uids_to_remove: number[] = [];

            if (PushDataVueModule.getInstance().env_params && PushDataVueModule.getInstance().env_params.debug_vars_notifs) {
                ConsoleHandler.log('VarsClientController:notifyCallbacks:' + var_data.index + ':' + var_data.value + ':' + var_data.value_ts + ':' + var_data.value_type + ':' + var_data.is_computing + ':registered_var:' + !!registered_var);
            }

            if (!registered_var) {
                continue;
            }

            for (const j in registered_var.callbacks) {
                const callback = registered_var.callbacks[j];

                // cas d'un callback en VALID uniquement
                if ((callback.value_type == VarUpdateCallback.VALUE_TYPE_VALID) && (
                    (!var_data) ||
                    (!VarsClientController.cached_var_datas[var_data.index]) ||
                    (typeof VarsClientController.cached_var_datas[var_data.index].value == 'undefined') ||
                    (!VarsClientController.cached_var_datas[var_data.index].value_ts))
                ) {
                    if (PushDataVueModule.getInstance().env_params && PushDataVueModule.getInstance().env_params.debug_vars_notifs) {
                        if (var_data) {
                            ConsoleHandler.log('VarsClientController:notifyCallbacks:ignore callback:' + var_data.index + ':' + var_data.value + ':' + var_data.value_ts + ':' + var_data.value_type + ':' + var_data.is_computing + ':callback.value_type:' + callback.value_type);
                        } else {
                            ConsoleHandler.log('VarsClientController:notifyCallbacks:ignore callback: no var_data');
                        }
                    }

                    continue;
                }

                if (callback.callback) {
                    if (PushDataVueModule.getInstance().env_params && PushDataVueModule.getInstance().env_params.debug_vars_notifs) {
                        if (var_data) {
                            ConsoleHandler.log('VarsClientController:notifyCallbacks:push callback:' + var_data.index + ':' + var_data.value + ':' + var_data.value_ts + ':' + var_data.value_type + ':' + var_data.is_computing + ':callback.value_type:' + callback.value_type);
                        } else {
                            ConsoleHandler.log('VarsClientController:notifyCallbacks:push callback: no var_data');
                        }
                    }

                    promises.push(callback.callback(var_data));
                } else {
                    if (PushDataVueModule.getInstance().env_params && PushDataVueModule.getInstance().env_params.debug_vars_notifs) {
                        if (var_data) {
                            ConsoleHandler.log('VarsClientController:notifyCallbacks:no callback:' + var_data.index + ':' + var_data.value + ':' + var_data.value_ts + ':' + var_data.value_type + ':' + var_data.is_computing + ':callback.value_type:' + callback.value_type);
                        } else {
                            ConsoleHandler.log('VarsClientController:notifyCallbacks:no callback: no var_data');
                        }
                    }
                }

                if (callback.type == VarUpdateCallback.TYPE_ONCE) {
                    uids_to_remove.push(callback.UID);
                }
            }

            for (const j in uids_to_remove) {
                if (PushDataVueModule.getInstance().env_params && PushDataVueModule.getInstance().env_params.debug_vars_notifs) {
                    ConsoleHandler.log('VarsClientController:notifyCallbacks:deleteuid:' + uids_to_remove[j]);
                }

                delete registered_var.callbacks[uids_to_remove[j]];
            }
        }

        await all_promises(promises);
    }

    private async check_invalid_valued_params_registration() {

        try {

            /**
             * On renvoie aucune var si le serveur est en cours de calcul. si on a des notifs dans les dernieres secondes,
             *  on sait qu'il est en train de nous répondre, donc on attend
             */
            if ((Dates.now() - VarsClientController.getInstance().last_notif_received) < 10) {
                ConsoleHandler.log('check_invalid_valued_params_registration : server is calculating, waiting:' + VarsClientController.getInstance().last_notif_received);
                this.prepare_next_check();
                return;
            }


            /**
             * On prend toutes les datas registered et si on en trouve auxquelles il manque des valeurs, on renvoie un register pour s'assurer qu'on
             *  est bien en attente d'un résultat de calcul
             */
            const check_params: { [index: string]: VarDataBaseVO } = {};

            for (const i in VarsClientController.registered_var_params) {
                const registered_var_param: RegisteredVarDataWrapper = VarsClientController.registered_var_params[i];

                const var_data: VarDataValueResVO = VarsClientController.cached_var_datas[registered_var_param.var_param.index];

                if (var_data && (typeof var_data.value !== 'undefined') && !var_data.is_computing) {
                    if (VarsClientController.getInstance().registered_var_params_to_check_next_time[registered_var_param.var_param.index]) {
                        delete VarsClientController.getInstance().registered_var_params_to_check_next_time[registered_var_param.var_param.index];
                    }

                    continue;
                }

                if (!VarsClientController.getInstance().registered_var_params_to_check_next_time[registered_var_param.var_param.index]) {
                    VarsClientController.getInstance().registered_var_params_to_check_next_time[registered_var_param.var_param.index] = true;
                    continue;
                }

                check_params[registered_var_param.var_param.index] = registered_var_param.var_param;
            }

            if (check_params && ObjectHandler.hasAtLeastOneAttribute(check_params)) {
                this.throttled_server_registration(check_params);
            }
        } catch (error) {
            //
        }
        this.prepare_next_check();
    }

    private prepare_next_check() {
        const self = this;

        // On lance un process parrallèle qui check en permanence que les vars pour lesquels on a pas de valeurs sont bien enregistrées côté serveur
        setTimeout(async () => {
            await self.check_invalid_valued_params_registration();
        }, self.timeout_check_registrations);
    }

    private async update_params_registration() {
        const self = this;

        try {
            if (!VarsClientController.registered_var_params) {
                setTimeout(self.update_params_registration.bind(this), self.timeout_update_params_registration);
                return;
            }

            const vars = Object.values(VarsClientController.registered_var_params);
            if (!vars || !vars.length) {
                setTimeout(self.update_params_registration.bind(this), self.timeout_update_params_registration);
                return;
            }
            await ModuleVar.getInstance().update_params_registration(vars.map((v) => v.var_param));
        } catch (error) {
            ConsoleHandler.error(error);
        }

        // On lance un process parrallèle qui check en permanence que les vars pour lesquels on a pas de valeurs sont bien enregistrées côté serveur
        setTimeout(self.update_params_registration.bind(this), self.timeout_update_params_registration);
    }

    private async do_server_registration(params: { [index: string]: VarDataBaseVO }) {
        await ModuleVar.getInstance().register_params(Object.values(params));
    }

    private async do_server_unregistration(params: { [index: string]: VarDataBaseVO }) {

        const filtered_unregistrations: { [index: string]: VarDataBaseVO } = {};

        for (const i in params) {
            if ((!VarsClientController.registered_var_params[i]) || (!VarsClientController.registered_var_params[i].nb_registrations)) {
                filtered_unregistrations[i] = params[i];
            }
        }

        const unregistrations = Object.values(filtered_unregistrations);
        if (unregistrations && unregistrations.length) {
            await ModuleVar.getInstance().unregister_params(unregistrations);
        }
    }
}