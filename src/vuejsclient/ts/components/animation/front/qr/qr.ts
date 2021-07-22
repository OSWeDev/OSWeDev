import * as moment from 'moment';
import { Component, Prop, Watch } from "vue-property-decorator";
import AnimationController from "../../../../../../shared/modules/Animation/AnimationController";
import AnimationReponseVO from "../../../../../../shared/modules/Animation/fields/reponse/vos/AnimationReponseVO";
import AnimationQRVO from "../../../../../../shared/modules/Animation/vos/AnimationQRVO";
import AnimationUserQRVO from "../../../../../../shared/modules/Animation/vos/AnimationUserQRVO";
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import SimpleDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../../../VueComponentBase';

@Component({
    template: require("./qr.pug"),
    components: {}
})
export default class VueAnimationQrComponent extends VueComponentBase {

    @Prop()
    private logged_user_id: number;

    @Prop()
    private qr: AnimationQRVO;

    @Prop()
    private uqr: AnimationUserQRVO;

    @Prop()
    private question_file: FileVO;

    @Prop()
    private reponse_file: FileVO;

    @Prop()
    private inline_input_mode: boolean;

    private saving: boolean = false;
    private editable_uqr: AnimationUserQRVO = null;
    /** pour savoir si une question  a déjà été faite */
    private is_validated: boolean = false;
    private is_reponse_valid: boolean = false;
    private selected_reponse: { [reponse_id: number]: boolean } = {};
    private classe_reponses: { [reponse_id: number]: string } = {};

    private selected_file: FileVO = null;

    @Watch('qr', { deep: true })
    @Watch('uqr', { deep: true })
    private reload_uqr() {
        this.saving = false;
        this.editable_uqr = this.uqr;
        this.is_validated = false;
        this.is_reponse_valid = false;
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

    private created() {
        this.$router.beforeEach((route, redirect, next) => {
            this.showModal(false, null);
            next();
        });
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
        this.editable_uqr.user_id = this.logged_user_id;
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

        this.is_reponse_valid = AnimationController.getInstance().isUserQROk(this.qr, this.editable_uqr);
    }

    private next() {
        this.$emit('next');
    }

    private showModal(show: boolean, file: FileVO) {
        if (show) {
            $(this.$refs.imagezoommodal).modal('show');
        } else {
            $(this.$refs.imagezoommodal).modal('hide');
        }

        this.selected_file = file;
    }

    private get_is_image(file: FileVO): boolean {
        return (file) && (file.path) && (file.path.match(/\.(jpeg|jpg|gif|png)$/) != null);
    }

    private get_is_video(file: FileVO): boolean {
        return (file) && (file.path) && (file.path.match(/\.(mp4)$/) != null);
    }

    private async on_edit_reponse_name(vo: AnimationReponseVO, field: SimpleDatatableField<any, any>, data: any): Promise<void> {
        vo.name = data;

        this.qr.reponses = JSON.stringify(this.reponses);

        await ModuleDAO.getInstance().insertOrUpdateVO(this.qr);

        this.snotify.success(this.label('field.auto_update_field_value.succes'));
    }

    get style_image(): any {
        return {
            maxHeight: (window.innerWidth - 50) + 'px',
        };
    }

    get style_iframe(): any {
        return {
            height: ($('.qr_file').width() / 2) + 'px',
        };
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

    get name_editable_field() {
        return new SimpleDatatableField('name').setModuleTable(VOsTypesManager.getInstance().moduleTables_by_voType[AnimationQRVO.API_TYPE_ID]);
    }

    get description_editable_field() {
        return new SimpleDatatableField('description').setModuleTable(VOsTypesManager.getInstance().moduleTables_by_voType[AnimationQRVO.API_TYPE_ID]);
    }

    get explicatif_editable_field() {
        return new SimpleDatatableField('explicatif').setModuleTable(VOsTypesManager.getInstance().moduleTables_by_voType[AnimationQRVO.API_TYPE_ID]);
    }
}