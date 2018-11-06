import ModuleTranslation from '../../../../../shared/modules/Translation/ModuleTranslation';
import LangVO from '../../../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../../shared/modules/Translation/vos/TranslationVO';
import CRUDComponentManager from '../../../../ts/components/crud/CRUDComponentManager';
import CRUD from '../../../../ts/components/crud/vos/CRUD';
import Datatable from '../../../../ts/components/datatable/vos/Datatable';
import ManyToOneReferenceDatatableField from '../../../../ts/components/datatable/vos/ManyToOneReferenceDatatableField';
import SimpleDatatableField from '../../../../ts/components/datatable/vos/SimpleDatatableField';
import MenuBranch from '../../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../../ts/modules/VueModuleBase';
import VueAppController from '../../../../VueAppController';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';

export default class TranslationAdminVueModule extends VueModuleBase {


    public static getInstance(): TranslationAdminVueModule {
        if (!TranslationAdminVueModule.instance) {
            TranslationAdminVueModule.instance = new TranslationAdminVueModule();
        }

        return TranslationAdminVueModule.instance;
    }

    private static instance: TranslationAdminVueModule = null;

    private constructor() {

        super(ModuleTranslation.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleTranslation.POLICY_BO_TRANSLATIONS_ACCESS)) {
            return;
        }

        let translationMenuBranch: MenuBranch = new MenuBranch("TranslationAdminVueModule", MenuElementBase.PRIORITY_MEDIUM - 1, "fa-language", []);

        CRUDComponentManager.getInstance().registerCRUD(
            TranslationVO.API_TYPE_ID,
            this.getTranslationCRUD(),
            new MenuPointer(
                new MenuLeaf("TranslationVOTranslationAdminVueModule", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-language"),
                translationMenuBranch),
            this.routes);

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleTranslation.POLICY_BO_OTHERS_ACCESS)) {
            return;
        }

        CRUDComponentManager.getInstance().registerCRUD(
            LangVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("LangVOTranslationAdminVueModule", MenuElementBase.PRIORITY_ULTRALOW, "fa-language"),
                translationMenuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            TranslatableTextVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("TranslatableTextVOTranslationAdminVueModule", MenuElementBase.PRIORITY_MEDIUM, "fa-language"),
                translationMenuBranch),
            this.routes);
    }

    protected getTranslationCRUD(): CRUD<TranslationVO> {
        let crud: CRUD<TranslationVO> = new CRUD<TranslationVO>(new Datatable<TranslationVO>(TranslationVO.API_TYPE_ID));

        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField(
            "lang_id",
            ModuleTranslation.getInstance().datatable_lang,
            [
                new SimpleDatatableField("code_lang")
            ]
        ));
        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField(
            "text_id",
            ModuleTranslation.getInstance().datatable_translatabletext,
            [
                new SimpleDatatableField("code_text")
            ]
        ));
        crud.readDatatable.pushField(new SimpleDatatableField("translated"));

        return crud;
    }
}