import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import CRUD from '../../../../shared/modules/DAO/vos/CRUD';
import ComputedDatatableField from '../../../../shared/modules/DAO/vos/datatable/ComputedDatatableField';
import ManyToOneReferenceDatatableField from '../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableField';
import SimpleDatatableField from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import ModuleFormatDatesNombres from '../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IPlanFacilitator from '../../../../shared/modules/ProgramPlan/interfaces/IPlanFacilitator';
import IPlanRDV from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import TimeHandler from '../../../../shared/tools/TimeHandler';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class ProgramPlanAdminVueModuleBase extends VueModuleBase {

    public showProgramAdministration: boolean = true;

    private _DEFAULT_MENU_BRANCH: MenuBranch = null;
    get DEFAULT_MENU_BRANCH(): MenuBranch {
        if (!this._DEFAULT_MENU_BRANCH) {
            this._DEFAULT_MENU_BRANCH = new MenuBranch(
                this.name + "_PPAdminVueModule",
                MenuElementBase.PRIORITY_HIGH,
                "fa-calendar",
                []
            );
        }
        return this._DEFAULT_MENU_BRANCH;
    }

    private post_initialization_hook: () => Promise<void> = null;

    public constructor(name: string, post_initialization_hook: () => Promise<void> = null) {

        super(name);
        this.post_initialization_hook = post_initialization_hook;
    }

    get programplan_shared_module(): ModuleProgramPlanBase {
        return this.shared_module as ModuleProgramPlanBase;
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(this.programplan_shared_module.POLICY_BO_ACCESS)) {
            return;
        }

        let menuBranch: MenuBranch = this.DEFAULT_MENU_BRANCH;

        if (this.showProgramAdministration) {

            if (!!this.programplan_shared_module.program_category_type_id) {
                CRUDComponentManager.getInstance().registerCRUD(
                    this.programplan_shared_module.program_category_type_id,
                    null,
                    new MenuPointer(
                        new MenuLeaf(this.programplan_shared_module.program_category_type_id, MenuElementBase.PRIORITY_ULTRAHIGH, "fa-list"),
                        menuBranch),
                    this.routes);
            }

            if (!!this.programplan_shared_module.program_type_id) {
                CRUDComponentManager.getInstance().registerCRUD(
                    this.programplan_shared_module.program_type_id,
                    null,
                    new MenuPointer(
                        new MenuLeaf(this.programplan_shared_module.program_type_id, MenuElementBase.PRIORITY_ULTRAHIGH + 1, "fa-list"),
                        menuBranch),
                    this.routes);
            }
        }

        if (!!this.programplan_shared_module.enseigne_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.enseigne_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.enseigne_type_id, MenuElementBase.PRIORITY_HIGH - 4, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }

        if (!!this.programplan_shared_module.target_group_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.target_group_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.target_group_type_id, MenuElementBase.PRIORITY_HIGH - 3, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }

        if (!!this.programplan_shared_module.target_zone_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.target_zone_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.target_zone_type_id, MenuElementBase.PRIORITY_HIGH - 2, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }


        if (!!this.programplan_shared_module.target_region_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.target_region_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.target_region_type_id, MenuElementBase.PRIORITY_HIGH - 1, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }

        if (!!this.programplan_shared_module.target_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.target_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.target_type_id, MenuElementBase.PRIORITY_HIGH, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }

        if (!!this.programplan_shared_module.contact_type_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.contact_type_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.contact_type_type_id, MenuElementBase.PRIORITY_HIGH + 1, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }

        if (!!this.programplan_shared_module.contact_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.contact_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.contact_type_id, MenuElementBase.PRIORITY_HIGH + 2, "fa-bullseye"),
                    menuBranch),
                this.routes);
        }

        if (!!this.programplan_shared_module.partner_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.partner_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.partner_type_id, MenuElementBase.PRIORITY_MEDIUM - 1, "fa-sitemap"),
                    menuBranch),
                this.routes);
        }

        if (!!this.programplan_shared_module.manager_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.manager_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.manager_type_id, MenuElementBase.PRIORITY_MEDIUM, "fa-sitemap"),
                    menuBranch),
                this.routes);
        }

        if (!!this.programplan_shared_module.facilitator_region_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.facilitator_region_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.facilitator_region_type_id, MenuElementBase.PRIORITY_LOW - 1, "fa-user-circle"),
                    menuBranch),
                this.routes);
        }

        if (!!this.programplan_shared_module.facilitator_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.facilitator_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.facilitator_type_id, MenuElementBase.PRIORITY_LOW, "fa-user-circle"),
                    menuBranch),
                this.routes);
        }

        if (!!this.programplan_shared_module.task_type_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.task_type_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.task_type_type_id, MenuElementBase.PRIORITY_LOW + 2, "fa-tasks"),
                    menuBranch),
                this.routes);
        }

        if (!!this.programplan_shared_module.task_type_id) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.task_type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.task_type_id, MenuElementBase.PRIORITY_LOW + 3, "fa-tasks"),
                    menuBranch),
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

            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.rdv_type_id,
                rdv_crud,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.rdv_type_id, MenuElementBase.PRIORITY_ULTRALOW, "fa-calendar-o"),
                    menuBranch),
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
                            (rdv: IPlanRDV) => ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(rdv.start_time) + ' ' + TimeHandler.getInstance().formatMomentMinutePrecisionTime(rdv.start_time))
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

            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.rdv_prep_type_id,
                prep_crud,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.rdv_prep_type_id, MenuElementBase.PRIORITY_ULTRALOW + 1, "fa-calendar-check-o"),
                    menuBranch),
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
                            (rdv: IPlanRDV) => ModuleFormatDatesNombres.getInstance().formatDate_FullyearMonthDay(rdv.start_time) + ' ' + TimeHandler.getInstance().formatMomentMinutePrecisionTime(rdv.start_time))
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

            CRUDComponentManager.getInstance().registerCRUD(
                this.programplan_shared_module.rdv_cr_type_id,
                cr_crud,
                new MenuPointer(
                    new MenuLeaf(this.programplan_shared_module.rdv_cr_type_id, MenuElementBase.PRIORITY_ULTRALOW + 1, "fa-calendar-check-o"),
                    menuBranch),
                this.routes);
        }

        if (!!this.post_initialization_hook) {
            await this.post_initialization_hook();
        }
    }
}