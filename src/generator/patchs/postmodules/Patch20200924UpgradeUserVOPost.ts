/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20200924UpgradeUserVOPost implements IGeneratorWorker {

    public static getInstance(): Patch20200924UpgradeUserVOPost {
        if (!Patch20200924UpgradeUserVOPost.instance) {
            Patch20200924UpgradeUserVOPost.instance = new Patch20200924UpgradeUserVOPost();
        }
        return Patch20200924UpgradeUserVOPost.instance;
    }

    private static instance: Patch20200924UpgradeUserVOPost = null;

    get uid(): string {
        return 'Patch20200924UpgradeUserVOPost';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        /**
         * Changement trad par défaut sur user pour l'expiration du mdp
         */
        await this.update_trad('fields.labels.ref.user.invalidated.___LABEL___', 'Mot de passe expiré');

        /**
         * Changement trad par défaut sur user pour la récupération du mdp
         */
        await this.update_trad('login.recover.answer.___LABEL___', 'Vous devriez recevoir un mail d\'ici quelques minutes pour réinitialiser votre compte. Si vous n\'avez reçu aucun mail, vérifiez vos spams, et que le mail saisi est bien celui du compte et réessayez.');

        await this.update_trad('login.recover.submit.___LABEL___', 'Envoyer le mail');
    }

    private async update_trad(code: string, text: string) {
        let trad: TranslatableTextVO = await ModuleTranslation.getInstance().getTranslatableText(code);
        if (!trad) {
            DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
                'fr-fr': text
            }, code));
        } else {
            let fr = await ModuleTranslation.getInstance().getLang('fr-fr');
            if (fr) {
                let trads_fr: TranslationVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds<TranslationVO>(TranslationVO.API_TYPE_ID, 'lang_id', [fr.id], 'text_id', [trad.id]);
                if ((!trads_fr) || (!trads_fr.length)) {
                    DefaultTranslationManager.getInstance().registerDefaultTranslation(new DefaultTranslation({
                        'fr-fr': text
                    }, code));
                } else {
                    trads_fr[0].translated = text;
                    await ModuleDAO.getInstance().insertOrUpdateVO(trads_fr[0]);
                }
            }
        }
    }
}