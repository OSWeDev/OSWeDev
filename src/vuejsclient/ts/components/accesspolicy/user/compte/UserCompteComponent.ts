import Component from 'vue-class-component';
import VueComponentBase from '../../../VueComponentBase';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';

@Component({
    template: require('./UserCompteComponent.pug'),
    components: {}
})
export default class UserCompteComponent extends VueComponentBase {
    public user: UserVO = ModuleAccessPolicy.getInstance().connected_user;
    public isEditable: boolean = false;

    private async created(): Promise<void> { }

    private switchIsEditable(): void {
        this.isEditable = !this.isEditable;
    }

    private async save(): Promise<void> {
        if (!this.user._type) {
            this.user._type = new UserVO()._type;
        }

        // Sauvegarde de l'utilisateur en base
        await ModuleDAO.getInstance().insertOrUpdateVO(this.user);

        // On affiche le message de sauvegarde
        this.snotify.info(this.label('client.user.mon-compte.enregistrement.ok'));

        // On passe le tout en non éditable
        this.switchIsEditable();
    }
}