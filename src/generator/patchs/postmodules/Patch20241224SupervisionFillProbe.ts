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

        // on récupère toutes les sondes (à ce stade on est sensé en avoir aucune)
        const probes: SupervisedProbeVO[] = await query(SupervisedProbeVO.API_TYPE_ID).select_vos<SupervisedProbeVO>();

        // si on en a on les range par sup_item_api_type_id
        const probes_by_sup_item_api_type_id: { [sup_item_api_type_id: string]: SupervisedProbeVO } = {};
        for (const i in probes) {
            const probe = probes[i];
            probes_by_sup_item_api_type_id[probe.sup_item_api_type_id] = probe;
        }

        const registered_api_types = SupervisionController.getInstance().registered_controllers;

        for (const api_type in registered_api_types) {
            // console.log(this.uid + ' START apis_type ' + api_type);

            // on récupère un item pour récupérér la categorie
            const item: ISupervisedItem = await query(api_type)
                .set_limit(1)
                .select_vo<ISupervisedItem>();

            const probe: SupervisedProbeVO = probes_by_sup_item_api_type_id[api_type]
                ? probes_by_sup_item_api_type_id[api_type]
                : new SupervisedProbeVO();

            probe.sup_item_api_type_id = api_type;
            probe.category_id = item?.category_id;

            const res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(probe);

            if (!res) {
                ConsoleHandler.error(this.uid + ' Impossible de créer la sonde pour le api_type ' + api_type);
                continue;
            } else {
                console.log(this.uid + ' OK créations la sonde pour le api_type ' + api_type);
            }
            probe.id = res.id;

            // const updates: ISupervisedItem[] = [];
            // // 1. Récupérer tous les items d’un type particulier
            // const items: ISupervisedItem[] = await query(api_type).select_vos<ISupervisedItem>();

            // 2. Pour chaque item, on crée ou on retrouve la sonde associée
            // for (const item of items) {
            // let probe: SupervisedProbeVO = probes_by_sup_item_api_type_id[item._type];

            // if (!probe) {
            //     probe = new SupervisedProbeVO();
            //     probe.sup_item_api_type_id = api_type;
            //     // probe.description = ...
            //     const res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(probe);

            //     if (!res) {
            //         ConsoleHandler.error(this.uid + ' Impossible de créer la sonde pour le type ' + api_type);
            //         continue;
            //     }
            //     probe.id = res.id;
            // }

            // // 3. Mettre à jour le champ probe_id sur l’item
            // item.probe_id = probe.id;
            // updates.push(item);
            // }

            // if (!!updates.length) {
            //     console.log(this.uid + ' WIP api_type ' + api_type + ' ' + updates.length + ' items to update');
            //     await ModuleDAO.getInstance().insertOrUpdateVOs(updates);
            //     console.log(this.uid + ' WIP api_type ' + api_type + ' ' + updates.length + ' items updated');
            // }
            // console.log(this.uid + ' END api_type ' + api_type);
        }

        console.log(this.uid + ' END all api_type ');
    }
}