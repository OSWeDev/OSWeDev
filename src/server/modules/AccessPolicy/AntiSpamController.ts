import * as fs from 'fs';
import * as path from 'path';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ConfigurationService from '../../env/ConfigurationService';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import TimeSegment from '../../../shared/modules/DataRender/vos/TimeSegment';
import AntiSpamResponseVO from '../../../shared/modules/AccessPolicy/vos/AntiSpamResponseVO';
import StackContext from '../../StackContext';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import TeamsAPIServerController from '../TeamsAPI/TeamsAPIServerController';
import ModuleMailerServer from '../Mailer/ModuleMailerServer';
import ParamsServerController from '../Params/ParamsServerController';
import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import SendInBlueMailVO from '../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import SendInBlueMailServerController from '../SendInBlue/SendInBlueMailServerController';

export interface AntiSpamAttempt {
    timestamp: number; // Unix timestamp
    count: number;
    last_delay_applied?: number;
}

export interface AntiSpamStats {
    active_attempts_by_ip: number;
    active_attempts_by_email: number;
    active_attempts_by_user: number;
    blocked_ips: number;
    blocked_emails: number;
    blocked_users: number;
}

/**
 * Contrôleur Anti-Spam avec système de blocage crescendo
 *
 * - Délais progressifs : 1s, 2s, 4s, 8s, 16s, 32s, 64s, 128s, 256s, 512s
 * - Au bout de 10 tentatives : blocage permanent + log IP
 * - Nettoyage automatique des tentatives expirées
 */
export default class AntiSpamController {
    private static instance: AntiSpamController = null;

    // Configuration
    private readonly MAX_ATTEMPTS_BEFORE_BLOCK = 4;
    private readonly BASE_DELAY_SECONDS = 1;
    private readonly BASE_BLOCK_DURATION_SECONDS = 3600; // 1 heure
    private readonly CLEANUP_INTERVAL_MS = 300000; // 5 minutes
    private readonly LOG_FILE = 'anti_spam_blocked.log';

    // Stockage en mémoire des tentatives et blocages
    private attempts_by_ip: { [ip: string]: AntiSpamAttempt } = {};
    private attempts_by_email: { [email: string]: AntiSpamAttempt } = {};
    private attempts_by_user: { [user_id: string]: AntiSpamAttempt } = {};
    private blocked_ips: { [ip: string]: number } = {}; // Unix timestamps
    private blocked_emails: { [email: string]: number } = {}; // Unix timestamps
    private blocked_users: { [user_id: string]: number } = {}; // Unix timestamps

    // Timer de nettoyage
    private cleanup_timer: NodeJS.Timeout;

    private constructor() {
        this.startCleanupTimer();
    }

    public static getInstance(): AntiSpamController {
        if (!AntiSpamController.instance) {
            AntiSpamController.instance = new AntiSpamController();
        }
        return AntiSpamController.instance;
    }

    /**
     * Récupère l'IP du client depuis le contexte ou à défaut une IP par défaut
     */
    public static getClientIP(): string {
        try {
            // Tenter de récupérer l'IP depuis le contexte si disponible
            const client_ip = StackContext.get('CLIENT_IP');
            if (client_ip) {
                return client_ip;
            }
        } catch (error) {
            // Si le contexte n'est pas disponible, utiliser une IP par défaut
        }

        // IP par défaut pour les cas où le contexte n'est pas disponible
        return 'unknown';
    }

