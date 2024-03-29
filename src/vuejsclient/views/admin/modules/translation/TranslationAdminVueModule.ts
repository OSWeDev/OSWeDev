import CRUD from '../../../../../shared/modules/DAO/vos/CRUD';
import Datatable from '../../../../../shared/modules/DAO/vos/datatable/Datatable';
import ManyToOneReferenceDatatableFieldVO from '../../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableFieldVO';
import SimpleDatatableFieldVO from '../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import MenuElementVO from '../../../../../shared/modules/Menu/vos/MenuElementVO';
import ModuleTranslation from '../../../../../shared/modules/Translation/ModuleTranslation';
import LangVO from '../../../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../../../shared/modules/Translation/vos/TranslationVO';
import VOsTypesManager from '../../../../../shared/modules/VO/manager/VOsTypesManager';
import CRUDComponentManager from '../../../../ts/components/crud/CRUDComponentManager';
import MenuController from '../../../../ts/components/menu/MenuController';
import VueModuleBase from '../../../../ts/modules/VueModuleBase';
import VueAppController from '../../../../VueAppController';

export default class TranslationAdminVueModule extends VueModuleBase {


    // istanbul ignore next: nothing to test
    public static getInstance(): TranslationAdminVueModule {
        if (!TranslationAdminVueModule.instance) {
            TranslationAdminVueModule.instance = new TranslationAdminVueModule();
        }

        return TranslationAdminVueModule.instance;
    }

    private static instance: TranslationAdminVueModule = null;

    private constructor() {

        super(ModuleTranslation.getInstance().name);
        this.policies_needed = [
            ModuleTranslation.POLICY_BO_TRANSLATIONS_ACCESS,
            ModuleTranslation.POLICY_BO_OTHERS_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleTranslation.POLICY_BO_TRANSLATIONS_ACCESS]) {
            return;
        }

        let translationMenuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleTranslation.POLICY_BO_TRANSLATIONS_ACCESS,
                    VueAppController.getInstance().app_name,
                    "TranslationAdminVueModule",
                    "fa-language",
                    30 - 1,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            TranslationVO.API_TYPE_ID,
            this.getTranslationCRUD(),
            MenuElementVO.create_new(
                ModuleTranslation.POLICY_BO_TRANSLATIONS_ACCESS,
                VueAppController.getInstance().app_name,
                "TranslationVOTranslationAdminVueModule",
                "fa-a",
                10,
                null,
                null,
                translationMenuBranch.id
            ),
            this.routes);

        if (!this.policies_loaded[ModuleTranslation.POLICY_BO_OTHERS_ACCESS]) {
            return;
        }

        await CRUDComponentManager.getInstance().registerCRUD(
            LangVO.API_TYPE_ID,
            this.getLangCRUD(),
            MenuElementVO.create_new(
                ModuleTranslation.POLICY_BO_OTHERS_ACCESS,
                VueAppController.getInstance().app_name,
                "LangVOTranslationAdminVueModule",
                "fa-language",
                50,
                null,
                null,
                translationMenuBranch.id
            ),
            this.routes);

        await CRUDComponentManager.getInstance().registerCRUD(
            TranslatableTextVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleTranslation.POLICY_BO_OTHERS_ACCESS,
                VueAppController.getInstance().app_name,
                "TranslatableTextVOTranslationAdminVueModule",
                "fa-language",
                30,
                null,
                null,
                translationMenuBranch.id
            ),
            this.routes);
    }

    protected getTranslationCRUD(): CRUD<TranslationVO> {
        let crud: CRUD<TranslationVO> = new CRUD<TranslationVO>(new Datatable<TranslationVO>(TranslationVO.API_TYPE_ID));

        crud.readDatatable.pushField(ManyToOneReferenceDatatableFieldVO.createNew(
            "lang_id",
            VOsTypesManager.moduleTables_by_voType[LangVO.API_TYPE_ID],
            [
                SimpleDatatableFieldVO.createNew("code_lang")
            ]
        ));
        crud.readDatatable.pushField(ManyToOneReferenceDatatableFieldVO.createNew(
            "text_id",
            VOsTypesManager.moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID],
            [
                SimpleDatatableFieldVO.createNew("code_text")
            ]
        ));
        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("translated"));

        CRUD.addManyToManyFields(crud, VOsTypesManager.moduleTables_by_voType[TranslationVO.API_TYPE_ID]);
        CRUD.addOneToManyFields(crud, VOsTypesManager.moduleTables_by_voType[TranslationVO.API_TYPE_ID]);

        return crud;
    }

    protected getLangCRUD(): CRUD<LangVO> {
        let crud: CRUD<LangVO> = new CRUD<LangVO>(new Datatable<LangVO>(LangVO.API_TYPE_ID));

        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("code_lang"));
        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("code_flag"));
        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("code_phone"));

        return crud;
    }
}