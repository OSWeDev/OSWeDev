import CRUD from '../../../../shared/modules/DAO/vos/CRUD';
import ComputedDatatableField from '../../../../shared/modules/DAO/vos/datatable/ComputedDatatableField';
import ManyToOneReferenceDatatableField from '../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableField';
import SimpleDatatableField from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import Dates from '../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import Durations from '../../../../shared/modules/FormatDatesNombres/Dates/Durations';
import ModuleFormatDatesNombres from '../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import IPlanFacilitator from '../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanRDV from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import TimeHandler from '../../../../shared/tools/TimeHandler';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';

export default class ProgramPlanAdminVueModuleBase extends VueModuleBase {

    public showProgramAdministration: boolean = true;
    public menuBranch: MenuElementVO = null;

    private post_initialization_hook: () => Promise<void> = null;

    public constructor(name: string, post_initialization_hook: () => Promise<void> = null) {

        super(name);
        this.post_initialization_hook = post_initialization_hook;
        this.policies_needed = [
            this.programplan_shared_module.POLICY_BO_ACCESS
        ];
    }

    get programplan_shared_module(): ModuleProgramPlanBase {
        return this.shared_module as ModuleProgramPlanBase;
    }

    public async initializeAsync() {

        if (!this.policies_loaded[this.programplan_shared_module.POLICY_BO_ACCESS]) {
            return;
        }

        this.menuBranch =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.name + "_PPAdminVueModule",
                    "fa-calendar",
                    20,
                    null
                )
            );

        if (this.showProgramAdministration) {

            if (!!this.programplan_shared_module.program_category_type_id) {
                await CRUDComponentManager.getInstance().registerCRUD(
                    this.programplan_shared_module.program_category_type_id,
                    null,
                    MenuElementVO.create_new(
                        this.programplan_shared_module.POLICY_BO_ACCESS,
                        VueAppController.getInstance().app_name,
                        this.programplan_shared_module.program_category_type_id,
                        "fa-list",
                        10,
                        null,
                        null,
                        this.menuBranch.id
                    ),
                    this.routes);
            }

            if (!!this.programplan_shared_module.program_type_id) {
                await CRUDComponentManager.getInstance().registerCRUD(
                    this.programplan_shared_module.program_type_id,
                    null,
                    MenuElementVO.create_new(
                        this.programplan_shared_module.POLICY_BO_ACCESS,
                        VueAppController.getInstance().app_name,
                        this.programplan_shared_module.program_type_id,
                        "fa-list",
                        10 + 1,
                        null,
                        null,
                        this.menuBranch.id
                    ),
                    this.routes);
            }
        }

        if (!!this.programplan_shared_module.enseigne_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.enseigne_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.enseigne_type_id,
                    "fa-bullseye",
                    10 - 4,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.target_group_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.target_group_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.target_group_type_id,
                    "fa-bullseye",
                    10 - 3,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.target_zone_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.target_zone_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.target_zone_type_id,
                    "fa-bullseye",
                    10 - 2,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }


        if (!!this.programplan_shared_module.target_region_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.target_region_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.target_region_type_id,
                    "fa-bullseye",
                    20 - 1,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.target_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.target_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.target_type_id,
                    "fa-bullseye",
                    20,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.contact_type_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.contact_type_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.contact_type_type_id,
                    "fa-bullseye",
                    20 + 1,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.contact_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.contact_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.contact_type_id,
                    "fa-bullseye",
                    20 + 2,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.partner_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.partner_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.partner_type_id,
                    "fa-sitemap",
                    30 - 1,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.manager_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.manager_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.manager_type_id,
                    "fa-sitemap",
                    30,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.facilitator_region_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.facilitator_region_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.facilitator_region_type_id,
                    "fa-user-circle",
                    40 - 1,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.facilitator_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.facilitator_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.facilitator_type_id,
                    "fa-user-circle",
                    40,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.task_type_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.task_type_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.task_type_type_id,
                    "fa-tasks",
                    40 + 2,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.task_type_id) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.task_type_id,
                null,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.task_type_id,
                    "fa-tasks",
                    40 + 3,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.rdv_type_id) {
            let rdv_crud = CRUD.getNewCRUD(this.programplan_shared_module.rdv_type_id);

            // On ajoute l'enseigne
            if (!!this.programplan_shared_module.enseigne_type_id) {
                rdv_crud.readDatatable.pushField(
                    new ManyToOneReferenceDatatableField(
                        'target_id',
                        VOsTypesManager.getInstance().moduleTables_by_voType[this.programplan_shared_module.target_type_id],
                        [
                            new ManyToOneReferenceDatatableField(
                                'enseigne_id',
                                VOsTypesManager.getInstance().moduleTables_by_voType[this.programplan_shared_module.enseigne_type_id],
                                [
                                    new SimpleDatatableField('name')
                                ])
                        ]
                    ).setUID_for_readDuplicateOnly('rdv_enseigne_id'));
            }

            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.rdv_type_id,
                rdv_crud,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.rdv_type_id,
                    "fa-calendar-o",
                    50,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
            //     ,
            // {
            //     FILTER__start_time: moment().year().toString(),
            //     }
        }

        if (!!this.programplan_shared_module.rdv_prep_type_id) {
            let prep_crud = CRUD.getNewCRUD(this.programplan_shared_module.rdv_prep_type_id);

            // On ajoute le RDV avec la date - cible - consultant
            prep_crud.readDatatable.pushField(
                new ManyToOneReferenceDatatableField(
                    'rdv_id',
                    VOsTypesManager.getInstance().moduleTables_by_voType[this.programplan_shared_module.rdv_type_id],
                    [
                        new ComputedDatatableField(
                            'rdv_date',
                            (rdv: IPlanRDV) => Dates.format(rdv.start_time, ModuleFormatDatesNombres.FORMAT_YYYYMMDD + ' ' + TimeHandler.MINUTES_TIME_FOR_INDEX_FORMAT))
                    ]
                ).setUID_for_readDuplicateOnly('rdv_prep_date'));

            // On ajoute le RDV avec la cible - consultant
            prep_crud.readDatatable.pushField(
                new ManyToOneReferenceDatatableField(
                    'rdv_id',
                    VOsTypesManager.getInstance().moduleTables_by_voType[this.programplan_shared_module.rdv_type_id],
                    [
                        new ManyToOneReferenceDatatableField(
                            'target_id',
                            VOsTypesManager.getInstance().moduleTables_by_voType[this.programplan_shared_module.target_type_id],
                            [
                                new SimpleDatatableField('name')
                            ])
                    ]
                ).setUID_for_readDuplicateOnly('rdv_prep_target'));

            // On ajoute le RDV avec la date - cible - consultant
            prep_crud.readDatatable.pushField(
                new ManyToOneReferenceDatatableField(
                    'rdv_id',
                    VOsTypesManager.getInstance().moduleTables_by_voType[this.programplan_shared_module.rdv_type_id],
                    [
                        new ManyToOneReferenceDatatableField(
                            'facilitator_id',
                            VOsTypesManager.getInstance().moduleTables_by_voType[this.programplan_shared_module.facilitator_type_id],
                            [
                                new ComputedDatatableField(
                                    'facilitator_name',
                                    (facilitator: IPlanFacilitator) => facilitator.firstname + ' ' + facilitator.lastname)
                            ]
                        )
                    ]
                ).setUID_for_readDuplicateOnly('rdv_prep_facilitator'));

            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.rdv_prep_type_id,
                prep_crud,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.rdv_prep_type_id,
                    "fa-calendar-check-o",
                    50 + 1,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.programplan_shared_module.rdv_cr_type_id) {
            let cr_crud = CRUD.getNewCRUD(this.programplan_shared_module.rdv_cr_type_id);

            // On ajoute le RDV avec la date - cible - consultant
            cr_crud.readDatatable.pushField(
                new ManyToOneReferenceDatatableField(
                    'rdv_id',
                    VOsTypesManager.getInstance().moduleTables_by_voType[this.programplan_shared_module.rdv_type_id],
                    [
                        new ComputedDatatableField(
                            'rdv_date',
                            (rdv: IPlanRDV) => Dates.format(rdv.start_time, ModuleFormatDatesNombres.FORMAT_YYYYMMDD + ' ' + TimeHandler.MINUTES_TIME_FOR_INDEX_FORMAT))
                    ]
                ).setUID_for_readDuplicateOnly('rdv_cr_date'));

            // On ajoute le RDV avec la cible - consultant
            cr_crud.readDatatable.pushField(
                new ManyToOneReferenceDatatableField(
                    'rdv_id',
                    VOsTypesManager.getInstance().moduleTables_by_voType[this.programplan_shared_module.rdv_type_id],
                    [
                        new ManyToOneReferenceDatatableField(
                            'target_id',
                            VOsTypesManager.getInstance().moduleTables_by_voType[this.programplan_shared_module.target_type_id],
                            [
                                new SimpleDatatableField('name')
                            ])
                    ]
                ).setUID_for_readDuplicateOnly('rdv_cr_target'));

            // On ajoute le RDV avec la date - cible - consultant
            cr_crud.readDatatable.pushField(
                new ManyToOneReferenceDatatableField(
                    'rdv_id',
                    VOsTypesManager.getInstance().moduleTables_by_voType[this.programplan_shared_module.rdv_type_id],
                    [
                        new ManyToOneReferenceDatatableField(
                            'facilitator_id',
                            VOsTypesManager.getInstance().moduleTables_by_voType[this.programplan_shared_module.facilitator_type_id],
                            [
                                new ComputedDatatableField(
                                    'facilitator_name',
                                    (facilitator: IPlanFacilitator) => facilitator.firstname + ' ' + facilitator.lastname)
                            ]
                        )
                    ]
                ).setUID_for_readDuplicateOnly('rdv_cr_facilitator'));

            await CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.rdv_cr_type_id,
                cr_crud,
                MenuElementVO.create_new(
                    this.programplan_shared_module.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    this.programplan_shared_module.rdv_cr_type_id,
                    "fa-calendar-check-o",
                    50 + 1,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes);
        }

        if (!!this.post_initialization_hook) {
            await this.post_initialization_hook();
        }
    }
}