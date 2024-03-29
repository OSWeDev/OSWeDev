import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ModuleTranslation from '../../../../shared/modules/Translation/ModuleTranslation';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import VueAppController from '../../../VueAppController';
import VueComponentBase from '../VueComponentBase';
import './LangSelectorComponent.scss';

@Component({
    template: require('./LangSelectorComponent.pug'),
    components: {}
})
export default class LangSelectorComponent extends VueComponentBase {

    private langs_by_ids: { [id: number]: LangVO } = {};
    private hide: boolean = true;
    private tmp_user_lang: LangVO = null;

    get langs(): LangVO[] {
        return Object.values(this.langs_by_ids);
    }

    get user_lang_id(): number {
        if ((!VueAppController.getInstance().data_user) || (!VueAppController.getInstance().data_user.lang_id)) {
            return null;
        }
        return VueAppController.getInstance().data_user.lang_id;
    }

    public async mounted() {

        // Si on a pas de langue actuellement sur l'utilisateur, on ne continue pas il faut d'abord résoudre le problème en admin : snotify ?
        if (!this.user_lang_id) {
            return;
        }

        let langs_: LangVO[] = await query(LangVO.API_TYPE_ID).select_vos<LangVO>();

        // Si on a qu'une langue, on ne choisit pas
        if ((!langs_) || (langs_.length <= 1)) {
            return;
        }

        let self = this;
        let promises = [];
        for (let i in langs_) {
            let lang: LangVO = langs_[i];

            promises.push((async () => {
                if (ModuleAccessPolicy.getInstance().testAccess(ModuleTranslation.getInstance().get_LANG_SELECTOR_PER_LANG_ACCESS_name(lang.id))) {
                    self.langs_by_ids[lang.id] = lang;
                }
            })());
        }

        await all_promises(promises);

        // Si la langue a été forcée à une langue à laquelle on a pas accès, on affiche pas le composant
        if (!self.langs_by_ids[this.user_lang_id]) {
            return;
        }

        this.tmp_user_lang = self.langs_by_ids[this.user_lang_id];
        this.hide = false;
    }

    @Watch('tmp_user_lang')
    private async on_change_tmp_user_lang() {

        if (!this.tmp_user_lang) {
            return;
        }

        if (this.tmp_user_lang.id == this.user_lang_id) {
            return;
        }

        this.snotify.info(this.label('lang_selector.encours'));
        await ModuleAccessPolicy.getInstance().change_lang(this.tmp_user_lang.id);

        location.reload();
    }

    private langLabel(lang: LangVO): string {
        if (!lang) {
            return '';
        }

        return lang.code_lang;
    }
}