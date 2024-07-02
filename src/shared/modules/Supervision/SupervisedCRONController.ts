import EnvHandler from '../../tools/EnvHandler';
import ISupervisedItemController from './interfaces/ISupervisedItemController';
import ISupervisedItemURL from './interfaces/ISupervisedItemURL';
import SupervisedCRONVO from './vos/SupervisedCRONVO';

export default class SupervisedCRONController implements ISupervisedItemController<SupervisedCRONVO> {

    // istanbul ignore next: nothing to test
    public static getInstance(): SupervisedCRONController {
        if (!SupervisedCRONController.instance) {
            SupervisedCRONController.instance = new SupervisedCRONController();
        }

        return SupervisedCRONController.instance;
    }

    private static instance: SupervisedCRONController = null;

    private constructor() { }

    public is_actif(): boolean {
        return true;
    }

    public get_urls(supervised_item: SupervisedCRONVO): ISupervisedItemURL[] {

        return [{
            label: '! Forcer l\'exécution des crons maintenant !',
            url: EnvHandler.base_url + '#/cron'
        }, {
            label: 'Lancement manuel et individuel',
            url: EnvHandler.base_url + '#/cron/run'
        }, {
            label: 'Planification des crons',
            url: EnvHandler.base_url + '#/manage/cronworkplan'
        }];
    }

    public get_description(supervised_item: SupervisedCRONVO): string {

        return 'Suivi des CRONS - identification des lancement de cron en retard vs planification.';
    }
}