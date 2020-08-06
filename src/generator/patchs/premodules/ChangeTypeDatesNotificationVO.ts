/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';

export default class ChangeTypeDatesNotificationVO implements IGeneratorWorker {

    public static getInstance(): ChangeTypeDatesNotificationVO {
        if (!ChangeTypeDatesNotificationVO.instance) {
            ChangeTypeDatesNotificationVO.instance = new ChangeTypeDatesNotificationVO();
        }
        return ChangeTypeDatesNotificationVO.instance;
    }

    private static instance: ChangeTypeDatesNotificationVO = null;

    get uid(): string {
        return 'ChangeTypeDatesNotificationVO';
    }

    private constructor() { }

    /**
     * Objectif : Changer le type des fields dates des notificationVO si c'est pas fait mais que la table existe
     */
    public async work(db: IDatabase<any>) {
        try {
            // On drop la table des notifications pour forcer sa création propre. Les anciennes notifications sont de toutes façons inutilisées pour le moment.
            await db.none("DROP TABLE ref.module_pushdata_notification;");
        } catch (error) {
            ConsoleHandler.getInstance().log('Ignore this error if new project: ' + error);
        }
    }
}