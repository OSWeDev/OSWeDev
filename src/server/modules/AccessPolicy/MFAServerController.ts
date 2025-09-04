import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import MFASessionVO from '../../../shared/modules/AccessPolicy/vos/MFASessionVO';
import UserMFAVO from '../../../shared/modules/AccessPolicy/vos/UserMFAVO';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import SortByVO from '../../../shared/modules/ContextFilter/vos/SortByVO';
import * as crypto from 'crypto';
import ModuleMailerServer from '../Mailer/ModuleMailerServer';
import SendInBlueSmsServerController from '../SendInBlue/sms/SendInBlueSmsServerController';
import SendInBlueSmsFormatVO from '../../../shared/modules/SendInBlue/vos/SendInBlueSmsFormatVO';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import ParamsServerController from '../Params/ParamsServerController';
import ModuleSendInBlue from '../../../shared/modules/SendInBlue/ModuleSendInBlue';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import SendInBlueMailServerController from '../SendInBlue/SendInBlueMailServerController';
import SendInBlueMailVO from '../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';

export default class MFAServerController {

    public static CODE_TEXT_MFA_EMAIL_SUBJECT: string = 'mfa.email.subject';
    public static CODE_TEXT_MFA_EMAIL_BODY: string = 'mfa.email.body';
    public static CODE_TEXT_MFA_SMS: string = 'mfa.sms.text';
    public static MAILCATEGORY_MFA = 'MAILCATEGORY.MFA';

    private static instance: MFAServerController = null;

    private constructor() {
    }

    public static getInstance(): MFAServerController {
        if (!MFAServerController.instance) {
            MFAServerController.instance = new MFAServerController();
        }
        return MFAServerController.instance;
    }

    /**
     * Génère un code de vérification MFA et l'envoie selon la méthode configurée
     */
    public async generateAndSendMFACode(user_id: number, mfa_method: string): Promise<string> {
        try {
            ConsoleHandler.log('generateAndSendMFACode: Début pour utilisateur: ' + user_id + ', méthode: ' + mfa_method);

            // Récupérer la configuration MFA de l'utilisateur (incluant celles non encore activées)
            const userMFAs = await query(UserMFAVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserMFAVO>().user_id, user_id)
                .exec_as_server()
                .select_vos<UserMFAVO>();

            ConsoleHandler.log('generateAndSendMFACode: Nombre de configs trouvées: ' + (userMFAs ? userMFAs.length : 0));

            if (!userMFAs || userMFAs.length === 0) {
                ConsoleHandler.error('generateAndSendMFACode: MFA_NOT_CONFIGURED pour utilisateur: ' + user_id);
                throw new Error('MFA_NOT_CONFIGURED');
            }

            const userMFA = userMFAs[0];
            ConsoleHandler.log('generateAndSendMFACode: Config trouvée: ' + JSON.stringify({
                id: userMFA.id,
                user_id: userMFA.user_id,
                is_active: userMFA.is_active,
                mfa_method: userMFA.mfa_method,
                has_totp_secret: !!userMFA.totp_secret
            }));

            // Générer un code temporaire
            let challenge_code: string;

            if (mfa_method === UserMFAVO.MFA_METHOD_AUTHENTICATOR) {
                // Pour TOTP, retourner le secret configuré ou générer un nouveau code de vérification
                if (!userMFA.totp_secret) {
                    throw new Error('MFA_TOTP_NOT_CONFIGURED');
                }
                // Retourner le secret TOTP pour génération du QR Code
                return userMFA.totp_secret;
            } else {
                // Générer un code à 6 chiffres pour email/SMS
                challenge_code = Math.floor(100000 + Math.random() * 900000).toString();
            }

            // Supprimer les anciennes sessions non vérifiées
            const oldSessions = await query(MFASessionVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<MFASessionVO>().user_id, user_id)
                .filter_is_false(field_names<MFASessionVO>().is_verified)
                .exec_as_server()
                .select_vos<MFASessionVO>();

            for (const session of oldSessions) {
                await ModuleDAOServer.getInstance().deleteVOs_as_server([session]);
            }

            // Créer une nouvelle session MFA
            const mfaSession = new MFASessionVO();
            mfaSession.user_id = user_id;
            mfaSession.challenge_code = challenge_code;
            mfaSession.mfa_method = mfa_method;
            mfaSession.expiry_date = Date.now() + (5 * 60 * 1000); // 5 minutes
            mfaSession.created_date = Date.now();

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(mfaSession);

            // Envoyer le code selon la méthode configurée
            await this.sendMFACodeToUser(user_id, challenge_code, mfa_method, userMFA);

            ConsoleHandler.log('Code MFA généré pour l\'utilisateur ' + user_id + ' (' + mfa_method + '): ' + challenge_code);

            return challenge_code; // En production, ne pas retourner le code

        } catch (error) {
            ConsoleHandler.error('Erreur lors de la génération du code MFA: ' + error);
            throw error;
        }
    }

