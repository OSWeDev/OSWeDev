import { Component } from 'vue-property-decorator';
import VueComponentBase from '../../VueComponentBase';
import './PasswordHistoryInfoComponent.scss';

@Component({
    template: require('./PasswordHistoryInfoComponent.pug')
})
export default class PasswordHistoryInfoComponent extends VueComponentBase {

    private readonly history_count: number = 5; // Doit correspondre à PASSWORD_HISTORY_COUNT du serveur

    get history_message(): string {
        return `Votre nouveau mot de passe ne peut pas être identique aux ${this.history_count} derniers mots de passe utilisés.`;
    }
}
