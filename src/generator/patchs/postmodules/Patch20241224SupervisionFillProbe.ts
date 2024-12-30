import { IDatabase } from 'pg-promise';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleSupervision from '../../../shared/modules/Supervision/ModuleSupervision';
import SupervisionController from '../../../shared/modules/Supervision/SupervisionController';
import SupervisedProbeVO from '../../../shared/modules/Supervision/vos/SupervisedProbeVO';
import InsertOrDeleteQueryResult from '../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ISupervisedItem from '../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import SupervisedCategoryVO from '../../../shared/modules/Supervision/vos/SupervisedCategoryVO';

export default class Patch20241224SupervisionFillProbe implements IGeneratorWorker {

    private static instance: Patch20241224SupervisionFillProbe = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20241224SupervisionFillProbe';
    }

    public static getInstance(): Patch20241224SupervisionFillProbe {
        if (!Patch20241224SupervisionFillProbe.instance) {
            Patch20241224SupervisionFillProbe.instance = new Patch20241224SupervisionFillProbe();
        }
        return Patch20241224SupervisionFillProbe.instance;
    }

    public async work(db: IDatabase<unknown>) {
        if (!ModuleSupervision.getInstance().actif) {
            return;
        }

        // on preset les poids des category de supervision arbitrairemeznt par ordre de création
        const cats: SupervisedCategoryVO[] = await query(SupervisedCategoryVO.API_TYPE_ID).select_vos<SupervisedCategoryVO>();
        for (const i in cats) {
            const cat = cats[i];
            cat.weight = parseInt(i);
        }
        if (!!cats.length) {
            console.log(this.uid + ' WIP set weight on SupervisedCategoryVO ' + cats.length + ' categorie to update');
            await ModuleDAO.getInstance().insertOrUpdateVOs(cats);
        }

        // on récupère toutes les sondes (à ce stade on est sensé en avoir aucune)
        const probes: SupervisedProbeVO[] = await query(SupervisedProbeVO.API_TYPE_ID).select_vos<SupervisedProbeVO>();

        // si on en a on les range par sup_item_api_type_id
        const probes_by_sup_item_api_type_id: { [sup_item_api_type_id: string]: SupervisedProbeVO } = {};
        for (const i in probes) {
            const probe = probes[i];
            probes_by_sup_item_api_type_id[probe.sup_item_api_type_id] = probe;
        }

        const registered_api_types = SupervisionController.getInstance().registered_controllers;
        const already_upd_probes_by_sup_item_api_type_id: { [sup_item_api_type_id: string]: boolean } = {};
        const probes_weight_by_cat_id: { [cat_id: number]: number } = {};

        for (const api_type in registered_api_types) {
            console.log(this.uid + ' START apis_type ' + api_type);

            const updates: ISupervisedItem[] = [];
            // 1. Récupérer tous les items d’un type particulier
            const items: ISupervisedItem[] = await query(api_type).select_vos<ISupervisedItem>();

            // 2. Pour chaque item, on crée ou on retrouve la sonde associée
            for (const item of items) {
                const probe: SupervisedProbeVO = probes_by_sup_item_api_type_id[api_type]
                    ? probes_by_sup_item_api_type_id[api_type]
                    : new SupervisedProbeVO();

                if (!already_upd_probes_by_sup_item_api_type_id[api_type]) {
                    probe.sup_item_api_type_id = api_type;
                    probe.category_id = item?.category_id;

                    if (!probes_weight_by_cat_id[probe.category_id]) {
                        probes_weight_by_cat_id[probe.category_id] = 0;
                    }
                    probes_weight_by_cat_id[probe.category_id] += 1;
                    probe.weight = probes_weight_by_cat_id[probe.category_id];

                    const res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(probe);

                    if (!res) {
                        ConsoleHandler.error(this.uid + ' Impossible de créer la sonde pour le type ' + api_type);
                        continue;
                    }
                    already_upd_probes_by_sup_item_api_type_id[api_type] = true;
                    probe.id = res.id;
                    probes_by_sup_item_api_type_id[api_type] = probe;
                }

                // 3. Mettre à jour le champ probe_id sur l’item
                item.probe_id = probe.id;
                updates.push(item);
            }

            if (!!updates.length) {
                console.log(this.uid + ' WIP api_type ' + api_type + ' ' + updates.length + ' items to update');
                await ModuleDAO.getInstance().insertOrUpdateVOs(updates);
                console.log(this.uid + ' WIP api_type ' + api_type + ' ' + updates.length + ' items updated');
            }
            console.log(this.uid + ' END api_type ' + api_type);
        }

        console.log(this.uid + ' END all api_type ');
    }
}