    /**
     * Vérifier si une action est autorisée (principal point d'entrée)
     */
    public async checkRateLimit(identifier: string, type: 'ip' | 'email' | 'user', action: string): Promise<AntiSpamResponseVO> {
        const now = Dates.now();

        // Vérifier si l'identifiant est actuellement bloqué
        const blocked_until = this.getBlockedUntil(identifier, type);
        if (blocked_until && Dates.isBefore(now, blocked_until, TimeSegment.TYPE_SECOND)) {
            const remaining_seconds = Dates.diff(blocked_until, now, TimeSegment.TYPE_SECOND);
            return AntiSpamResponseVO.createBlocked(
                `Trop de tentatives. Veuillez attendre ${remaining_seconds} secondes avant de réessayer.`,
                type
            );
        }

        // Récupérer ou initialiser les tentatives
        const attempts = this.getAttempts(identifier, type);

        // Calculer le délai si nécessaire (plus de blocage définitif)
        if (attempts.count > 0) {
            const delay_seconds = this.calculateDelay(attempts.count);
            const time_since_last = Dates.diff(now, attempts.timestamp, TimeSegment.TYPE_SECOND);

            if (time_since_last < delay_seconds) {
                const remaining_delay = delay_seconds - time_since_last;
                const remaining_attempts = Math.max(0, this.MAX_ATTEMPTS_BEFORE_BLOCK - attempts.count);

                return AntiSpamResponseVO.createDelayed(
                    remaining_delay,
                    `Veuillez attendre ${remaining_delay} secondes avant de réessayer.`,
                    type,
                    attempts.count,
                    remaining_attempts
                );
            }
        }

        // Autoriser l'action MAIS renvoyer les informations de tentatives pour l'affichage
        const remaining_attempts = Math.max(0, this.MAX_ATTEMPTS_BEFORE_BLOCK - attempts.count);
        const response = AntiSpamResponseVO.createAllowed();

        // Ajouter les informations de tentatives même quand l'action est autorisée
        response.current_attempts = attempts.count;
        response.remaining_attempts = remaining_attempts;

        return response;
    }

    /**
     * Vérifier les limites pour plusieurs identifiants (IP, email, user)
     * Retourne false si au moins un des identifiants est bloqué
     */
    public async checkMultipleRateLimits(ip: string, email: string, user_id?: string, action: string = 'login'): Promise<AntiSpamResponseVO> {
        // Vérifier email seulement (plus d'IP)
        const email_check = await this.checkRateLimit(email, 'email', action);
        if (!email_check.allowed) {
            return email_check;
        }

        // Vérifier user_id si fourni
        if (user_id) {
            const user_check = await this.checkRateLimit(user_id.toString(), 'user', action);
            if (!user_check.allowed) {
                return user_check;
            }
        }

        // Récupérer les informations de tentatives (SANS IP)
        const email_attempts = this.getAttempts(email, 'email');
        // Garder user_attempts pour la sécurité mais afficher email pour l'UX
        if (user_id) {
            this.getAttempts(user_id.toString(), 'user'); // Pour la sécurité
        }

        // Retourner directement les tentatives email pour cohérence UX
        const response = AntiSpamResponseVO.createAllowed();
        response.current_attempts = email_attempts.count; // Afficher email pour cohérence UX
        response.remaining_attempts = Math.max(0, this.MAX_ATTEMPTS_BEFORE_BLOCK - email_attempts.count);

        return response;
    }

