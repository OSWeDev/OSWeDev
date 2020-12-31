import * as moment from 'moment';
import { Component, Prop, Watch } from "vue-property-decorator";
import AnimationController from "../../../../../../shared/modules/Animation/AnimationController";
import AnimationReponseVO from "../../../../../../shared/modules/Animation/fields/reponse/vos/AnimationReponseVO";
import AnimationQRVO from "../../../../../../shared/modules/Animation/vos/AnimationQRVO";
import AnimationUserQRVO from "../../../../../../shared/modules/Animation/vos/AnimationUserQRVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import VueComponentBase from '../../../VueComponentBase';

@Component({
    template: require("./qr.pug"),
    components: {}
})
export default class VueAnimationQrComponent extends VueComponentBase {

    @Prop()
    private user_id: number;

    @Prop()
    private qr: AnimationQRVO;

    @Prop()
    private uqr: AnimationUserQRVO;

    private saving: boolean = false;
    private editable_uqr: AnimationUserQRVO = null;
    private is_validated: boolean = false;
    private selected_reponse: { [reponse_id: number]: boolean } = {};
    private classe_reponses: { [reponse_id: number]: string } = {};

    @Watch('qr', { deep: true })
    @Watch('uqr', { deep: true })
    private reload_uqr() {
        this.saving = false;
        this.editable_uqr = this.uqr;
        this.is_validated = false;
        this.selected_reponse = {};
        this.classe_reponses = {};

        if (!this.editable_uqr) {
            this.editable_uqr = new AnimationUserQRVO();
        }

        if (this.editable_uqr && this.editable_uqr.reponses) {
            for (let i in this.editable_uqr.reponses) {
                this.selected_reponse[this.editable_uqr.reponses[i]] = true;
            }
        }

        if (this.editable_uqr.id) {
            this.show_validation();
        }
    }

    private async mounted() {
        this.reload_uqr();
    }

    private async validation() {
        if (this.is_disabled) {
            return;
        }

        this.saving = true;
        this.editable_uqr.qr_id = this.qr.id;
        this.editable_uqr.user_id = this.user_id;
        this.editable_uqr.date = moment().utc(true);
        this.editable_uqr.reponses = [];

        for (let reponse_id in this.selected_reponse) {
            if (this.selected_reponse[reponse_id]) {
                this.editable_uqr.reponses.push(parseInt(reponse_id));
            }
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.editable_uqr);

        this.$emit('reload');

        this.show_validation();

        this.saving = false;
    }

    private show_validation() {
        this.is_validated = true;

        for (let i in this.reponses) {
            let reponse: AnimationReponseVO = this.reponses[i];

            if (!reponse.valid) {
                this.classe_reponses[reponse.id] = 'opacity';
            }
        }
    }

    private next() {
        this.$emit('next');
    }

    get reponses(): AnimationReponseVO[] {
        return AnimationController.getInstance().getReponses(this.qr);
    }

    get ordered_reponses(): AnimationReponseVO[] {
        return this.reponses ? this.reponses.sort((a, b) => a.weight - b.weight) : null;
    }

    get is_disabled(): boolean {
        for (let reponse_id in this.selected_reponse) {
            if (this.selected_reponse[reponse_id]) {
                return false;
            }
        }

        return true;
    }
}