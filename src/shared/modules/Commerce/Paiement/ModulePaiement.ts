import { field_names } from '../../../tools/ObjectHandler';
import Module from '../../Module';
import ModuleTableVO from '../../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../DAO/vos/ModuleTableFieldVO';
import VOsTypesManager from '../../VO/manager/VOsTypesManager';
import AbonnementVO from '../Abonnement/vos/AbonnementVO';
import ModePaiementVO from './vos/ModePaiementVO';
import PaiementVO from './vos/PaiementVO';

export default class ModulePaiement extends Module {

    // istanbul ignore next: nothing to test
    public static getInstance(): ModulePaiement {
        if (!ModulePaiement.instance) {
            ModulePaiement.instance = new ModulePaiement();
        }
        return ModulePaiement.instance;
    }

    private static instance: ModulePaiement = null;

    private constructor() {
        super(PaiementVO.API_TYPE_ID, 'Paiement', 'Commerce/Paiement');
    }

    public initialize() {
        this.initializeModePaiement();
        this.initializePaiement();
    }

    public initializeModePaiement(): void {
        // Création de la table ModePaiement
        let default_label_field: ModuleTableFieldVO<string> = ModuleTableFieldController.create_new(ModePaiementVO.API_TYPE_ID, field_names<ModePaiementVO>().mode, ModuleTableFieldVO.FIELD_TYPE_string, 'Mode');
        let datatable_fields = [
            default_label_field,
        ];
        this.datatables.push(new ModuleTableVO<ModePaiementVO>(this, ModePaiementVO.API_TYPE_ID, () => new ModePaiementVO(), datatable_fields, default_label_field, 'Mode de paiement'));
    }

    public initializePaiement(): void {
        // Création de la table Paiement
        let field_abonnement_id: ModuleTableFieldVO<number> = ModuleTableFieldController.create_new(PaiementVO.API_TYPE_ID, field_names<PaiementVO>().abonnement_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Abonnement', true);
        let field_mode_paiement_id: ModuleTableFieldVO<number> = ModuleTableFieldController.create_new(PaiementVO.API_TYPE_ID, field_names<PaiementVO>().mode_paiement_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Mode paiement', true);

        let datatable_fields = [
            field_abonnement_id,
            field_mode_paiement_id,
            ModuleTableFieldController.create_new(PaiementVO.API_TYPE_ID, field_names<PaiementVO>().statut, ModuleTableFieldVO.FIELD_TYPE_enum, 'Statut').setEnumValues({
                [PaiementVO.STATUT_ERREUR]: PaiementVO.STATUT_LABELS[PaiementVO.STATUT_ERREUR],
                [PaiementVO.STATUT_SUCCES]: PaiementVO.STATUT_LABELS[PaiementVO.STATUT_SUCCES],
            }),
        ];
        let dt = new ModuleTableVO<PaiementVO>(this, PaiementVO.API_TYPE_ID, () => new PaiementVO(), datatable_fields, field_mode_paiement_id, 'Paiement');
        field_abonnement_id.set_many_to_one_target_moduletable_name(AbonnementVO.API_TYPE_ID);
        field_mode_paiement_id.set_many_to_one_target_moduletable_name(ModePaiementVO.API_TYPE_ID);
        this.datatables.push(dt);
    }
}