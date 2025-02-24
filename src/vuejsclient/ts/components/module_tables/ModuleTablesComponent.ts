import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleTableFieldVO from '../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../shared/modules/DAO/vos/ModuleTableVO';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './ModuleTablesComponent.scss';
import ModuleTableController from '../../../../shared/modules/DAO/ModuleTableController';

@Component({
    template: require('./ModuleTablesComponent.pug'),
    components: {}
})
export default class ModuleTablesComponent extends VueComponentBase {

    @Prop({ default: () => ({}) })
    readonly fields_by_table_name_and_field_name!: { [table_name: string]: { [field_name: string]: ModuleTableFieldVO } };

    @Prop({ default: () => ({}) })
    readonly tables_by_table_name!: { [table_name: string]: ModuleTableVO };

    private ctx: CanvasRenderingContext2D | null = null;
    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;

    // Positions et vitesses pour la "physique"
    private blockPositions: { [table_name: string]: { x: number; y: number; folded: boolean } } = {};
    private velocities: { [table_name: string]: { vx: number; vy: number } } = {};

    // Contrôle de l'animation
    private isLayoutRunning: boolean = false;
    private layoutRequestId: number = 0;
    private adjacency: { [tableName: string]: string[] } = {};

    @Watch('fields_by_table_name_and_field_name', { deep: true })
    @Watch('tables_by_table_name', { deep: true })
    public onDataChange() {
        // Dès qu'on ajoute / supprime des tables/champs, on recalcule les edges
        this.setupNodesAndEdges();
        // On relance la physique
        this.startLayout();
    }

    public mounted() {
        this.initCanvas();
        this.setupNodesAndEdges();
        this.startLayout();

        // Écouteurs souris et molette
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        canvas.addEventListener('mousedown', this.onMouseDown);
        canvas.addEventListener('mousemove', this.onMouseMove);
        canvas.addEventListener('mouseup', this.onMouseUp);
        canvas.addEventListener('wheel', (e) => this.onWheel(e));
    }