    /**
     * Vérifie un code MFA
     */
    public async verifyMFACode(user_id: number, provided_code: string, mfa_method: string): Promise<boolean> {
        try {
            if (mfa_method === UserMFAVO.MFA_METHOD_AUTHENTICATOR) {
                return await this.verifyTOTPCode(user_id, provided_code);
            }

            // Pour email/SMS, vérifier avec la session
            const mfaSessions = await query(MFASessionVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<MFASessionVO>().user_id, user_id)
                .filter_by_text_eq(field_names<MFASessionVO>().mfa_method, mfa_method)
                .filter_is_false(field_names<MFASessionVO>().is_verified)
                .set_sort(new SortByVO(MFASessionVO.API_TYPE_ID, field_names<MFASessionVO>().created_date, false))
                .exec_as_server()
                .select_vos<MFASessionVO>();

            if (!mfaSessions || mfaSessions.length === 0) {
                ConsoleHandler.warn('Aucune session MFA trouvée pour l\'utilisateur: ' + user_id);
                return false;
            }

            const mfaSession = mfaSessions[0];

            // Vérifier si la session est expirée
            if (mfaSession.isExpired()) {
                ConsoleHandler.warn('Session MFA expirée pour l\'utilisateur: ' + user_id);
                return false;
            }

            // Vérifier si le maximum de tentatives est atteint
            if (mfaSession.isMaxAttemptsReached()) {
                ConsoleHandler.warn('Maximum de tentatives MFA atteint pour l\'utilisateur: ' + user_id);
                return false;
            }

            // Incrémenter le nombre de tentatives
            mfaSession.attempts++;

            // Vérifier le code
            if (mfaSession.challenge_code === provided_code) {
                mfaSession.is_verified = true;
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(mfaSession);
                ConsoleHandler.log('Code MFA vérifié avec succès pour l\'utilisateur: ' + user_id);
                return true;
            } else {
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(mfaSession);
                ConsoleHandler.warn('Code MFA incorrect pour l\'utilisateur: ' + user_id + ', tentative: ' + mfaSession.attempts);
                return false;
            }

        } catch (error) {
            ConsoleHandler.error('Erreur lors de la vérification du code MFA: ' + error);
            return false;
        }
    }