    /**
     * Récupérer les informations d'état anti-spam SANS faire de tentative
     * Utilisé pour afficher l'état au chargement de la page
     */
    public async getAntiSpamStatus(ip: string, email: string, user_id?: string): Promise<AntiSpamResponseVO> {
        const now = Dates.now();

        // Vérifier les blocages actifs (SANS IP)
        const email_blocked = this.getBlockedUntil(email, 'email');
        let user_blocked = null;
        if (user_id) {
            user_blocked = this.getBlockedUntil(user_id.toString(), 'user');
        }

        // Si email est bloqué, renvoyer le blocage
        if (email_blocked && Dates.isBefore(now, email_blocked, TimeSegment.TYPE_SECOND)) {
            const remaining_seconds = Dates.diff(email_blocked, now, TimeSegment.TYPE_SECOND);
            return AntiSpamResponseVO.createBlocked(
                `Email bloqué. Veuillez attendre ${remaining_seconds} secondes.`,
                'email'
            );
        }

        // Si utilisateur est bloqué, renvoyer le blocage
        if (user_blocked && Dates.isBefore(now, user_blocked, TimeSegment.TYPE_SECOND)) {
            const remaining_seconds = Dates.diff(user_blocked, now, TimeSegment.TYPE_SECOND);
            return AntiSpamResponseVO.createBlocked(
                `Compte bloqué. Veuillez attendre ${remaining_seconds} secondes.`,
                'user'
            );
        }

        // Récupérer les tentatives actuelles (SANS IP)
        const email_attempts = this.getAttempts(email, 'email');
        let user_attempts = { count: 0, timestamp: 0 };
        if (user_id) {
            user_attempts = this.getAttempts(user_id.toString(), 'user');
        }

        // Prendre le maximum entre email et user seulement
        const max_attempts = Math.max(email_attempts.count, user_attempts.count);

        // Vérifier si un délai est en cours
        let delay_message = '';

        if (max_attempts > 0) {
            let most_recent_attempts = email_attempts;

            if (user_attempts.count >= max_attempts && user_attempts.timestamp >= most_recent_attempts.timestamp) {
                most_recent_attempts = user_attempts;
            }

            // Calculer le délai basé sur les tentatives email/user (sans IP)
            const delay_seconds = this.calculateDelay(most_recent_attempts.count);
            const time_since_last = Dates.diff(now, most_recent_attempts.timestamp, TimeSegment.TYPE_SECOND);

            if (time_since_last < delay_seconds) {
                const active_delay = delay_seconds - time_since_last;
                delay_message = `Veuillez attendre ${active_delay} secondes avant de réessayer.`;

                return AntiSpamResponseVO.createDelayed(
                    active_delay,
                    delay_message,
                    'email', // Basé sur l'input (email/téléphone/login)
                    email_attempts.count, // Tentatives email
                    Math.max(0, this.MAX_ATTEMPTS_BEFORE_BLOCK - email_attempts.count) // Restantes email
                );
            }
        }

        // Tout est OK, renvoyer les infos de tentatives basées sur l'email
        const response = AntiSpamResponseVO.createAllowed();
        response.current_attempts = email_attempts.count;
        response.remaining_attempts = Math.max(0, this.MAX_ATTEMPTS_BEFORE_BLOCK - email_attempts.count);

        return response;
    }

    /**
     * Enregistrer une tentative pour les identifiants (SANS IP)
     */
    public async recordMultipleAttempts(ip: string, email: string, user_id: string | number | null, success: boolean): Promise<void> {
        // Ne plus enregistrer les tentatives par IP
        this.recordAttempt(email, 'email', success);

        if (user_id) {
            this.recordAttempt(user_id.toString(), 'user', success);
        }

        // SÉCURITÉ : Au 10ème échec, bloquer silencieusement l'utilisateur s'il existe
        // MAIS ne pas bloquer dans le système anti-spam pour ne pas révéler son existence
        if (!success) {
            const email_attempts = this.getAttempts(email, 'email');
            if (email_attempts.count >= this.MAX_ATTEMPTS_BEFORE_BLOCK) {
                // Bloquer silencieusement l'utilisateur sans révéler son existence
                // On continue avec les délais normaux du système anti-spam
                await this.silentlyBlockUserIfExists(email);
            }
        }
    }

    /**
     * Enregistrer une tentative (succès ou échec)
     */
    public recordAttempt(identifier: string, type: 'ip' | 'email' | 'user', success: boolean): void {
        if (success) {
            // En cas de succès, effacer les tentatives précédentes
            this.clearAttempts(identifier, type);
        } else {
            // En cas d'échec, incrémenter les tentatives
            this.incrementAttempts(identifier, type);
        }
    }

    /**
     * Débloquer manuellement une IP ou un compte (pour l'admin)
     */
    public unblockIdentifier(identifier: string, type: 'ip' | 'email' | 'user'): boolean {
        if (type === 'ip' && this.blocked_ips[identifier]) {
            delete this.blocked_ips[identifier];
            delete this.attempts_by_ip[identifier];
            ConsoleHandler.log(`[ANTI-SPAM] IP débloquée manuellement: ${identifier}`);
            return true;
        }

        if (type === 'email' && this.blocked_emails[identifier]) {
            delete this.blocked_emails[identifier];
            delete this.attempts_by_email[identifier];
            ConsoleHandler.log(`[ANTI-SPAM] Email débloqué manuellement: ${identifier}`);
            return true;
        }

        if (type === 'user' && this.blocked_users[identifier]) {
            delete this.blocked_users[identifier];
            delete this.attempts_by_user[identifier];
            ConsoleHandler.log(`[ANTI-SPAM] Utilisateur débloqué manuellement: ${identifier}`);
            return true;
        }

        return false;
    }

