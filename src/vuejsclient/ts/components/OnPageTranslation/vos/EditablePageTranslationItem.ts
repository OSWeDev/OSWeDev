import TranslationVO from '../../../../../shared/modules/Translation/vos/TranslationVO';
import OnPageTranslationItem from './OnPageTranslationItem';

export default class EditablePageTranslationItem extends OnPageTranslationItem {

    public editable_translation: string = null;

    public constructor(
        public translation_code: string,
        public translation: TranslationVO = null
    ) {
        super(translation_code, !translation);
        if (translation) {
            this.editable_translation = translation.translated;
        }
    }
}