    /**
     * Configure la MFA pour un utilisateur
     */
    public async configureMFA(user_id: number, mfa_method: string, phone_number?: string): Promise<boolean> {
        try {
            // Vérifier si l'utilisateur existe
            const users = await query(UserVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserVO>().id, user_id)
                .exec_as_server()
                .select_vos<UserVO>();

            if (!users || users.length === 0) {
                throw new Error('USER_NOT_FOUND');
            }

            // Récupérer ou créer la configuration MFA
            const userMFAs = await query(UserMFAVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserMFAVO>().user_id, user_id)
                .exec_as_server()
                .select_vos<UserMFAVO>();

            let userMFA: UserMFAVO;
            if (userMFAs && userMFAs.length > 0) {
                userMFA = userMFAs[0];
                // Mettre à jour la date de création lors d'une reconfiguration
                // (nouvelle méthode ou réactivation après désactivation)
                userMFA.created_date = Date.now();
            } else {
                userMFA = new UserMFAVO();
                userMFA.user_id = user_id;
                userMFA.created_date = Date.now();
            }

            userMFA.mfa_method = mfa_method;
            userMFA.is_active = false; // Sera activé après vérification

            if (mfa_method === UserMFAVO.MFA_METHOD_SMS && phone_number) {
                userMFA.phone_number = phone_number;
            }

            if (mfa_method === UserMFAVO.MFA_METHOD_AUTHENTICATOR) {
                // Générer un secret TOTP simple (sans dépendance externe)
                userMFA.totp_secret = this.generateTOTPSecret();
                userMFA.backup_codes = JSON.stringify(this.generateBackupCodes());
            }

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(userMFA);

            ConsoleHandler.log('MFA configurée pour l\'utilisateur: ' + user_id + ', méthode: ' + mfa_method);
            return true;

        } catch (error) {
            ConsoleHandler.error('Erreur lors de la configuration MFA: ' + error);
            return false;
        }
    }

    /**
     * Active la MFA pour un utilisateur après vérification
     */
    public async activateMFA(user_id: number, verification_code: string): Promise<boolean> {
        try {
            const userMFAs = await query(UserMFAVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserMFAVO>().user_id, user_id)
                .filter_is_false(field_names<UserMFAVO>().is_active)
                .exec_as_server()
                .select_vos<UserMFAVO>();

            if (!userMFAs || userMFAs.length === 0) {
                return false;
            }

            const userMFA = userMFAs[0];

            // Vérifier le code selon la méthode
            let verified = false;
            if (userMFA.mfa_method === UserMFAVO.MFA_METHOD_AUTHENTICATOR) {
                verified = await this.verifyTOTPCode(user_id, verification_code);
            } else {
                verified = await this.verifyMFACode(user_id, verification_code, userMFA.mfa_method);
            }

            if (verified) {
                userMFA.is_active = true;
                userMFA.last_used_date = Date.now();
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(userMFA);

                // Si c'était une configuration MFA forcée, désactiver le flag
                await this.completeForcedMFAConfig(user_id);

                ConsoleHandler.log('MFA activée pour l\'utilisateur: ' + user_id);
                return true;
            }

            return false;

        } catch (error) {
            ConsoleHandler.error('Erreur lors de l\'activation MFA: ' + error);
            return false;
        }
    }

    /**
     * Termine la configuration MFA forcée en désactivant le flag force_mfa_config
     */
    public async completeForcedMFAConfig(user_id: number): Promise<void> {
        try {
            const users = await query(UserVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserVO>().id, user_id)
                .exec_as_server()
                .select_vos<UserVO>();

            if (users && users.length > 0) {
                const user = users[0];
                if (user.force_mfa_config) {
                    user.force_mfa_config = false;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(user);
                    ConsoleHandler.log('Configuration MFA forcée terminée pour l\'utilisateur: ' + user_id);
                }
            }
        } catch (error) {
            ConsoleHandler.error('Erreur lors de la finalisation de la configuration MFA forcée: ' + error);
        }
    }

    /**
     * Vérifie si un utilisateur a la MFA activée
     */
    public async isMFAEnabled(user_id: number): Promise<boolean> {
        try {
            const userMFAs = await query(UserMFAVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserMFAVO>().user_id, user_id)
                .filter_is_true(field_names<UserMFAVO>().is_active)
                .exec_as_server()
                .select_vos<UserMFAVO>();

            return !!(userMFAs && userMFAs.length > 0);

        } catch (error) {
            ConsoleHandler.error('Erreur lors de la vérification MFA: ' + error);
            return false;
        }
    }

