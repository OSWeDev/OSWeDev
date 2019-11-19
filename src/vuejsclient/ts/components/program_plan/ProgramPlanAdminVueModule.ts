import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import DateHandler from '../../../../shared/tools/DateHandler';
import moment = require('moment');
import CRUD from '../crud/vos/CRUD';
import ComputedDatatableField from '../datatable/vos/ComputedDatatableField';
import ManyToOneReferenceDatatableField from '../datatable/vos/ManyToOneReferenceDatatableField';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import SimpleDatatableField from '../datatable/vos/SimpleDatatableField';
import IPlanRDV from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import ModuleFormatDatesNombres from '../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import TimeHandler from '../../../../shared/tools/TimeHandler';
import IPlanFacilitator from '../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';

export default class ProgramPlanAdminVueModule extends VueModuleBase {

    public static DEFAULT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "ProgramPlanAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-calendar",
        []
    );

    public static getInstance(post_initialization_hook: () => Promise<void> = null): ProgramPlanAdminVueModule {
        if (!ProgramPlanAdminVueModule.instance) {
            ProgramPlanAdminVueModule.instance = new ProgramPlanAdminVueModule(post_initialization_hook);
        }

        return ProgramPlanAdminVueModule.instance;
    }

    private static instance: ProgramPlanAdminVueModule = null;

    private post_initialization_hook: () => Promise<void> = null;

    private constructor(post_initialization_hook: () => Promise<void> = null) {

        super(ModuleProgramPlanBase.getInstance().name);
        this.post_initialization_hook = post_initialization_hook;
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_BO_ACCESS)) {
            return;
        }

        let menuBranch: MenuBranch = ProgramPlanAdminVueModule.DEFAULT_MENU_BRANCH;

        if (ModuleProgramPlanBase.getInstance().showProgramAdministration) {

            if (!!ModuleProgramPlanBase.getInstance().program_category_type_id) {
                CRUDComponentManager.getInstance().registerCRUD(
                    ModuleProgramPlanBase.getInstance().program_category_type_id,
                    null,
                    new MenuPointer(
                        new MenuLeaf(ModuleProgramPlanBase.getInstance().program_category_type_id, MenuElementBase.PRIORITY_ULTRAHIGH, "fa-list"),
                        menuBranch),
                    this.routes);
            }

            if (!!ModuleProgramPlanBase.getInstance().program_type_id) {
                CRUDComponentManager.getInstance().registerCRUD(
                    ModuleProgramPlanBase.getInstance().program_type_id,
                    null,
                    new MenuPointer(
                        new MenuLeaf(ModuleProgramPlanBase.getInstance().program_type_id, MenuElementBase.PRIORITY_ULTRAHIGH + 1, "fa-list"),
                        menuBranch),
                    this.routes);
            }
        }

        if (!!ModuleProgramPlanBase.getInstance().enseigne_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().enseigne_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().enseigne_type_id, MenuElementBase.PRIORITY_HIGH - 4, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().target_group_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().target_group_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().target_group_type_id, MenuElementBase.PRIORITY_HIGH - 3, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().target_zone_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().target_zone_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().target_zone_type_id, MenuElementBase.PRIORITY_HIGH - 2, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }


        if (!!ModuleProgramPlanBase.getInstance().target_region_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().target_region_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().target_region_type_id, MenuElementBase.PRIORITY_HIGH - 1, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().target_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().target_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().target_type_id, MenuElementBase.PRIORITY_HIGH, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().contact_type_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().contact_type_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().contact_type_type_id, MenuElementBase.PRIORITY_HIGH + 1, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().contact_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().contact_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().contact_type_id, MenuElementBase.PRIORITY_HIGH + 2, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().partner_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().partner_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().partner_type_id, MenuElementBase.PRIORITY_MEDIUM - 1, "fa-sitemap"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().manager_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().manager_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().manager_type_id, MenuElementBase.PRIORITY_MEDIUM, "fa-sitemap"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().facilitator_region_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().facilitator_region_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().facilitator_region_type_id, MenuElementBase.PRIORITY_LOW - 1, "fa-user-circle"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().facilitator_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().facilitator_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().facilitator_type_id, MenuElementBase.PRIORITY_LOW, "fa-user-circle"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().task_type_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().task_type_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().task_type_type_id, MenuElementBase.PRIORITY_LOW + 2, "fa-tasks"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().task_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().task_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().task_type_id, MenuElementBase.PRIORITY_LOW + 3, "fa-tasks"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().rdv_type_id) {
            let rdv_crud = CRUD.getNewCRUD(ModuleProgramPlanBase.getInstance().rdv_type_id);

            // On ajoute l'enseigne
            if (!!ModuleProgramPlanBase.getInstance().enseigne_type_id) {
                rdv_crud.readDatatable.pushField(
                    new ManyToOneReferenceDatatableField(
                        'target_id',
                        VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().target_type_id],
                        [
                            new ManyToOneReferenceDatatableField(
                                'enseigne_id',
                                VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().enseigne_type_id],
                                [
                                    new SimpleDatatableField('name')
                                ])
                        ]
                    ).setUID_for_readDuplicateOnly('rdv_enseigne_id'));
            }

            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().rdv_type_id,
                rdv_crud,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().rdv_type_id, MenuElementBase.PRIORITY_ULTRALOW, "fa-calendar-o"),
                    menuBranch),
                this.routes);
            //     ,
            // {
            //     FILTER__start_time: moment().year().toString(),
            //     }
        }

        if (!!ModuleProgramPlanBase.getInstance().rdv_prep_type_id) {
            let prep_crud = CRUD.getNewCRUD(ModuleProgramPlanBase.getInstance().rdv_prep_type_id);

            // On ajoute le RDV avec la date - cible - consultant
            prep_crud.readDatatable.pushField(
                new ManyToOneReferenceDatatableField(
                    'rdv_id',
                    VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().rdv_type_id],
                    [
                        new ComputedDatatableField(
                            'rdv_date',
                            (rdv: IPlanRDV) => ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(rdv.start_time) + ' ' + TimeHandler.getInstance().formatMomentMinutePrecisionTime(rdv.start_time))
                    ]
                ).setUID_for_readDuplicateOnly('rdv_prep_date'));

            // On ajoute le RDV avec la cible - consultant
            prep_crud.readDatatable.pushField(
                new ManyToOneReferenceDatatableField(
                    'rdv_id',
                    VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().rdv_type_id],
                    [
                        new ManyToOneReferenceDatatableField(
                            'target_id',
                            VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().target_type_id],
                            [
                                new SimpleDatatableField('name')
                            ])
                    ]
                ).setUID_for_readDuplicateOnly('rdv_prep_target'));

            // On ajoute le RDV avec la date - cible - consultant
            prep_crud.readDatatable.pushField(
                new ManyToOneReferenceDatatableField(
                    'rdv_id',
                    VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().rdv_type_id],
                    [
                        new ManyToOneReferenceDatatableField(
                            'facilitator_id',
                            VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().facilitator_type_id],
                            [
                                new ComputedDatatableField(
                                    'facilitator_name',
                                    (facilitator: IPlanFacilitator) => facilitator.firstname + ' ' + facilitator.lastname)
                            ]
                        )
                    ]
                ).setUID_for_readDuplicateOnly('rdv_prep_facilitator'));

            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().rdv_prep_type_id,
                prep_crud,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().rdv_prep_type_id, MenuElementBase.PRIORITY_ULTRALOW + 1, "fa-calendar-check-o"),
                    menuBranch),
                this.routes);
        }

        if (!!ModuleProgramPlanBase.getInstance().rdv_cr_type_id) {
            let cr_crud = CRUD.getNewCRUD(ModuleProgramPlanBase.getInstance().rdv_cr_type_id);

            // On ajoute le RDV avec la date - cible - consultant
            cr_crud.readDatatable.pushField(
                new ManyToOneReferenceDatatableField(
                    'rdv_id',
                    VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().rdv_type_id],
                    [
                        new ComputedDatatableField(
                            'rdv_date',
                            (rdv: IPlanRDV) => ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(rdv.start_time) + ' ' + TimeHandler.getInstance().formatMomentMinutePrecisionTime(rdv.start_time))
                    ]
                ).setUID_for_readDuplicateOnly('rdv_cr_date'));

            // On ajoute le RDV avec la cible - consultant
            cr_crud.readDatatable.pushField(
                new ManyToOneReferenceDatatableField(
                    'rdv_id',
                    VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().rdv_type_id],
                    [
                        new ManyToOneReferenceDatatableField(
                            'target_id',
                            VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().target_type_id],
                            [
                                new SimpleDatatableField('name')
                            ])
                    ]
                ).setUID_for_readDuplicateOnly('rdv_cr_target'));

            // On ajoute le RDV avec la date - cible - consultant
            cr_crud.readDatatable.pushField(
                new ManyToOneReferenceDatatableField(
                    'rdv_id',
                    VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().rdv_type_id],
                    [
                        new ManyToOneReferenceDatatableField(
                            'facilitator_id',
                            VOsTypesManager.getInstance().moduleTables_by_voType[ModuleProgramPlanBase.getInstance().facilitator_type_id],
                            [
                                new ComputedDatatableField(
                                    'facilitator_name',
                                    (facilitator: IPlanFacilitator) => facilitator.firstname + ' ' + facilitator.lastname)
                            ]
                        )
                    ]
                ).setUID_for_readDuplicateOnly('rdv_cr_facilitator'));

            CRUDComponentManager.getInstance().registerCRUD(
                ModuleProgramPlanBase.getInstance().rdv_cr_type_id,
                cr_crud,
                new MenuPointer(
                    new MenuLeaf(ModuleProgramPlanBase.getInstance().rdv_cr_type_id, MenuElementBase.PRIORITY_ULTRALOW + 1, "fa-calendar-check-o"),
                    menuBranch),
                this.routes);
        }

        if (!!this.post_initialization_hook) {
            await this.post_initialization_hook();
        }
    }
}