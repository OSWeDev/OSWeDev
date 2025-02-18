import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './ModuleTablesComponent.scss';

// Ex. si on utilise d3 (optionnel, juste un squelette pour l'auto-placement)
import * as d3 from 'd3';
import ModuleTableFieldVO from '../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../shared/modules/DAO/vos/ModuleTableVO';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import ModuleTableController from '../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../../shared/modules/DAO/ModuleTableFieldController';

interface DiagramNode {
    tableId: number;
    tableName: string;
    fields: ModuleTableFieldVO[];
    folded: boolean;
    x: number;
    y: number;
}

interface DiagramLink {
    sourceId: number;
    targetId: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

@Component({
    template: require('./ModuleTablesComponent.pug'),
    components: {}
})
export default class ModuleTablesComponent extends VueComponentBase {
    // @Prop({ default: () => [] }) readonly tables!: ModuleTableVO[];
    // @Prop({ default: () => [] }) readonly fields!: ModuleTableFieldVO[];

    public nodes: DiagramNode[] = [];
    public links: DiagramLink[] = [];

    private simulation: d3.Simulation<DiagramNode, undefined> | null = null;

    get tables(): ModuleTableVO[] {
        return Object.values(ModuleTableController.module_tables_by_vo_type);
    }

    get fields(): ModuleTableFieldVO[] {
        const res: ModuleTableFieldVO[] = [];
        for (const type_id in ModuleTableFieldController.module_table_fields_by_vo_id_and_field_id) {
            const fields_by_id = ModuleTableFieldController.module_table_fields_by_vo_id_and_field_id[type_id];

            for (const field_id in fields_by_id) {
                res.push(fields_by_id[field_id]);
            }
        }

        return res;
    }

    // Calcule la hauteur du rect en fonction du nombre de champs
    public getRectHeight(node: DiagramNode): number {
        if (node.folded) {
            // Table pliée : juste la place du titre
            return 25;
        }
        // 25px pour le titre + (20px * nb de champs) + 5px de marge
        return 25 + (node.fields.length * 20) + 5;
    }

    mounted() {
        this.buildNodes();
        this.buildLinks();
        this.initForceLayout();

        // Active le zoom sur le <svg>, mais applique la transformation au <g ref="zoomLayer">
        const svg = d3.select(this.$refs.svgContainer as SVGElement);
        svg.call(d3.zoom<SVGSVGElement, unknown>()
            .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
                d3.select(this.$refs.zoomLayer as SVGGElement)
                    .attr('transform', event.transform);
            })
        );
    }

    /**
     * Permet de plier/déplier une table
     */
    public toggleFold(node: DiagramNode) {
        node.folded = !node.folded;
    }

    /**
     * Méthodes de zoom (ex. via molette, boutons, etc.) si besoin
     */
    public zoomIn() {
        // Exemple très simplifié : on modifie juste un scale global
        const svg = d3.select(this.$refs.svgContainer as SVGElement);
        svg.transition().call(
            d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
            1.2
        );
    }

    public zoomOut() {
        const svg = d3.select(this.$refs.svgContainer as SVGElement);
        svg.transition().call(
            d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
            0.8
        );
    }

    /**
     * Construit la liste des noeuds du diagramme
     */
    private buildNodes() {
        // Chaque table est un noeud
        this.nodes = this.tables.map((table, index) => {
            // On récupère les fields associées à cette table
            const relatedFields = this.fields.filter(f => f.module_table_vo_type === table.vo_type);

            return {
                tableId: table.id,
                tableName: table.table_name,
                fields: relatedFields,
                folded: false,
                // Position initiale aléatoire ou fixe
                x: Math.random() * 500,
                y: Math.random() * 500,
            };
        });
    }

    /**
     * Construit la liste des liens entre les tables
     */
    private buildLinks() {
        // Exemple basique : on relie deux tables si l'une a un champ "foreign_ref_vo_type" qui pointe sur l'autre
        let result: DiagramLink[] = [];

        this.fields.forEach((f) => {
            if (f.field_type === ModuleTableFieldVO.FIELD_TYPE_foreign_key && f.foreign_ref_vo_type) {
                const sourceTable = this.tables.find(t => t.vo_type === f.module_table_vo_type);
                const targetTable = this.tables.find(t => t.vo_type === f.foreign_ref_vo_type);

                if (sourceTable && targetTable) {
                    result.push({
                        sourceId: sourceTable.id,
                        targetId: targetTable.id,
                        x1: 0, y1: 0, x2: 0, y2: 0 // MàJ dynamiquement via d3
                    });
                }
            }
        });

        this.links = result;
    }

    /**
     * Mise à jour des coordonnées (x1,y1,x2,y2) des liens et positionnement des noeuds
     */
    private onTick() {
        this.nodes.forEach((node) => {
            // On reste dans les limites d'une zone 600x600 (exemple)
            node.x = Math.max(50, Math.min(550, node.x));
            node.y = Math.max(50, Math.min(550, node.y));
        });

        this.links.forEach((link) => {
            const source = this.nodes.find(n => n.tableId === link.sourceId);
            const target = this.nodes.find(n => n.tableId === link.targetId);
            if (source && target) {
                link.x1 = source.x;
                link.y1 = source.y;
                link.x2 = target.x;
                link.y2 = target.y;
            }
        });
    }

    private initForceLayout() {
        this.simulation = d3.forceSimulation(this.nodes)
            // Augmente la force de répulsion
            .force('charge', d3.forceManyBody().strength(-800))
            .force('center', d3.forceCenter(300, 300))
            // Agrandit la collision
            .force('collision', d3.forceCollide(80))
            // Définit un lien avec une distance minimale
            .force('link', d3.forceLink()
                .id((d: any) => d.tableId)
                .links(this.links as any)
                .distance(150)
            )
            .on('tick', () => this.onTick());
    }
}