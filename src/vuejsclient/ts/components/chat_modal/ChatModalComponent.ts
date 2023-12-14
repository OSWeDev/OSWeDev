import Component from 'vue-class-component';
import InlineTranslatableText from '../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../VueComponentBase';
import './ChatModalComponent.scss';

@Component({
    template: require('./ChatModalComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class ChatModalComponent extends VueComponentBase {

    private is_minimized = true;
    private messages = [];
    private user_input = '';

    private toggle_minimize() {
        this.is_minimized = !this.is_minimized;
    }

    private async sendMessage() {
        // // Ajouter le message de l'utilisateur
        // messages.value.push({ id: Date.now(), text: userInput.value, isUser: true });
        // userInput.value = '';

        // // Ici vous ajouteriez la logique pour envoyer le message à l'IA et recevoir la réponse
    }
}