/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import OseliaAppMemVO from '../../../shared/modules/Oselia/vos/OseliaAppMemVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250515_APPMEM_LEXIQUE_METIER implements IGeneratorWorker {

    private static instance: Patch20250515_APPMEM_LEXIQUE_METIER = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250515_APPMEM_LEXIQUE_METIER';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250515_APPMEM_LEXIQUE_METIER {
        if (!Patch20250515_APPMEM_LEXIQUE_METIER.instance) {
            Patch20250515_APPMEM_LEXIQUE_METIER.instance = new Patch20250515_APPMEM_LEXIQUE_METIER();
        }
        return Patch20250515_APPMEM_LEXIQUE_METIER.instance;
    }


    public async work(db: IDatabase<any>) {

        const key = "Lexique métier (FR → EN)";
        let lexique: OseliaAppMemVO = await query(OseliaAppMemVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaAppMemVO>().key, key)
            .exec_as_server()
            .select_vo<OseliaAppMemVO>();

        if (!lexique) {
            lexique.value = "* Pièces de rechange → Spare parts\n" +
                "* Pièces → Parts\n" +
                "* CA (chiffre d’affaires) → REV (Revenue)\n" +
                "* HT → Ex-VAT\n" +
                "* Panier moyen → Average basket\n" +
                "* QTE / Quantité / Volume → VOL / Volume\n" +
                "* Objectif / Objectifs → Target / Targets\n" +
                "* Réalisé → Achieved\n" +
                "* RAF / RàF / Reste à faire (Reste à facturer) → TBD / To be done&#x20;\n" +
                "* Ratio → Ratio\n" +
                "* PR / Vol PR → Parts / Parts Vol\n" +
                "* MO (Main d'oeuvre) → Labor\n" +
                "* Cessions / Hors Cessions → Transfers / Excl. Transfers\n" +
                "* ATL / Atelier → WS / Workshop\n" +
                "* Point de vente (PDV) → Point of sale (PoS)\n" +
                "* Famille / Sous-famille → Family / Sub-family\n" +
                "* Forfait → Package\n" +
                "* Référence → Reference\n" +
                "* Facturation → Invoicing\n" +
                "* Indice de performance → Performance index\n" +
                "* FH / FAH / Filtre à huile → OF / Oil filter\n" +
                "* FàA / FAA / Filtre à air → AF / Air filter\n" +
                "* FàG/ FAG / Filtre à Gasoil → DF / Diesel filter\n" +
                "* FàP / FAP / Filtre à pollen → PF / Pollen filter\n" +
                "* ECHAP / Echappement → EXH / Exhaust\n" +
                "* PDP / Plaques de police → RN Plates\n" +
                "* LF / LDF / Liquide de frein → BF / Brake fluid\n" +
                "* BEG / Balais Essuie-glaces → WIP / Wiper blades\n" +
                "* PLAQ FR / Plaquettes de frein → BP / Brake pads\n" +
                "* DISQ FR / Disque de frein → BD / Brake disc\n" +
                "* Kits de frein / KIT FR → BK / Brake kit\n" +
                "* BATT / Batterie → BAT / Battery\n" +
                "* AMORT / Amortisseurs → SHK / Shock absorbers\n" +
                "* PN / Pneu / Pneumatique → TYR / Tire\n" +
                "* PB / Pare-brise → WSCR / Windshield\n" +
                "* PAE / Pompe à eau → WP / Water pump\n" +
                "* KIT DISTRI / Courroies de distribution → TB / Timing belt\n" +
                "* SUP. KITS / Super kits + pompe à eau → SK / Super kits\n" +
                "* COUR ACC / Courroie accessoire → AB / Accessory belt\n" +
                "* BOUG ALL / Bougies d'allumage → SP / Spark plugs\n" +
                "* BOUG PRE / Bougies de préchauffage → GP / Glow plugs\n" +
                "* ACCESS / Accessoires → ACC / Accessories\n" +
                "* N/A → N/A\n" +
                "* Nettoyant Clim → AC cleaner\n" +
                "* Additifs carburant → Fuel additives\n" +
                "* RRDI → Site ID\n" +
                "* RRS → AM (Area Manager)\n" +
                "* BC → BC (Business Coach)\n" +
                "* CRESCENDO → CRESCENDO\n" +
                "* DVN / RA → AR (Approved Repairer)\n" +
                "* API → API\n" +
                "* DMS → DMS\n" +
                "* BSI → BSI\n" +
                "* CCS / CS → SA (Service Advisor)\n" +
                "* OBJ → OBJ\n" +
                "* ID → ID\n" +
                "* KPI → KPI\n" +
                "* URL → URL\n" +
                "* Ajouter → Add\n" +
                "* Modifier → Edit\n" +
                "* Supprimer → Delete\n" +
                "* Consulter → View\n" +
                "* Lister → List\n" +
                "* Importer → Import\n" +
                "* Exporter → Export";
            lexique.key = key;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(lexique);
        }
    }
}