    /**
     * Obtenir des statistiques sur les tentatives de spam
     */
    public getStats(): AntiSpamStats {
        return {
            active_attempts_by_ip: Object.keys(this.attempts_by_ip).length,
            active_attempts_by_email: Object.keys(this.attempts_by_email).length,
            active_attempts_by_user: Object.keys(this.attempts_by_user).length,
            blocked_ips: Object.keys(this.blocked_ips).length,
            blocked_emails: Object.keys(this.blocked_emails).length,
            blocked_users: Object.keys(this.blocked_users).length
        };
    }

    /**
     * Arrêter le processus de nettoyage (pour les tests ou l'arrêt du serveur)
     */
    public stopCleanup(): void {
        if (this.cleanup_timer) {
            clearInterval(this.cleanup_timer);
        }
    }

    // === MÉTHODES PRIVÉES ===

    private getAttempts(identifier: string, type: 'ip' | 'email' | 'user'): AntiSpamAttempt {
        let records: { [key: string]: AntiSpamAttempt };

        if (type === 'ip') {
            records = this.attempts_by_ip;
        } else if (type === 'email') {
            records = this.attempts_by_email;
        } else { // type === 'user'
            records = this.attempts_by_user;
        }

        if (!records[identifier]) {
            records[identifier] = {
                timestamp: Dates.now(),
                count: 0
            };
        }

        return records[identifier];
    }

    private incrementAttempts(identifier: string, type: 'ip' | 'email' | 'user'): void {
        const attempts = this.getAttempts(identifier, type);
        attempts.count++;
        attempts.timestamp = Dates.now();

        ConsoleHandler.warn(`[ANTI-SPAM] Tentative ${attempts.count}/${this.MAX_ATTEMPTS_BEFORE_BLOCK} pour ${type}: ${identifier}`);
    }

    private clearAttempts(identifier: string, type: 'ip' | 'email' | 'user'): void {
        let records: { [key: string]: AntiSpamAttempt };

        if (type === 'ip') {
            records = this.attempts_by_ip;
        } else if (type === 'email') {
            records = this.attempts_by_email;
        } else { // type === 'user'
            records = this.attempts_by_user;
        }

        delete records[identifier];
    }

    private calculateDelay(attempt_count: number): number {
        // Délai exponentiel : 1s, 2s, 4s, 8s, 16s, ...
        return this.BASE_DELAY_SECONDS * Math.pow(2, attempt_count - 1);
    }

    private getBlockedUntil(identifier: string, type: 'ip' | 'email' | 'user'): number | null {
        let blocked_records: { [key: string]: number };

        if (type === 'ip') {
            blocked_records = this.blocked_ips;
        } else if (type === 'email') {
            blocked_records = this.blocked_emails;
        } else { // type === 'user'
            blocked_records = this.blocked_users;
        }

        return blocked_records[identifier] || null;
    }

    private async blockIdentifier(identifier: string, type: 'ip' | 'email' | 'user', action: string, attempts: number): Promise<void> {
        const blocked_until = Dates.add(Dates.now(), this.BASE_BLOCK_DURATION_SECONDS, TimeSegment.TYPE_SECOND);

        if (type === 'ip') {
            this.blocked_ips[identifier] = blocked_until;
        } else if (type === 'email') {
            this.blocked_emails[identifier] = blocked_until;
        } else { // type === 'user'
            this.blocked_users[identifier] = blocked_until;
        }

        // Log dans fichier
        await this.logBlockedAttempt(identifier, type, action, attempts, blocked_until);

        ConsoleHandler.error(`[ANTI-SPAM] ${type.toUpperCase()} BLOQUÉ(E): ${identifier} jusqu'à ${Dates.format(blocked_until, 'YYYY-MM-DD HH:mm:ss')}`);
    }

    private startCleanupTimer(): void {
        this.cleanup_timer = setInterval(() => {
            this.cleanupExpiredRecords();
        }, this.CLEANUP_INTERVAL_MS);
    }

