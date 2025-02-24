import Component from 'vue-class-component';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './ModuleTablesComponent.scss';

// JointJS (Core)
import * as joint from '@joint/core';
import { DirectedGraph } from '@joint/layout-directed-graph';
// Au besoin : import "jointjs/dist/joint.layout.DirectedGraph"; // si vous utilisez le layout DirectedGraph

// Ex. si on utilise d3 (optionnel, juste un squelette pour l'auto-placement)
import ModuleTableController from '../../../../shared/modules/DAO/ModuleTableController';
import ModuleTableFieldController from '../../../../shared/modules/DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../shared/modules/DAO/vos/ModuleTableVO';

/**
 * Représente les données minimales pour un nœud (table)
 * On y stocke le "folded" pour savoir si on masque ou affiche les fields
 */
interface TableNodeData {
    id: number;                               // table.id
    tableName: string;                        // table.table_name
    fields: ModuleTableFieldVO[];
    folded: boolean;
}

/**
 * Représente un lien entre 2 tables
 */
interface TableLinkData {
    sourceId: number;
    targetId: number;
}

@Component({
    template: require('./ModuleTablesComponent.pug'),
    components: {}
})
export default class ModuleTablesComponent extends VueComponentBase {
    // @Prop({ default: () => [] }) readonly tables!: ModuleTableVO[];
    // @Prop({ default: () => [] }) readonly fields!: ModuleTableFieldVO[];

    private graph: joint.dia.Graph | null = null;
    private paper: joint.dia.Paper | null = null;

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

    mounted() {
        this.initDiagram();
        this.loadDataIntoDiagram();
        this.autoLayout();
    }

    /**
     * Initialise la structure de base du diagramme (graph, paper, options).
     */
    private initDiagram() {
        // 1. Crée un graph JointJS
        this.graph = new joint.dia.Graph();

        // 2. Crée un "paper" (rendu) et l'attache au conteneur #joint-container
        this.paper = new joint.dia.Paper({
            el: this.$refs.jointContainer as HTMLElement,
            model: this.graph,
            width: '100%',
            height: '100%',
            gridSize: 1,
            drawGrid: false,
            background: { color: '#ffffff' }, // Fond éventuel
            // Permet la navigation pan/zoom si besoin :
            // interactive: false, // si on veut désactiver tout drag des éléments
        });
    }

    /**
     * Transforme nos tables/fields en "cells" (Rectangles + Links) JointJS et les ajoute au graph.
     */
    private loadDataIntoDiagram() {
        if (!this.graph) return;

        // Construit la liste des nœuds (un par table)
        const nodes: joint.dia.Element[] = [];
        // Construit la liste des liens
        const links: joint.dia.Link[] = [];

        // Map <table.id, data> pour accéder facilement
        const tableNodeDataArray: TableNodeData[] = this.tables.map((table) => {
            const relatedFields = this.fields.filter(f => f.module_table_vo_type === table.vo_type);
            return {
                id: table.id,
                tableName: table.table_name,
                fields: relatedFields,
                folded: false
            };
        });

        // 1. Crée les "Rectangles" pour chaque table
        tableNodeDataArray.forEach((nodeData) => {
            // On crée un "shape" standard rectangle
            const element = new joint.shapes.standard.Rectangle({
                // id unique
                id: 'table_' + nodeData.id,
                // On stocke toutes nos infos dans un attribut custom "nodeData"
                // pour y accéder facilement (ex: pliage)
                data: nodeData,
                size: {
                    width: 180, // Largeur fixe
                    height: this.getNodeHeight(nodeData) // Calculé
                },
                attrs: {
                    body: {
                        fill: '#f9f9f9',
                        stroke: '#333'
                    },
                    label: {
                        text: this.buildNodeLabel(nodeData),
                        fontSize: 12,
                        fill: '#000',
                        // Pour un label multi-lignes, JointJS gère \n
                        textAnchor: 'middle',
                        textVerticalAnchor: 'middle'
                    }
                }
            });

            // Ajout d'un event "element:click" (ou "element:pointerdown") pour toggler le fold
            element.on('element:pointerclick', (elementView: joint.dia.ElementView) => {
                const cell = elementView.model;
                const data = cell.get('data') as TableNodeData;
                data.folded = !data.folded;
                // On met à jour le label + la hauteur
                cell.attr('label/text', this.buildNodeLabel(data));
                cell.resize(180, this.getNodeHeight(data));
            });

            nodes.push(element);
        });

        // 2. Crée les liens "Link" pour chaque foreign_key
        this.fields.forEach((f) => {
            if (f.field_type === ModuleTableFieldVO.FIELD_TYPE_foreign_key && f.foreign_ref_vo_type) {
                const sourceTable = this.tables.find(t => t.vo_type === f.module_table_vo_type);
                const targetTable = this.tables.find(t => t.vo_type === f.foreign_ref_vo_type);
                if (sourceTable && targetTable) {
                    links.push(new joint.shapes.standard.Link({
                        source: { id: 'table_' + sourceTable.id },
                        target: { id: 'table_' + targetTable.id },
                        attrs: {
                            line: {
                                stroke: '#999',
                                strokeWidth: 1.5,
                                targetMarker: {
                                    'type': 'path',
                                    'stroke': '#999',
                                    'fill': '#999',
                                    'd': 'M 10 -5 0 0 10 5 z'
                                }
                            }
                        }
                    }));
                }
            }
        });

        // 3. Ajoute tous les cells au graph
        this.graph.resetCells([...nodes, ...links]);
    }

    /**
     * Calcule la hauteur du rectangle en fonction du nombre de champs et du titre
     */
    private getNodeHeight(nodeData: TableNodeData): number {
        // Hauteur de base pour le titre
        const base = 40; // un peu de marge
        if (nodeData.folded) {
            return base;
        }
        // Ajoute ~ 15px par champ
        return base + (nodeData.fields.length * 15);
    }

    /**
     * Construit le texte à afficher dans le label (tableName + fields si pas plié)
     */
    private buildNodeLabel(nodeData: TableNodeData): string {
        const title = nodeData.tableName;
        if (nodeData.folded) {
            // Juste le titre
            return title;
        }
        // Ajoutons chaque field en nouvelle ligne
        const fieldsList = nodeData.fields.map(
            f => `${f.field_name} (${f.field_type})`
        );
        // Saut de ligne => JointJS l'interprétera pour du multiline
        return title + '\n' + fieldsList.join('\n');
    }

    /**
     * Applique un layout "automatique" (ex: DirectedGraph) pour organiser les éléments
     */
    private autoLayout() {
        if (!this.graph) return;

        // JointJS Core propose un layout "joint.layout.DirectedGraph" (Dagre-like).
        // => Il faut s'assurer d'importer la version qui inclut "joint.layout.DirectedGraph" (selon la doc).
        DirectedGraph.layout(this.graph, {
            setLinkVertices: false,
            rankDir: 'LR', // LR = de gauche à droite, TB = top to bottom, etc.
            marginX: 50,
            marginY: 50
        });
    }
}