/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConfigurationService from '../../../server/env/ConfigurationService';
import EnvParam from '../../../server/env/EnvParam';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class CHECKEnvParamsForMDPRecovery implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): CHECKEnvParamsForMDPRecovery {
        if (!CHECKEnvParamsForMDPRecovery.instance) {
            CHECKEnvParamsForMDPRecovery.instance = new CHECKEnvParamsForMDPRecovery();
        }
        return CHECKEnvParamsForMDPRecovery.instance;
    }

    private static instance: CHECKEnvParamsForMDPRecovery = null;

    get uid(): string {
        return 'CHECKEnvParamsForMDPRecovery';
    }

    private constructor() { }

    /**
     * Objectif : check qu'on a des params crédibles pour la récup de MDP
     */
    public async work(db: IDatabase<any>) {

        let param: EnvParam = ConfigurationService.node_configuration;

        if (param.URL_RECOVERY.indexOf('://') > 0) {
            throw new Error('La configuration de URL_RECOVERY est invalide, elle ne doit contenir que l\'adresse après ' + param.BASE_URL + '. Très probablement "login#/recover".');
        }

        if (param.URL_RECOVERY_CHALLENGE.indexOf('://') > 0) {
            throw new Error('La configuration de URL_RECOVERY_CHALLENGE est invalide, elle ne doit contenir que l\'adresse après ' + param.BASE_URL + '. Très probablement "login#/reset".');
        }

        if (param.URL_RECOVERY != "login#/recover") {
            console.error('ATTENTION : très probablement une erreur sur le paramètre URL_RECOVERY qui doit être par défaut = à "login#/recover" .');
        }
        if (param.URL_RECOVERY_CHALLENGE != "login#/reset") {
            console.error('ATTENTION : très probablement une erreur sur le paramètre URL_RECOVERY_CHALLENGE qui doit être par défaut = à "login#/reset" .');
        }
    }
}