    private cleanupExpiredRecords(): void {
        const now = Dates.now();
        const one_day_ago = Dates.add(now, -24, TimeSegment.TYPE_HOUR);

        // Nettoyer les tentatives anciennes (plus de 24h)
        this.cleanupOldAttempts(this.attempts_by_ip, one_day_ago);
        this.cleanupOldAttempts(this.attempts_by_email, one_day_ago);
        this.cleanupOldAttempts(this.attempts_by_user, one_day_ago);

        // Nettoyer les blocages expirés
        this.cleanupExpiredBlocks(this.blocked_ips, now);
        this.cleanupExpiredBlocks(this.blocked_emails, now);
        this.cleanupExpiredBlocks(this.blocked_users, now);
    }

    private cleanupOldAttempts(records: { [key: string]: AntiSpamAttempt }, cutoff_time: number): void {
        for (const identifier in records) {
            if (Dates.isBefore(records[identifier].timestamp, cutoff_time, TimeSegment.TYPE_SECOND)) {
                delete records[identifier];
            }
        }
    }

    private cleanupExpiredBlocks(records: { [key: string]: number }, now: number): void {
        for (const identifier in records) {
            if (Dates.isAfter(now, records[identifier], TimeSegment.TYPE_SECOND)) {
                delete records[identifier];
            }
        }
    }

    private async logBlockedAttempt(identifier: string, type: 'ip' | 'email' | 'user', action: string, attempts: number, blocked_until: number): Promise<void> {
        try {
            // Utiliser le répertoire courant/logs par défaut
            const logs_dir = path.join('./logs', 'security');

            // Créer le dossier de logs si inexistant
            if (!fs.existsSync(logs_dir)) {
                fs.mkdirSync(logs_dir, { recursive: true });
            }

            const log_file = path.join(logs_dir, this.LOG_FILE);
            const log_entry = {
                timestamp: Dates.format(Dates.now(), 'YYYY-MM-DD HH:mm:ss'),
                type: type,
                identifier: identifier,
                action: action,
                attempts: attempts,
                blocked_until: Dates.format(blocked_until, 'YYYY-MM-DD HH:mm:ss'),
                server_info: {
                    node_env: process.env.NODE_ENV,
                    app_title: ConfigurationService.node_configuration.app_title || 'unknown'
                }
            };

            const log_line = JSON.stringify(log_entry) + '\n';
            fs.appendFileSync(log_file, log_line);

            ConsoleHandler.error(`[ANTI-SPAM] Blocage enregistré dans ${log_file}: ${type} ${identifier}`);
        } catch (error) {
            ConsoleHandler.error(`[ANTI-SPAM] Erreur lors de l'écriture du log de blocage: ${error}`);
        }
    }

    /**
     * Bloque silencieusement un utilisateur s'il existe, sans révéler son existence
     */
    private async silentlyBlockUserIfExists(login_or_email: string): Promise<void> {
        try {
            // Recherche de l'utilisateur par login ou email sans révéler s'il existe
            const users = await query(UserVO.API_TYPE_ID)
                .filter_by_text_eq(
                    field_names<UserVO>().email,
                    login_or_email
                )
                .exec_as_server()
                .select_vos<UserVO>();
            if (users && users.length > 0) {
                const user = users[0];
                // Ne bloquer que si l'utilisateur n'est pas déjà bloqué
                if (!user.blocked) {
                    user.blocked = true;
                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(user);

                    ConsoleHandler.log(`[ANTI-SPAM] Utilisateur bloqué silencieusement après ${this.MAX_ATTEMPTS_BEFORE_BLOCK} tentatives`);

                    // Envoyer les notifications (Teams + Email)
                    await this.sendUserBlockedNotifications(user, login_or_email);
                }
            }

            // Si aucun utilisateur trouvé par email, tenter par login
            if (!users || users.length === 0) {
                const usersByLogin = await query(UserVO.API_TYPE_ID)
                    .filter_by_text_eq(
                        field_names<UserVO>().name,
                        login_or_email,
                    )
                    .exec_as_server()
                    .select_vos<UserVO>();

                if (usersByLogin && usersByLogin.length > 0) {
                    const user = usersByLogin[0];
                    // Ne bloquer que si l'utilisateur n'est pas déjà bloqué
                    if (!user.blocked) {
                        user.blocked = true;
                        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(user);

                        ConsoleHandler.log(`[ANTI-SPAM] Utilisateur bloqué silencieusement après ${this.MAX_ATTEMPTS_BEFORE_BLOCK} tentatives`);

                        // Envoyer les notifications (Teams + Email)
                        await this.sendUserBlockedNotifications(user, login_or_email);
                    }
                }
            }
        } catch (error) {
            // Ne jamais révéler d'informations sur l'existence ou non d'un utilisateur
            ConsoleHandler.error(`[ANTI-SPAM] Erreur lors du blocage silencieux: ${error}`);
        }
    }

