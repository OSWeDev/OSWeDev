import { field_names } from '../../../tools/ObjectHandler';
import ModuleTableController from '../../DAO/ModuleTableController';
import ModuleTableFieldController from '../../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../DAO/vos/ModuleTableFieldVO';
import Module from '../../Module';
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
        const default_label_field: ModuleTableFieldVO = ModuleTableFieldController.create_new(ModePaiementVO.API_TYPE_ID, field_names<ModePaiementVO>().mode, ModuleTableFieldVO.FIELD_TYPE_string, 'Mode');
        const datatable_fields = [
            default_label_field,
        ];
        ModuleTableController.create_new(this.name, ModePaiementVO, default_label_field, 'Mode de paiement');
    }

    public initializePaiement(): void {
        // Création de la table Paiement
        const field_abonnement_id: ModuleTableFieldVO = ModuleTableFieldController.create_new(PaiementVO.API_TYPE_ID, field_names<PaiementVO>().abonnement_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Abonnement', true);
        const field_mode_paiement_id: ModuleTableFieldVO = ModuleTableFieldController.create_new(PaiementVO.API_TYPE_ID, field_names<PaiementVO>().mode_paiement_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Mode paiement', true);

        const datatable_fields = [
            field_abonnement_id,
            field_mode_paiement_id,
            ModuleTableFieldController.create_new(PaiementVO.API_TYPE_ID, field_names<PaiementVO>().statut, ModuleTableFieldVO.FIELD_TYPE_enum, 'Statut').setEnumValues({
                [PaiementVO.STATUT_ERREUR]: PaiementVO.STATUT_LABELS[PaiementVO.STATUT_ERREUR],
                [PaiementVO.STATUT_SUCCES]: PaiementVO.STATUT_LABELS[PaiementVO.STATUT_SUCCES],
            }),
        ];
        const dt = ModuleTableController.create_new(this.name, PaiementVO, field_mode_paiement_id, 'Paiement');
        field_abonnement_id.set_many_to_one_target_moduletable_name(AbonnementVO.API_TYPE_ID);
        field_mode_paiement_id.set_many_to_one_target_moduletable_name(ModePaiementVO.API_TYPE_ID);
    }
}