    public initCanvas() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;
        this.ctx = canvas.getContext('2d')!;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        window.addEventListener('resize', this.onResize);
    }

    // public onResize() {
    //     const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
    //     if (!canvas) return;
    //     canvas.width = canvas.offsetWidth;
    //     canvas.height = canvas.offsetHeight;
    //     this.drawDiagram();
    // }

    public drawDiagram() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        // Dessin des liens avant les blocs (pour que les blocs passent "au-dessus")
        Object.keys(this.tables_by_table_name).forEach((tableName) => {
            const fields = this.fields_by_table_name_and_field_name[tableName] || {};
            this.drawLinks(ctx, tableName, fields);
        });

        // Dessin des blocs
        Object.keys(this.tables_by_table_name).forEach((tableName) => {
            const table = this.tables_by_table_name[tableName];
            const position = this.getBlockPosition(tableName);
            this.drawBlock(ctx, table, position);
        });

        ctx.restore();
    }

    public drawBlock(
        ctx: CanvasRenderingContext2D,
        table: ModuleTableVO,
        position: { x: number; y: number; folded: boolean }
    ) {
        const blockWidth = 200;
        const blockHeight = position.folded ? 40 : 120;

        ctx.fillStyle = '#f5f5f5';
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(position.x, position.y, blockWidth, blockHeight);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = '14px Roboto';
        ctx.fillText(this.t(table.label.code_text), position.x + 10, position.y + 20);

        if (!position.folded) {
            ctx.fillStyle = '#666';
            ctx.font = '12px Roboto';
            ctx.fillText('...champs...', position.x + 10, position.y + 40);
        }
    }

    public drawLinks(
        ctx: CanvasRenderingContext2D,
        tableName: string,
        fields: { [field_name: string]: ModuleTableFieldVO }
    ) {
        Object.keys(fields).forEach((fieldName) => {
            const field = fields[fieldName];
            if (field.field_type === ModuleTableFieldVO.FIELD_TYPE_foreign_key && field.foreign_ref_vo_type) {
                const refTableName = field.foreign_ref_vo_type;
                if (!this.tables_by_table_name[refTableName]) return;
                const posA = this.getBlockPosition(tableName);
                const posB = this.getBlockPosition(refTableName);
                this.drawLine(ctx, posA, posB);
            }
        });
    }

    public drawLine(
        ctx: CanvasRenderingContext2D,
        posA: { x: number; y: number },
        posB: { x: number; y: number }
    ) {
        const blockWidth = 200;
        const blockHeight = 120;
        ctx.beginPath();
        ctx.moveTo(posA.x + blockWidth / 2, posA.y + blockHeight / 2);
        ctx.lineTo(posB.x + blockWidth / 2, posB.y + blockHeight / 2);
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    public getBlockPosition(tableName: string): { x: number; y: number; folded: boolean } {
        if (!this.blockPositions[tableName]) {
            this.blockPositions[tableName] = { x: 100, y: 100, folded: false };
        }
        return this.blockPositions[tableName];
    }

    public onWheel(e: WheelEvent) {
        e.preventDefault();
        const delta = (e.deltaY > 0) ? -0.1 : 0.1;
        // Retirer la limite haute pour zoomer "à l’infini"
        this.scale = Math.max(0.01, this.scale + delta);
        this.drawDiagram();
    }

    public onResize() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.drawDiagram();
    }

    // public onWheel(e: WheelEvent) {
    //     e.preventDefault();
    //     const delta = e.deltaY > 0 ? -0.1 : 0.1;
    //     if (e.ctrlKey) {
    //         this.scale += delta * 0.5;
    //     } else {
    //         this.scale += delta;
    //     }
    //     this.scale = Math.max(0.1, Math.min(5, this.scale));
    //     this.drawDiagram();
    // }

    // public zoomIn() {
    //     this.scale = Math.min(5, this.scale + 0.1);
    //     this.drawDiagram();
    // }

    // public zoomOut() {
    //     this.scale = Math.max(0.1, this.scale - 0.1);
    //     this.drawDiagram();
    // }

    public onMouseDown(e: MouseEvent) {
        this.isDragging = true;
        this.dragStartX = e.clientX - this.offsetX;
        this.dragStartY = e.clientY - this.offsetY;
    }

    public onMouseMove(e: MouseEvent) {
        if (!this.isDragging) return;
        this.offsetX = e.clientX - this.dragStartX;
        this.offsetY = e.clientY - this.dragStartY;
        this.drawDiagram();
    }

    public onMouseUp() {
        this.isDragging = false;
    }

    public toggleFold(tableName: string) {
        if (!this.blockPositions[tableName]) return;
        this.blockPositions[tableName].folded = !this.blockPositions[tableName].folded;
        this.drawDiagram();
    }

    private setupNodesAndEdges() {

        const tableNames = Object.keys(this.tables_by_table_name);

        // Initialiser adjacency
        this.adjacency = {};
        tableNames.forEach(name => {
            this.adjacency[name] = [];
        });

        // On affecte position + vitesse si besoin
        tableNames.forEach((name) => {
            if (!this.blockPositions[name]) {
                this.blockPositions[name] = {
                    x: Math.random() * 500,
                    y: Math.random() * 500,
                    folded: false,
                };
            }
            if (!this.velocities[name]) {
                this.velocities[name] = { vx: 0, vy: 0 };
            }
        });

        // On remplit adjacency à partir des foreign keys
        tableNames.forEach((tableName) => {
            const fields = this.fields_by_table_name_and_field_name[tableName] || {};
            Object.keys(fields).forEach((fieldName) => {
                const field = fields[fieldName];
                if (field.field_type === ModuleTableFieldVO.FIELD_TYPE_foreign_key && field.foreign_ref_vo_type) {
                    const ref = field.foreign_ref_vo_type;
                    if (this.tables_by_table_name[ref]) {
                        // Ajout bidirectionnel
                        this.adjacency[tableName].push(ref);
                        this.adjacency[ref].push(tableName);
                    }
                }
            });
        });

        // Nettoyage pour les tables supprimées
        Object.keys(this.velocities).forEach((oldName) => {
            if (!tableNames.includes(oldName)) {
                delete this.velocities[oldName];
                delete this.blockPositions[oldName];
            }
        });
    }

    // Lance l'animation (physique en temps réel)
    private startLayout() {
        if (this.isLayoutRunning) return;
        this.isLayoutRunning = true;
        this.layoutLoop();
    }

    // Arrête l'animation
    private stopLayout() {
        this.isLayoutRunning = false;
        if (this.layoutRequestId) {
            cancelAnimationFrame(this.layoutRequestId);
            this.layoutRequestId = 0;
        }
    }

    // Boucle d'animation (appelée à chaque frame)
    private layoutLoop() {
        if (!this.isLayoutRunning) return;

        // On peut faire quelques itérations par frame
        // pour que la convergence ne soit pas trop lente
        for (let i = 0; i < 3; i++) {
            this.applyForcesOnce();
        }

        this.drawDiagram();

        // Programmez la frame suivante
        this.layoutRequestId = requestAnimationFrame(() => this.layoutLoop());
    }

    private applyForcesOnce() {

        const tableNames = Object.keys(this.tables_by_table_name);
        const REPULSION_FORCE = 10000;
        const SPRING_LENGTH = 150;
        const ATTRACTION_FACTOR = 0.001;
        const DAMPING = 0.85;

        // --- Répulsion entre tous les nœuds ---
        for (let i = 0; i < tableNames.length; i++) {
            for (let j = i + 1; j < tableNames.length; j++) {
                const tA = tableNames[i];
                const tB = tableNames[j];
                const posA = this.blockPositions[tA];
                const posB = this.blockPositions[tB];

                const dx = posB.x - posA.x;
                const dy = posB.y - posA.y;
                const distSq = dx * dx + dy * dy || 0.01;
                const dist = Math.sqrt(distSq);

                const force = REPULSION_FORCE / distSq;
                const fx = (force * dx) / dist;
                const fy = (force * dy) / dist;

                this.velocities[tA].vx -= fx;
                this.velocities[tA].vy -= fy;
                this.velocities[tB].vx += fx;
                this.velocities[tB].vy += fy;
            }
        }

        // --- Attraction via adjacency (foreign_keys) ---
        tableNames.forEach((source) => {
            const neighbors = this.adjacency[source];
            neighbors.forEach((target) => {
                if (target <= source) {
                    // éviter de doubler le calcul (car adjacency est symétrique)
                    return;
                }
                const sPos = this.blockPositions[source];
                const tPos = this.blockPositions[target];

                const dx = tPos.x - sPos.x;
                const dy = tPos.y - sPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                const delta = dist - SPRING_LENGTH;
                const force = delta * ATTRACTION_FACTOR;
                const fx = (force * dx) / dist;
                const fy = (force * dy) / dist;

                this.velocities[source].vx += fx;
                this.velocities[source].vy += fy;
                this.velocities[target].vx -= fx;
                this.velocities[target].vy -= fy;
            });
        });

        // --- Force centripète pour les nœuds isolés (ou tous les nœuds) ---
        // Par ex. ramener doucement vers (0,0) dans votre espace de coordonnées
        const CENTER_GRAVITY = 0.0005;
        tableNames.forEach((tn) => {
            const pos = this.blockPositions[tn];
            // S'applique seulement si le nœud n'a aucune connexion :
            if (this.adjacency[tn].length === 0) {
                const dx = -pos.x; // ramène vers x=0
                const dy = -pos.y; // ramène vers y=0
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                const force = dist * CENTER_GRAVITY;
                const fx = (force * dx) / dist;
                const fy = (force * dy) / dist;
                this.velocities[tn].vx += fx;
                this.velocities[tn].vy += fy;
            }
        });

        // Mise à jour des positions
        tableNames.forEach((tn) => {
            this.blockPositions[tn].x += this.velocities[tn].vx;
            this.blockPositions[tn].y += this.velocities[tn].vy;
            // Amortissement
            this.velocities[tn].vx *= DAMPING;
            this.velocities[tn].vy *= DAMPING;
        });
    }
}