    /**
     * Envoie les notifications de blocage d'utilisateur
     */
    private async sendUserBlockedNotifications(user: UserVO, login_or_email: string): Promise<void> {
        try {
            // 1) Message Teams dans le canal tech info
            await this.sendTeamsNotification(user, login_or_email);

            // 2) Email à l'utilisateur
            await this.sendUserBlockedEmail(user);
        } catch (error) {
            ConsoleHandler.error(`[ANTI-SPAM] Erreur lors de l'envoi des notifications: ${error}`);
        }
    }

    /**
     * Envoie un message Teams pour informer les admins du blocage
     */
    private async sendTeamsNotification(user: UserVO, login_or_email: string): Promise<void> {
        try {
            const now = Dates.now();
            const title = "🛡️ SÉCURITÉ - Compte utilisateur bloqué";
            const message = `<b>Utilisateur bloqué :</b> ${user.name || 'N/A'} (${user.email || 'N/A'})<br><br>

<b>Détails de l'incident :</b><br>
<ul>
<li><b>Email/Login utilisé :</b> ${login_or_email}</li>
<li><b>Date/Heure :</b> ${Dates.format(now, 'DD/MM/YYYY à HH:mm:ss')}</li>
<li><b>Cause :</b> Plus de ${this.MAX_ATTEMPTS_BEFORE_BLOCK} tentatives de connexion échouées</li>
<li><b>Serveur :</b> ${ConfigurationService.node_configuration.app_title || 'Non défini'}</li>
<li><b>Environnement :</b> ${process.env.NODE_ENV || 'Non défini'}</li>
</ul>

⚠️ <b>Action automatique :</b> Le compte utilisateur a été bloqué en base de données pour des raisons de sécurité.<br><br>

<b>Actions requises :</b><br>
<ul>
<li>Vérifier s'il s'agit d'une tentative d'intrusion</li>
<li>Contacter l'utilisateur pour confirmer l'activité</li>
<li>Débloquer le compte si l'utilisateur est légitime</li>
</ul>`;

            // Utiliser la méthode spécialisée pour les alertes de sécurité
            await TeamsAPIServerController.send_teams_warn(
                title,
                message,
            );
        } catch (error) {
            ConsoleHandler.error(`[ANTI-SPAM] Erreur lors de l'envoi du message Teams: ${error}`);
        }
    }

    /**
     * Envoie un email à l'utilisateur bloqué
     */
    private async sendUserBlockedEmail(user: UserVO): Promise<void> {
        try {
            if (!user.email) {
                ConsoleHandler.warn(`[ANTI-SPAM] Impossible d'envoyer un email, utilisateur sans email: ${user.name}`);
                return;
            }

            const ACCOUNT_BLOCKED_SEND_IN_BLUE_TEMPLATE_ID: number = await ParamsServerController.getParamValueAsInt(ModuleAccessPolicy.PARAM_NAME_ACCOUNT_BLOCKED_SEND_IN_BLUE_TEMPLATE_ID);

            // Send mail
            if (ACCOUNT_BLOCKED_SEND_IN_BLUE_TEMPLATE_ID) {

                // Using SendInBlue
                await SendInBlueMailServerController.getInstance().sendWithTemplate(
                    ModuleAccessPolicy.MAILCATEGORY_ModuleAccessPolicy_ACCOUNT_BLOCKED,
                    SendInBlueMailVO.createNew(user.name, user.email),
                    ACCOUNT_BLOCKED_SEND_IN_BLUE_TEMPLATE_ID,
                    ['sendAccountBlockedEmail']);
            }

            ConsoleHandler.log(`[ANTI-SPAM] Email de notification envoyé à : ${user.email}`);
        } catch (error) {
            ConsoleHandler.error(`[ANTI-SPAM] Erreur lors de l'envoi de l'email: ${error}`);
        }
    }
}
