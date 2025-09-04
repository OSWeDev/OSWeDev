import { Component, Prop, Watch } from "vue-property-decorator";
import VueComponentBase from '../../VueComponentBase';
import './AntiSpamWaitComponent.scss';

/**
 * Composant pour afficher les informations d'attente anti-spam
 * Affiche un compteur en temps réel et des messages utilisateur-friendly
 */
@Component({
    template: require('./AntiSpamWaitComponent.pug')
})
export default class AntiSpamWaitComponent extends VueComponentBase {

    @Prop({ default: 0 })
    private delay_seconds: number;

    @Prop({ default: '' })
    private message: string;

    @Prop({ default: '' })
    private blocked_type: string;

    @Prop({ default: 0 })
    private current_attempts: number;

    @Prop({ default: 0 })
    private remaining_attempts: number;

    @Prop({ default: false })
    private show_progress: boolean;

    private countdown_seconds: number = 0;
    private countdown_interval: number = null;
    private get countdown_display(): string {
        if (this.countdown_seconds <= 0) {
            return "0";
        }

        const minutes = Math.floor(this.countdown_seconds / 60);
        const seconds = this.countdown_seconds % 60;

        if (minutes > 0) {
            return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
        }
        return `${seconds}s`;
    }

    private get progress_percentage(): number {
        if (!this.show_progress || this.delay_seconds <= 0) {
            return 0;
        }

        const elapsed = this.delay_seconds - this.countdown_seconds;
        return Math.min(100, (elapsed / this.delay_seconds) * 100);
    }

    private get attempts_info(): string {
        // Afficher les informations même si c'est le premier essai
        if (this.remaining_attempts >= 0) {
            // Message sécurisé qui ne révèle pas l'existence des utilisateurs
            if (this.current_attempts > 0) {
                if (this.remaining_attempts > 0) {
                    return `${this.current_attempts} tentative${this.current_attempts > 1 ? 's' : ''} utilisée${this.current_attempts > 1 ? 's' : ''}, ${this.remaining_attempts} restante${this.remaining_attempts > 1 ? 's' : ''} avant que le compte soit bloqué, s'il existe`;
                } else {
                    if(this.current_attempts == this.remaining_attempts+1) {
                        return `${this.current_attempts} tentative${this.current_attempts > 1 ? 's' : ''} utilisée${this.current_attempts > 1 ? 's' : ''}, le compte sera bloqué s'il existe`;
                    }
                    return '';
                }
            } else {
                if (this.remaining_attempts > 0) {
                    return `${this.remaining_attempts} tentative${this.remaining_attempts > 1 ? 's' : ''} restante${this.remaining_attempts > 1 ? 's' : ''} avant que le compte soit bloqué, s'il existe`;
                } else {
                    return `Le compte sera bloqué s'il existe`;
                }
            }
        }

        return '';
    }

    private get error_message(): string {
        if (!this.message) {
            return '';
        }

        // Si on a un délai d'attente, ne pas afficher les informations de temps dans le message d'erreur
        // car elles sont déjà affichées dans le compteur
        if (this.delay_seconds > 0) {
            // Extraire le message principal sans les informations de temps
            let clean_message = this.message;

            // Supprimer les références au temps (patterns courants)
            clean_message = clean_message.replace(/attendre \d+\s*(seconde|minute|heure)s?[^.]*\./gi, '');
            clean_message = clean_message.replace(/veuillez attendre[^.]*\./gi, '');
            clean_message = clean_message.replace(/\d+\s*(seconde|minute|heure)s?\s*(avant|pour)/gi, '');
            clean_message = clean_message.trim();

            // Si après nettoyage le message est vide ou trop court, utiliser un message générique
            if (!clean_message || clean_message.length < 10) {
                return 'Trop de tentatives de connexion.';
            }

            return clean_message;
        }

        return this.message;
    }

    private get blocked_type_display(): string {
        // Utiliser directement du texte français sans dépendre des labels
        // Plus de référence à l'IP - seulement email/user
        switch (this.blocked_type) {
            case 'email':
                return 'Email/Login bloqué';
            case 'user':
                return 'Compte utilisateur bloqué';
            default:
                return 'Accès temporairement bloqué';
        }
    }

    private get is_countdown_finished(): boolean {
        return this.countdown_seconds <= 0;
    }

    private get is_warning_phase(): boolean {
        return this.countdown_seconds <= 10 && this.countdown_seconds > 0;
    }

    @Watch('delay_seconds')
    private onDelayChange() {
        this.startCountdown();
    }

    public mounted() {
        this.startCountdown();
    }

    public beforeDestroy() {
        this.stopCountdown();
    }

    private startCountdown() {
        this.stopCountdown();
        this.countdown_seconds = this.delay_seconds;

        if (this.countdown_seconds > 0) {
            this.countdown_interval = setInterval(() => {
                this.countdown_seconds--;

                if (this.countdown_seconds <= 0) {
                    this.stopCountdown();
                    this.$emit('countdown-finished');
                }
            }, 1000) as unknown as number;
        }
    }

    private stopCountdown() {
        if (this.countdown_interval) {
            clearInterval(this.countdown_interval);
            this.countdown_interval = null;
        }
    }

    private get_wait_label(): string {
        return 'Temps restant';
    }

    private get_retry_label(): string {
        return 'Vous pouvez maintenant réessayer';
    }
}
