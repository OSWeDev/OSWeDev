

import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';
import TimeSegment from '../../../../../shared/modules/DataRender/vos/TimeSegment';
import Dates from '../../../../../shared/modules/FormatDatesNombres/Dates/Dates';


export default class PasswordInvalidationController {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!PasswordInvalidationController.instance) {
            PasswordInvalidationController.instance = new PasswordInvalidationController();
        }
        return PasswordInvalidationController.instance;
    }

    private static instance: PasswordInvalidationController = null;

    private constructor() {
    }

    public get_users_to_remind_and_invalidate(
        users: UserVO[],
        reminder1_days: number,
        reminder2_days: number,
        invalid_days: number,
        users_to_remind_1: UserVO[],
        users_to_remind_2: UserVO[],
        users_to_invalidate: UserVO[]): void {

        for (const i in users) {
            const user: UserVO = users[i];

            if (user.blocked) {
                continue;
            }

            if (user.invalidated) {
                continue;
            }

            /**
             * Si la date de modif est dans le futur, on ignore
             */
            if (user.password_change_date >= Dates.now()) {
                continue;
            }

            // combien de jours depuis date de changement de mdp ?
            const nb_days: number = (Dates.now() - user.password_change_date) / 60 / 60 / 24; // Result of diff should be negativ

            const expiration_date: number = Dates.add(user.password_change_date, invalid_days, TimeSegment.TYPE_DAY);
            const nb_days_to_invalidation: number = invalid_days - nb_days;

            // Le cas de l'invalidation
            // cas où la date de changement de mdp est passée de plus de PARAM_NAME_PWD_INVALIDATION_DAYS jours
            if (Dates.now() >= expiration_date) {
                users_to_invalidate.push(user);
                continue;
            }


            // Second rappel
            // cas où on est à moins de PARAM_NAME_REMINDER_PWD2_DAYS jours de la date de changement de mdp
            if ((!user.reminded_pwd_2) && (nb_days_to_invalidation <= reminder2_days)) {
                users_to_remind_2.push(user);
                continue;
            }

            // Premier rappel
            // cas où on est à moins de PARAM_NAME_REMINDER_PWD1_DAYS jours de la date de changement de mdp
            if ((!user.reminded_pwd_1) && (nb_days_to_invalidation <= reminder1_days)) {
                users_to_remind_1.push(user);
                continue;
            }

        }
    }
}