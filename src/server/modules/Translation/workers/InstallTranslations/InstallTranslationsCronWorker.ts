import ICronWorker from '../../../Cron/interfaces/ICronWorker';
import DefaultTranslationsServerManager from '../../DefaultTranslationsServerManager';

export default class InstallTranslationsCronWorker implements ICronWorker {

    public static getInstance() {
        if (!InstallTranslationsCronWorker.instance) {
            InstallTranslationsCronWorker.instance = new InstallTranslationsCronWorker();
        }
        return InstallTranslationsCronWorker.instance;
    }

    private static instance: InstallTranslationsCronWorker = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "InstallTranslationsCronWorker";
    }

    /**
     * On supprime les notifications lues depuis plus de 10 jours, et on supprime les notifs de plus de 2 mois
     */
    public async work() {
        await DefaultTranslationsServerManager.getInstance().saveDefaultTranslations(true);
    }
}