    /**
     * Obtient la configuration MFA d'un utilisateur
     */
    public async getUserMFAConfig(user_id: number): Promise<UserMFAVO | null> {
        try {
            ConsoleHandler.log('getUserMFAConfig: Recherche de la config MFA pour l\'utilisateur: ' + user_id);

            // Debug: Vérifier l'état de l'utilisateur
            const users = await query(UserVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserVO>().id, user_id)
                .exec_as_server()
                .select_vos<UserVO>();

            const user = users && users.length > 0 ? users[0] : null;

            ConsoleHandler.log('getUserMFAConfig: Utilisateur trouvé: ' + (user ? 'OUI (id=' + user.id + ', name=' + user.name + ')' : 'NON'));

            const userMFAs = await query(UserMFAVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserMFAVO>().user_id, user_id)
                .exec_as_server()
                .select_vos<UserMFAVO>();

            ConsoleHandler.log('getUserMFAConfig: Nombre de configurations trouvées: ' + (userMFAs ? userMFAs.length : 0));

            if (userMFAs && userMFAs.length > 0) {
                const config = userMFAs[0];
                ConsoleHandler.log('getUserMFAConfig: Configuration trouvée: ' + JSON.stringify({
                    id: config.id,
                    user_id: config.user_id,
                    is_active: config.is_active,
                    mfa_method: config.mfa_method,
                    has_totp_secret: !!config.totp_secret,
                    phone_number: config.phone_number
                }));
                return config;
            } else {
                ConsoleHandler.warn('getUserMFAConfig: Aucune configuration MFA trouvée pour l\'utilisateur: ' + user_id);
                return null;
            }

        } catch (error) {
            ConsoleHandler.error('Erreur lors de la récupération de la config MFA: ' + error);
            return null;
        }
    }

