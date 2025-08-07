import { Component, Prop, Watch } from 'vue-property-decorator';
import VueComponentBase from '../../VueComponentBase';
import './PasswordValidationComponent.scss';

interface PasswordCriterion {
    key: string;
    label: string;
    regex?: RegExp;
    validator?: (password: string) => boolean;
    isValid: boolean;
}

@Component({
    template: require('./PasswordValidationComponent.pug')
})
export default class PasswordValidationComponent extends VueComponentBase {

    @Prop({ required: true })
    private password: string;

    @Prop({ default: false })
    private show_immediately: boolean;

    private criteria: PasswordCriterion[] = [
        {
            key: 'length',
            label: 'Au moins 12 caractères',
            validator: (pwd) => pwd && pwd.length >= 12,
            isValid: false
        },
        {
            key: 'lowercase',
            label: 'Au moins une minuscule',
            regex: /[a-z]/,
            isValid: false
        },
        {
            key: 'uppercase',
            label: 'Au moins une majuscule',
            regex: /[A-Z]/,
            isValid: false
        },
        {
            key: 'number',
            label: 'Au moins un chiffre',
            regex: /[0-9]/,
            isValid: false
        },
        {
            key: 'special',
            label: 'Au moins un caractère spécial',
            regex: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
            isValid: false
        },
        {
            key: 'not_weak',
            label: 'Pas de motifs faibles (séquences, répétitions)',
            validator: (pwd) => !this.isWeakPassword(pwd),
            isValid: false
        }
    ];

    private show_validation: boolean = false;

    get overall_validity(): boolean {
        return this.criteria.every(criterion => criterion.isValid);
    }

    get strength_score(): number {
        const validCount = this.criteria.filter(criterion => criterion.isValid).length;
        return Math.round((validCount / this.criteria.length) * 100);
    }

    get strength_class(): string {
        const score = this.strength_score;
        if (score < 40) return 'strength-weak';
        if (score < 70) return 'strength-medium';
        if (score < 100) return 'strength-good';
        return 'strength-strong';
    }

    get strength_text(): string {
        const score = this.strength_score;
        if (score < 40) return 'Faible';
        if (score < 70) return 'Moyen';
        if (score < 100) return 'Bon';
        return 'Excellent';
    }

    @Watch('password', { immediate: true })
    private onPasswordChange() {
        if (this.show_immediately || (this.password && this.password.length > 0)) {
            this.show_validation = true;
        }

        this.updateCriteriaStatus();
    }

    private updateCriteriaStatus() {
        if (!this.password) {
            this.criteria.forEach(criterion => criterion.isValid = false);
            return;
        }

        this.criteria.forEach(criterion => {
            if (criterion.regex) {
                criterion.isValid = criterion.regex.test(this.password);
            } else if (criterion.validator) {
                criterion.isValid = criterion.validator(this.password);
            }
        });
    }

    private isWeakPassword(password: string): boolean {
        if (!password) return true;

        const commonPatterns = [
            /(.)\1{3,}/, // 4 caractères identiques consécutifs
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(password|123456|qwerty|azerty|admin|user)/i, // Mots communs
            /^\d+$/, // Que des chiffres
            /^[a-zA-Z]+$/, // Que des lettres
            /(012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/, // Séquences numériques
            /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i // Séquences alphabétiques
        ];

        return commonPatterns.some(pattern => pattern.test(password));
    }
}
