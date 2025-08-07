import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import UserPasswordHistoryVO from '../../../shared/modules/AccessPolicy/vos/UserPasswordHistoryVO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import { filter } from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ModuleTableFieldController from '../../../shared/modules/DAO/ModuleTableFieldController';

export default class PasswordHistoryServerController {

    private static instance: PasswordHistoryServerController = null;

    // Nombre de mots de passe à conserver dans l'historique
    private static readonly PASSWORD_HISTORY_COUNT = 5;

    private constructor() { }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!PasswordHistoryServerController.instance) {
            PasswordHistoryServerController.instance = new PasswordHistoryServerController();
        }
        return PasswordHistoryServerController.instance;
    }


    /**
     * Valide un mot de passe selon les critères de sécurité et l'historique
     * @param user_id L'ID de l'utilisateur
     * @param new_password Le nouveau mot de passe en clair
     * @returns null si valide, sinon le code d'erreur
     */
    public async validatePassword(user_id: number, new_password: string): Promise<string | null> {
        try {
            // Vérifier la complexité du nouveau mot de passe
            const passwordValidation = ModuleTableFieldController.passwordIsValidProposition(new_password);
            if (passwordValidation) {
                ConsoleHandler.error('Mot de passe non conforme:', passwordValidation);
                return 'PASSWORD_INVALID';
            }

            // Vérifier l'historique des mots de passe
            const isPasswordReused = await this.isPasswordAlreadyUsed(user_id, new_password);
            if (isPasswordReused) {
                ConsoleHandler.error('Mot de passe déjà utilisé pour l\'utilisateur:', user_id);
                return 'PASSWORD_REUSED';
            }

            return null; // Valide
        } catch (error) {
            ConsoleHandler.error('Erreur lors de la validation du mot de passe:', error);
            return 'UNKNOWN';
        }
    }

    /**
     * Vérifie si un mot de passe a déjà été utilisé par un utilisateur
     * @param user_id L'ID de l'utilisateur
     * @param new_password Le nouveau mot de passe en clair
     * @returns true si le mot de passe a déjà été utilisé
     */
    public async isPasswordAlreadyUsed(user_id: number, new_password: string): Promise<boolean> {
        try {
            ConsoleHandler.log('Vérification historique mot de passe pour utilisateur:', user_id);

            // Récupérer l'historique des mots de passe de l'utilisateur
            const password_history = await query(UserPasswordHistoryVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserPasswordHistoryVO>().user_id, user_id)
                .exec_as_server()
                .select_vos<UserPasswordHistoryVO>();

            ConsoleHandler.log('Historique trouvé:', password_history?.length || 0, 'entrées');

            if (!password_history || password_history.length === 0) {
                ConsoleHandler.log('Aucun historique trouvé, mot de passe autorisé');
                return false;
            }

            // Vérifier chaque hash de l'historique
            for (const history_entry of password_history) {
                ConsoleHandler.log('Comparaison avec hash:', history_entry.password_hash?.substring(0, 20) + '...');
                const isMatch = await this.comparePasswordWithHash(new_password, history_entry.password_hash);
                ConsoleHandler.log('Résultat comparaison:', isMatch);
                if (isMatch) {
                    ConsoleHandler.warn('Mot de passe trouvé dans l\'historique !');
                    return true;
                }
            }

            ConsoleHandler.log('Mot de passe non trouvé dans l\'historique, autorisé');
            return false;
        } catch (error) {
            ConsoleHandler.error('Erreur lors de la vérification de l\'historique des mots de passe:', error);
            return false;
        }
    }

    /**
     * Ajoute un nouveau mot de passe à l'historique
     * @param user_id L'ID de l'utilisateur
     * @param clear_password Le mot de passe en clair qui sera hashé
     */
    public async addPasswordToHistory(user_id: number, clear_password: string): Promise<void> {
        try {
            // Hasher le mot de passe avec bcrypt via PostgreSQL
            const hashed_password = await this.hashPassword(clear_password);

            await this.addPasswordHashToHistory(user_id, hashed_password);
        } catch (error) {
            ConsoleHandler.error('Erreur lors de l\'ajout du mot de passe à l\'historique:', error);
        }
    }

    /**
     * Ajoute un hash de mot de passe directement à l'historique
     * @param user_id L'ID de l'utilisateur
     * @param password_hash Le hash du mot de passe
     */
    public async addPasswordHashToHistory(user_id: number, password_hash: string): Promise<void> {
        try {
            // Marquer tous les anciens mots de passe comme non-actuels
            const old_histories = await query(UserPasswordHistoryVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserPasswordHistoryVO>().user_id, user_id)
                .add_filters([
                    filter(UserPasswordHistoryVO.API_TYPE_ID, field_names<UserPasswordHistoryVO>().is_current).is_true()
                ])
                .exec_as_server()
                .select_vos<UserPasswordHistoryVO>();

            for (const old_history of old_histories) {
                old_history.is_current = false;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(old_history);
            }

            // Créer une nouvelle entrée d'historique
            const new_history = new UserPasswordHistoryVO();
            new_history.user_id = user_id;
            new_history.password_hash = password_hash;
            new_history.created_date = Dates.now();
            new_history.is_current = true;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(new_history);

            // Nettoyer l'historique ancien (garder seulement les X derniers)
            await this.cleanupOldPasswords(user_id);

        } catch (error) {
            ConsoleHandler.error('Erreur lors de l\'ajout du hash de mot de passe à l\'historique:', error);
        }
    }

    /**
     * Hashe un mot de passe en utilisant bcrypt via PostgreSQL
     * @param clear_password Le mot de passe en clair
     * @returns Le hash du mot de passe
     */
    private async hashPassword(clear_password: string): Promise<string> {
        try {
            const result = await ModuleDAOServer.getInstance().query(
                "SELECT crypt($1, gen_salt('bf')) as hash",
                [clear_password]
            );

            if (result && result.length > 0) {
                return result[0].hash;
            }

            throw new Error('Erreur lors du hachage du mot de passe');
        } catch (error) {
            ConsoleHandler.error('Erreur lors du hachage du mot de passe:', error);
            throw error;
        }
    }

    /**
     * Nettoie l'historique des mots de passe en gardant seulement les plus récents
     * @param user_id L'ID de l'utilisateur
     */
    private async cleanupOldPasswords(user_id: number): Promise<void> {
        try {
            const all_histories = await query(UserPasswordHistoryVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserPasswordHistoryVO>().user_id, user_id)
                .set_sorts([
                    new SortByVO(UserPasswordHistoryVO.API_TYPE_ID, field_names<UserPasswordHistoryVO>().created_date, false)
                ])
                .exec_as_server()
                .select_vos<UserPasswordHistoryVO>();

            if (all_histories.length > PasswordHistoryServerController.PASSWORD_HISTORY_COUNT) {
                const to_delete = all_histories.slice(PasswordHistoryServerController.PASSWORD_HISTORY_COUNT);

                for (const history_entry of to_delete) {
                    await ModuleDAOServer.getInstance().deleteVOs_as_server([history_entry]);
                }
            }
        } catch (error) {
            ConsoleHandler.error('Erreur lors du nettoyage de l\'historique des mots de passe:', error);
        }
    }

    /**
     * Compare un mot de passe en clair avec un hash en utilisant PostgreSQL
     * @param password Le mot de passe en clair
     * @param hash Le hash à comparer
     * @returns true si le mot de passe correspond au hash
     */
    private async comparePasswordWithHash(password: string, hash: string): Promise<boolean> {
        try {
            ConsoleHandler.log('Comparaison mot de passe avec hash via PostgreSQL');
            // Utiliser la fonction PostgreSQL crypt pour comparer
            const result = await ModuleDAOServer.instance.query(
                "SELECT crypt($1, $2) = $2 as matches",
                [password, hash],
                true
            );

            ConsoleHandler.log('Résultat requête PostgreSQL:', result);
            const matches = result && result.length > 0 && result[0]?.matches === true;
            ConsoleHandler.log('Match final:', matches);
            return matches;
        } catch (error) {
            ConsoleHandler.error('Erreur lors de la comparaison du mot de passe:', error);
            return false;
        }
    }
}