    /**
     * Récupère la session MFA en cours pour un utilisateur
     */
    public async getMFASession(user_id: number): Promise<MFASessionVO | null> {
        try {
            const mfaSessions = await query(MFASessionVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<MFASessionVO>().user_id, user_id)
                .filter_is_false(field_names<MFASessionVO>().is_verified)
                .set_sort(new SortByVO(MFASessionVO.API_TYPE_ID, field_names<MFASessionVO>().created_date, false))
                .exec_as_server()
                .select_vos<MFASessionVO>();

            // Vérifier côté code si la session n'est pas expirée
            const now = Date.now() / 1000;
            const validSessions = mfaSessions?.filter(session => session.expiry_date > now);

            return (validSessions && validSessions.length > 0) ? validSessions[0] : null;

        } catch (error) {
            ConsoleHandler.error('Erreur lors de la récupération de la session MFA: ' + error);
            return null;
        }
    }
    /**
     * Invalide/supprime toute la configuration MFA existante d'un utilisateur
     * Utilisé notamment quand on force une reconfiguration MFA (force_mfa_config = true)
     */
    public async invalidateUserMFAConfig(user_id: number): Promise<void> {
        try {
            ConsoleHandler.log('invalidateUserMFAConfig: Invalidation de la config MFA pour utilisateur: ' + user_id);

            // Récupérer toutes les configurations MFA de l'utilisateur
            const userMFAs = await query(UserMFAVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserMFAVO>().user_id, user_id)
                .exec_as_server()
                .select_vos<UserMFAVO>();

            if (userMFAs && userMFAs.length > 0) {
                ConsoleHandler.log('invalidateUserMFAConfig: ' + userMFAs.length + ' configuration(s) MFA trouvée(s) à supprimer');

                // Supprimer toutes les configurations MFA
                await ModuleDAOServer.getInstance().deleteVOs_as_server(userMFAs);

                ConsoleHandler.log('invalidateUserMFAConfig: Toutes les configurations MFA supprimées pour utilisateur: ' + user_id);
            } else {
                ConsoleHandler.log('invalidateUserMFAConfig: Aucune configuration MFA trouvée pour utilisateur: ' + user_id);
            }

            // Nettoyer aussi toutes les sessions MFA en cours pour cet utilisateur
            const mfaSessions = await query(MFASessionVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<MFASessionVO>().user_id, user_id)
                .exec_as_server()
                .select_vos<MFASessionVO>();

            if (mfaSessions && mfaSessions.length > 0) {
                ConsoleHandler.log('invalidateUserMFAConfig: ' + mfaSessions.length + ' session(s) MFA en cours trouvée(s) à supprimer');
                await ModuleDAOServer.getInstance().deleteVOs_as_server(mfaSessions);
                ConsoleHandler.log('invalidateUserMFAConfig: Sessions MFA nettoyées pour utilisateur: ' + user_id);
            }

        } catch (error) {
            ConsoleHandler.error('Erreur lors de l\'invalidation de la config MFA pour utilisateur ' + user_id + ': ' + error);
            throw error;
        }
    }
    /**
     * Vérifie un code TOTP
     */
    private async verifyTOTPCode(user_id: number, provided_code: string): Promise<boolean> {
        try {
            const userMFAs = await query(UserMFAVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserMFAVO>().user_id, user_id)
                .exec_as_server()
                .select_vos<UserMFAVO>();

            if (!userMFAs || userMFAs.length === 0 || !userMFAs[0].totp_secret) {
                return false;
            }

            const userMFA = userMFAs[0];

            // Vérifier si c'est un code de sauvegarde
            if (userMFA.backup_codes) {
                let backupCodes: string[] = JSON.parse(userMFA.backup_codes);
                if (backupCodes.includes(provided_code)) {
                    // Retirer le code de sauvegarde utilisé
                    backupCodes = backupCodes.filter(code => code !== provided_code);
                    userMFA.backup_codes = JSON.stringify(backupCodes);
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(userMFA);
                    ConsoleHandler.log('Code de sauvegarde TOTP utilisé pour l\'utilisateur: ' + user_id);
                    return true;
                }
            }

            // Vérification TOTP réelle
            const isValid = this.verifyTOTPWithSecret(userMFA.totp_secret, provided_code);

            if (isValid) {
                ConsoleHandler.log('Code TOTP vérifié avec succès pour l\'utilisateur: ' + user_id);
                // Mettre à jour la dernière utilisation
                userMFA.last_used_date = Date.now();
                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(userMFA);
                return true;
            }

            ConsoleHandler.warn('Code TOTP invalide pour l\'utilisateur: ' + user_id);
            return false;

        } catch (error) {
            ConsoleHandler.error('Erreur lors de la vérification TOTP: ' + error);
            return false;
        }
    }

