import Component from 'vue-class-component';
import ModuleClient from '../../../../../shared/modules/Commerce/Client/ModuleClient';
import InformationsVO from '../../../../../shared/modules/Commerce/Client/vos/InformationsVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import VueAppController from '../../../../VueAppController';
import VueComponentBase from '../../VueComponentBase';

@Component({
    template: require('./ClientComponent.pug'),
    components: {}
})
export default class ClientComponent extends VueComponentBase {
    public client: InformationsVO = null;
    public isEditable: boolean = false;

    private async created(): Promise<void> {
        if (VueAppController.getInstance().data_user) {
            this.startLoading();

            // On charge les infos client
            this.client = await ModuleClient.getInstance().getInformationsClientUser(VueAppController.getInstance().data_user.id);

            this.stopLoading();
        }
    }

    private switchIsEditable(): void {
        this.isEditable = !this.isEditable;
    }

    private async save(): Promise<void> {
        // Sauvegarde de l'utilisateur en base
        await ModuleDAO.getInstance().insertOrUpdateVO(this.client);

        // On affiche le message de sauvegarde
        this.snotify.info(this.label('client.user.mon-compte.enregistrement.ok'));

        // On passe le tout en non éditable
        this.switchIsEditable();
    }
}