    /**
     * Vérifie un code TOTP avec le secret donné
     */
    private verifyTOTPWithSecret(secret: string, provided_code: string): boolean {
        try {
            const currentTime = Math.floor(Date.now() / 1000);
            const timeWindow = 30; // 30 secondes par fenêtre TOTP
            const tolerance = 1; // Tolérance de ±1 fenêtre (±30 secondes)

            // Vérifier le code pour la fenêtre actuelle et les fenêtres adjacentes
            for (let i = -tolerance; i <= tolerance; i++) {
                const timeCounter = Math.floor(currentTime / timeWindow) + i;
                const expectedCode = this.generateTOTPCode(secret, timeCounter);

                if (expectedCode === provided_code) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            ConsoleHandler.error('Erreur lors de la vérification TOTP avec secret: ' + error);
            return false;
        }
    }

    /**
     * Génère un code TOTP pour un compteur de temps donné
     */
    private generateTOTPCode(secret: string, timeCounter: number): string {
        try {
            // Convertir le secret Base32 en buffer
            const secretBuffer = this.base32ToBuffer(secret);

            // Convertir le compteur de temps en buffer de 8 bytes (big-endian)
            const counterBuffer = Buffer.alloc(8);
            counterBuffer.writeBigUInt64BE(BigInt(timeCounter), 0);

            // Générer HMAC-SHA1
            const hmac = crypto.createHmac('sha1', secretBuffer);
            hmac.update(counterBuffer);
            const hash = hmac.digest();

            // Appliquer l'algorithme HOTP (RFC 4226)
            const offset = hash[hash.length - 1] & 0xf;
            const code = (
                ((hash[offset] & 0x7f) << 24) |
                ((hash[offset + 1] & 0xff) << 16) |
                ((hash[offset + 2] & 0xff) << 8) |
                (hash[offset + 3] & 0xff)
            ) % 1000000;

            // Retourner le code avec padding de zéros
            return code.toString().padStart(6, '0');
        } catch (error) {
            ConsoleHandler.error('Erreur lors de la génération du code TOTP: ' + error);
            return '';
        }
    }

    /**
     * Convertit une chaîne Base32 en buffer
     */
    private base32ToBuffer(base32: string): Buffer {
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let output = Buffer.alloc(0);

        for (let i = 0; i < base32.length; i++) {
            const char = base32.charAt(i).toUpperCase();
            const charIndex = base32Chars.indexOf(char);

            if (charIndex === -1) continue; // Ignorer les caractères invalides

            value = (value << 5) | charIndex;
            bits += 5;

            if (bits >= 8) {
                const byte = (value >>> (bits - 8)) & 255;
                output = Buffer.concat([output, Buffer.from([byte])]);
                bits -= 8;
            }
        }

        return output;
    }

    /**
     * Génère un secret TOTP en Base32 (format standard pour TOTP)
     */
    private generateTOTPSecret(): string {
        // Générer 20 bytes aléatoires pour un secret de 160 bits (recommandé RFC 6238)
        const buffer = crypto.randomBytes(20);

        // Convertir en Base32 (alphabet standard: A-Z, 2-7)
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let base32 = '';

        for (let i = 0; i < buffer.length; i += 5) {
            // Traiter 5 bytes (40 bits) à la fois pour générer 8 caractères Base32
            const chunk = buffer.subarray(i, i + 5);
            let bits = 0n;

            // Construire un nombre de 40 bits
            for (let j = 0; j < chunk.length; j++) {
                bits = (bits << 8n) | BigInt(chunk[j]);
            }

            // Générer 8 caractères Base32 (ou moins si fin du buffer)
            const numChars = Math.min(8, Math.ceil(chunk.length * 8 / 5));
            for (let j = numChars - 1; j >= 0; j--) {
                base32 = base32Chars[Number(bits & 31n)] + base32;
                bits >>= 5n;
            }
        }

        return base32;
    }

    /**
     * Génère des codes de sauvegarde
     */
    private generateBackupCodes(): string[] {
        const codes: string[] = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }

    /**
     * Envoie le code MFA à l'utilisateur selon la méthode configurée
     */
    private async sendMFACodeToUser(user_id: number, challenge_code: string, mfa_method: string, userMFA: UserMFAVO): Promise<void> {
        try {
            // Récupérer l'utilisateur pour avoir ses informations (email, téléphone, langue)
            const users = await query(UserVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<UserVO>().id, user_id)
                .exec_as_server()
                .select_vos<UserVO>();

            if (!users || users.length === 0) {
                throw new Error('Utilisateur non trouvé');
            }

            const user = users[0];

            if (mfa_method === UserMFAVO.MFA_METHOD_EMAIL) {
                await this.sendMFAEmailCode(user, challenge_code);
            } else if (mfa_method === UserMFAVO.MFA_METHOD_SMS) {
                await this.sendMFASMSCode(user, challenge_code, userMFA.phone_number);
            }

        } catch (error) {
            ConsoleHandler.error('Erreur lors de l\'envoi du code MFA: ' + error);
            throw error;
        }
    }

    /**
     * Envoie le code MFA par email
     */
    private async sendMFAEmailCode(user: UserVO, challenge_code: string): Promise<void> {
        try {
            ConsoleHandler.log('Début envoi email MFA pour utilisateur: ' + user.id + ' (' + user.email + ')');

            // Vérifier si ModuleMailerServer est disponible
            const mailerInstance = ModuleMailerServer.getInstance();
            if (!mailerInstance) {
                throw new Error('ModuleMailerServer non disponible');
            }

            ConsoleHandler.log('ModuleMailerServer disponible, tentative d\'envoi...');
            const SEND_MFA_CODE_SEND_IN_BLUE_TEMPLATE_ID_s: string = await ParamsServerController.getParamValueAsString(ModuleAccessPolicy.PARAM_NAME_MFA_CODE_SEND_IN_BLUE_TEMPLATE_ID);
            const SEND_MFA_CODE_SEND_IN_BLUE_TEMPLATE_ID: number = SEND_MFA_CODE_SEND_IN_BLUE_TEMPLATE_ID_s ? parseInt(SEND_MFA_CODE_SEND_IN_BLUE_TEMPLATE_ID_s) : null;

            // Send mail
            if (SEND_MFA_CODE_SEND_IN_BLUE_TEMPLATE_ID) {

                // Using SendInBlue
                await SendInBlueMailServerController.getInstance().sendWithTemplate(
                    ModuleAccessPolicy.MAILCATEGORY_ModuleAccessPolicy_MFA_CODE_SEND,
                    SendInBlueMailVO.createNew(user.name, user.email),
                    SEND_MFA_CODE_SEND_IN_BLUE_TEMPLATE_ID,
                    ['sendMFAEmailCode'],
                    {
                        EMAIL: user.email,
                        USER_NAME: user.name,
                        MFA_CODE: challenge_code,
                    });
            } else {

                // Récupérer les traductions pour le sujet et le corps de l'email
                let subject = 'Code de vérification MFA';
                let bodyTemplate = 'Votre code de vérification MFA est: {CODE}';

                try {
                    const subjectTranslation: TranslationVO = await query(TranslationVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, MFAServerController.CODE_TEXT_MFA_EMAIL_SUBJECT, TranslatableTextVO.API_TYPE_ID)
                        .filter_by_id(user.lang_id, LangVO.API_TYPE_ID)
                        .select_vo<TranslationVO>();

                    const bodyTranslation: TranslationVO = await query(TranslationVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, MFAServerController.CODE_TEXT_MFA_EMAIL_BODY, TranslatableTextVO.API_TYPE_ID)
                        .filter_by_id(user.lang_id, LangVO.API_TYPE_ID)
                        .select_vo<TranslationVO>();

                    if (subjectTranslation?.translated) {
                        subject = subjectTranslation.translated;
                    }
                    if (bodyTranslation?.translated) {
                        bodyTemplate = bodyTranslation.translated;
                    }
                } catch (translationError) {
                    ConsoleHandler.warn('Erreur lors de la récupération des traductions, utilisation des textes par défaut: ' + translationError);
                }

                // Remplacer les variables dans le corps du message
                const finalBody = bodyTemplate.replace('{CODE}', challenge_code)
                    .replace('{USER_NAME}', user.name || user.email);

                const mailData = {
                    to: user.email,
                    subject: subject,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">Authentification à deux facteurs</h2>
                            <p>Bonjour ${user.name || user.email},</p>
                            <p>${finalBody}</p>
                            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
                                <h3 style="color: #007bff; font-size: 24px; letter-spacing: 4px; margin: 0;">${challenge_code}</h3>
                            </div>
                            <p style="color: #666; font-size: 12px;">Ce code expire dans 5 minutes pour des raisons de sécurité.</p>
                            <p style="color: #666; font-size: 12px;">Si vous n'avez pas demandé ce code, ignorez ce message.</p>
                        </div>
                    `,
                    text: `Votre code de vérification MFA est: ${challenge_code}. Ce code expire dans 5 minutes.`
                };

                ConsoleHandler.log('Données de l\'email préparées, envoi en cours...');
                await mailerInstance.sendMail(mailData);
                ConsoleHandler.log('Code MFA envoyé par email avec succès à l\'utilisateur: ' + user.id);
            }
        } catch (error) {
            ConsoleHandler.error('Erreur lors de l\'envoi de l\'email MFA: ' + error);
            ConsoleHandler.error('Stack trace: ' + (error as Error).stack);
            throw error;
        }
    }

    /**
     * Envoie le code MFA par SMS
     */
    private async sendMFASMSCode(user: UserVO, challenge_code: string, phone_number: string): Promise<void> {
        try {
            ConsoleHandler.log('Début envoi SMS MFA pour utilisateur: ' + user.id + ' vers ' + phone_number);

            // Vérifier si les SMS sont activés
            const smsActivated = await ParamsServerController.getParamValueAsBoolean(ModuleSendInBlue.PARAM_NAME_SMS_ACTIVATION);
            ConsoleHandler.log('État activation SMS: ' + smsActivated);

            if (!smsActivated) {
                ConsoleHandler.warn('SMS non activé dans les paramètres, impossible d\'envoyer le code MFA par SMS');
                throw new Error('Service SMS non activé');
            }

            if (!phone_number) {
                ConsoleHandler.error('Numéro de téléphone manquant pour l\'utilisateur: ' + user.id);
                throw new Error('Numéro de téléphone non configuré pour l\'utilisateur');
            }

            // Nettoyer le numéro de téléphone
            const cleanPhone = phone_number.replace(/\s/g, '');
            ConsoleHandler.log('Numéro de téléphone nettoyé: ' + cleanPhone);

            // Récupérer la langue de l'utilisateur
            const lang = await query(LangVO.API_TYPE_ID).filter_by_id(user.lang_id).select_vo<LangVO>();
            ConsoleHandler.log('Langue utilisateur: ' + (lang?.code_phone || 'non définie'));

            // Récupérer la traduction pour le SMS
            let smsText = `Votre code MFA: ${challenge_code}`;
            try {
                const smsTranslation: TranslationVO = await query(TranslationVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, MFAServerController.CODE_TEXT_MFA_SMS, TranslatableTextVO.API_TYPE_ID)
                    .filter_by_id(user.lang_id, LangVO.API_TYPE_ID)
                    .select_vo<TranslationVO>();

                if (smsTranslation?.translated) {
                    smsText = smsTranslation.translated;
                }
            } catch (translationError) {
                ConsoleHandler.warn('Erreur lors de la récupération de la traduction SMS, utilisation du texte par défaut: ' + translationError);
            }

            const finalSmsText = smsText.replace('{CODE}', challenge_code);
            ConsoleHandler.log('Texte SMS préparé, envoi en cours...');

            // Vérifier que SendInBlueSmsServerController est disponible
            const smsController = SendInBlueSmsServerController.getInstance();
            if (!smsController) {
                throw new Error('SendInBlueSmsServerController non disponible');
            }

            await smsController.send(
                SendInBlueSmsFormatVO.createNew(cleanPhone, lang?.code_phone),
                finalSmsText,
                MFAServerController.MAILCATEGORY_MFA
            );

            ConsoleHandler.log('Code MFA envoyé par SMS avec succès à l\'utilisateur: ' + user.id);

        } catch (error) {
            ConsoleHandler.error('Erreur lors de l\'envoi du SMS MFA: ' + error);
            ConsoleHandler.error('Stack trace: ' + (error as Error).stack);
            throw error;
        }
    }

}
