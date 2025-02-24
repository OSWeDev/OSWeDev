import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleTableFieldVO from '../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../shared/modules/DAO/vos/ModuleTableVO';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './ModuleTablesComponent.scss';
import ModuleTableFieldController from '../../../../shared/modules/DAO/ModuleTableFieldController';

@Component({
    template: require('./ModuleTablesComponent.pug'),
})
export default class ModuleTablesComponent extends VueComponentBase {

    @Prop({ default: () => ({}) })
    readonly fields_by_table_name_and_field_name!: { [table_name: string]: { [field_name: string]: ModuleTableFieldVO } };

    @Prop({ default: () => ({}) })
    readonly tables_by_table_name!: { [table_name: string]: ModuleTableVO };

    @Prop({ default: () => ({}) })
    readonly discarded_field_paths!: { [vo_type: string]: { [field_id: string]: boolean } };

    private ctx: CanvasRenderingContext2D | null = null;

    // Transformation du canvas
    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;

    // Drag du canvas
    private isDraggingCanvas: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;

    // Drag direct sur une table
    private draggedTable: string | null = null;
    private dragTableOffsetX: number = 0;
    private dragTableOffsetY: number = 0;

    // Positions, vitesse, plié/déplié
    private blockPositions: {
        [table_name: string]: {
            x: number;
            y: number;
            folded: boolean;
        };
    } = {};
    private velocities: {
        [table_name: string]: { vx: number; vy: number };
    } = {};

    private adjacency: { [tableName: string]: string[] } = {};
    private linkCountMap: { [key: string]: number } = {};

    private isLayoutRunning: boolean = false;
    private layoutRequestId: number = 0;
    private autoFitEnabled: boolean = true;

    // Pour l'animation des flèches
    private dashAnimationOffset: number = 0;

    // Constantes physiques ajustées
    private BASE_REPULSION = 10;          // répulsion de base
    private COLLISION_PUSH = 0.1;           // petit push si chevauchement
    private SPRING_LENGTH = 150;            // longueur idéale
    private ATTRACTION_FACTOR = 0.0005;     // ressort
    private CENTER_FORCE = 0.0005;         // force vers le centre réduite
    private DAMPING = 0.9;                  // amortissement plus fort
    private MAX_SPEED = 5;                  // bride la vitesse max

    @Watch('fields_by_table_name_and_field_name', { deep: true })
    @Watch('tables_by_table_name', { deep: true })
    private onDataChange() {
        this.setupNodesAndEdges();
        this.startLayout();
        this.autoFit();
    }

    private mounted() {
        this.initCanvas();
        this.setupNodesAndEdges();
        this.startLayout();
        this.autoFit();

        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        canvas.addEventListener('mousedown', this.onMouseDown);
        canvas.addEventListener('mousemove', this.onMouseMove);
        canvas.addEventListener('mouseup', this.onMouseUp);
        canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    }

    private get_link_label(table_name: string, field_name: string): string {
        return this.t(ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[table_name][field_name].field_label.code_text);
    }

    private beforeDestroy() {
        this.stopLayout();
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (canvas) {
            canvas.removeEventListener('mousedown', this.onMouseDown);
            canvas.removeEventListener('mousemove', this.onMouseMove);
            canvas.removeEventListener('mouseup', this.onMouseUp);
            canvas.removeEventListener('wheel', (e) => this.onWheel(e));
        }
        window.removeEventListener('resize', this.onResize);
    }

    private initCanvas() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;
        this.ctx = canvas.getContext('2d')!;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        window.addEventListener('resize', this.onResize);
    }

    private onResize() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.drawDiagram();
    }

    private setupNodesAndEdges() {
        const tableNames = Object.keys(this.tables_by_table_name);

        // Réinitialise adjacency
        this.adjacency = {};
        for (const tn of tableNames) {
            this.adjacency[tn] = [];
        }

        // Initialise blockPositions et velocities
        for (const tn of tableNames) {
            if (!this.blockPositions[tn]) {
                this.blockPositions[tn] = {
                    x: Math.random() * 600,
                    y: Math.random() * 400,
                    folded: true,
                };
            }
            if (!this.velocities[tn]) {
                this.velocities[tn] = { vx: 0, vy: 0 };
            }
        }

        // Foreign keys => adjacency
        for (const tableName of tableNames) {
            const fields = this.fields_by_table_name_and_field_name[tableName] || {};
            for (const fieldName of Object.keys(fields)) {
                const field = fields[fieldName];
                if (field.field_type === ModuleTableFieldVO.FIELD_TYPE_foreign_key && field.foreign_ref_vo_type) {
                    const ref = field.foreign_ref_vo_type;
                    if (this.tables_by_table_name[ref]) {
                        this.adjacency[tableName].push(ref);
                        this.adjacency[ref].push(tableName);
                    }
                }
            }
        }

        // Nettoyage
        for (const oldName of Object.keys(this.blockPositions)) {
            if (!tableNames.includes(oldName)) {
                delete this.blockPositions[oldName];
                delete this.velocities[oldName];
                delete this.adjacency[oldName];
            }
        }
    }

    private startLayout() {
        if (this.isLayoutRunning) return;
        this.isLayoutRunning = true;
        this.layoutLoop();
    }

    private layoutLoop() {
        if (!this.isLayoutRunning) return;

        // Plusieurs itérations par frame pour accélérer la stabilisation
        for (let i = 0; i < 3; i++) {
            this.applyForcesOnce();
        }
        // Animation des pointillés
        this.dashAnimationOffset += 0.1;

        this.drawDiagram();
        this.layoutRequestId = requestAnimationFrame(() => this.layoutLoop());
    }

    private applyForcesOnce() {
        const tableNames = Object.keys(this.tables_by_table_name);
        if (!tableNames.length) return;

        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        // Centre (en coord diag)
        // const centerX = (canvas.width / 2 - this.offsetX) / this.scale;
        // const centerY = (canvas.height / 2 - this.offsetY) / this.scale;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // --- 1) Repulsion "globale" coulombienne ---
        // (même sans chevauchement, on veut les éloigner un peu si trop proches)
        for (let i = 0; i < tableNames.length; i++) {
            const tA = tableNames[i];
            const posA = this.blockPositions[tA];

            for (let j = i + 1; j < tableNames.length; j++) {
                const tB = tableNames[j];
                const posB = this.blockPositions[tB];

                // On ne bouge pas si la table est en drag
                if (this.draggedTable === tA && this.draggedTable === tB) {
                    continue;
                }

                const dx = posB.x - posA.x;
                const dy = posB.y - posA.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 0.5) dist = 0.5; // évite le /0

                // Repulsion ~ 1 / dist
                const repulsion = this.BASE_REPULSION / dist;

                // Force
                const fx = (repulsion * dx) / dist;
                const fy = (repulsion * dy) / dist;

                // tA
                if (this.draggedTable !== tA) {
                    this.velocities[tA].vx -= fx;
                    this.velocities[tA].vy -= fy;
                }
                // tB
                if (this.draggedTable !== tB) {
                    this.velocities[tB].vx += fx;
                    this.velocities[tB].vy += fy;
                }
            }
        }

        // --- 2) Petit push correctif en cas de chevauchement (collisions) ---
        for (let i = 0; i < tableNames.length; i++) {
            const tA = tableNames[i];
            const posA = this.blockPositions[tA];
            const rA = this.getBlockRadius(tA);

            for (let j = i + 1; j < tableNames.length; j++) {
                const tB = tableNames[j];
                const posB = this.blockPositions[tB];
                const rB = this.getBlockRadius(tB);

                // On ne bouge pas si drag
                if (this.draggedTable === tA && this.draggedTable === tB) {
                    continue;
                }

                const dx = posB.x - posA.x;
                const dy = posB.y - posA.y;
                const dist = Math.max(0.5, Math.sqrt(dx * dx + dy * dy));
                const minDist = rA + rB;
                if (dist < minDist) {
                    // Overlap => on repousse un peu plus
                    const overlap = (minDist - dist) / minDist;
                    const force = overlap * this.COLLISION_PUSH;
                    const fx = (force * dx) / dist;
                    const fy = (force * dy) / dist;

                    if (this.draggedTable !== tA) {
                        this.velocities[tA].vx -= fx;
                        this.velocities[tA].vy -= fy;
                    }
                    if (this.draggedTable !== tB) {
                        this.velocities[tB].vx += fx;
                        this.velocities[tB].vy += fy;
                    }
                }
            }
        }

        // --- 3) Attraction "ressort" via adjacency ---
        for (const source of tableNames) {
            const neighbors = this.adjacency[source];
            for (const target of neighbors) {
                if (target <= source) continue;
                if (this.draggedTable === source || this.draggedTable === target) {
                    continue;
                }
                const sPos = this.blockPositions[source];
                const tPos = this.blockPositions[target];
                const dx = tPos.x - sPos.x;
                const dy = tPos.y - sPos.y;
                const dist = Math.max(0.5, Math.sqrt(dx * dx + dy * dy));
                const delta = dist - this.SPRING_LENGTH;
                const force = delta * this.ATTRACTION_FACTOR;
                const fx = (force * dx) / dist;
                const fy = (force * dy) / dist;

                this.velocities[source].vx += fx;
                this.velocities[source].vy += fy;
                this.velocities[target].vx -= fx;
                this.velocities[target].vy -= fy;
            }
        }

        // --- 4) Force vers le centre pour éviter "l'explosion" ---
        for (const tn of tableNames) {
            if (this.draggedTable === tn) continue;
            const pos = this.blockPositions[tn];
            const dx = centerX - pos.x;
            const dy = centerY - pos.y;
            // On applique une force modérée
            this.velocities[tn].vx += dx * this.CENTER_FORCE;
            this.velocities[tn].vy += dy * this.CENTER_FORCE;
        }

        // --- 5) Mise à jour (positions, amortissement, bridage vitesse) ---
        for (const tn of tableNames) {
            if (this.draggedTable === tn) {
                this.velocities[tn].vx = 0;
                this.velocities[tn].vy = 0;
                continue;
            }
            const v = this.velocities[tn];
            // Amortissement
            v.vx *= this.DAMPING;
            v.vy *= this.DAMPING;
            // Limitation de vitesse
            const speed = Math.sqrt(v.vx * v.vx + v.vy * v.vy);
            if (speed > this.MAX_SPEED) {
                const ratio = this.MAX_SPEED / speed;
                v.vx *= ratio;
                v.vy *= ratio;
            }
            // Mise à jour position
            this.blockPositions[tn].x += v.vx;
            this.blockPositions[tn].y += v.vy;
        }
    }

    /**
     * Rayon = moitié de la diagonale du bloc (plié/déplié).
     */
    private getBlockRadius(tableName: string): number {
        const pos = this.blockPositions[tableName];
        const fields = this.fields_by_table_name_and_field_name[tableName] || {};
        const nbFields = Object.keys(fields).length;
        const titleH = 30;
        const fieldH = 20;
        const blockW = 200;
        const blockH = pos.folded ? titleH : titleH + nbFields * fieldH;
        // Diagonale
        const diag = Math.sqrt(blockW * blockW + blockH * blockH);
        return diag / 2;
    }

    private stopLayout() {
        this.isLayoutRunning = false;
        if (this.layoutRequestId) {
            cancelAnimationFrame(this.layoutRequestId);
            this.layoutRequestId = 0;
        }
    }

    private autoFit() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;

        const tableNames = Object.keys(this.tables_by_table_name);
        if (!tableNames.length) return;

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        for (const tn of tableNames) {
            const pos = this.blockPositions[tn];
            const fields = this.fields_by_table_name_and_field_name[tn] || {};
            const nbFields = Object.keys(fields).length;
            const titleH = 30;
            const fieldH = 20;
            const blockW = 200;
            const blockH = pos.folded ? titleH : titleH + nbFields * fieldH;

            minX = Math.min(minX, pos.x);
            maxX = Math.max(maxX, pos.x + blockW);
            minY = Math.min(minY, pos.y);
            maxY = Math.max(maxY, pos.y + blockH);
        }

        if (maxX < minX || maxY < minY) return;

        const margin = 50;
        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;
        if (contentWidth <= 0 || contentHeight <= 0) return;

        const scaleX = (canvas.width - 2 * margin) / contentWidth;
        const scaleY = (canvas.height - 2 * margin) / contentHeight;
        this.scale = Math.min(scaleX, scaleY);

        this.offsetX = margin - minX * this.scale;
        this.offsetY = margin - minY * this.scale;
        this.autoFitEnabled = true;
        this.drawDiagram();
    }

    private drawDiagram() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        this.linkCountMap = {};

        // Liens
        for (const tableName of Object.keys(this.tables_by_table_name)) {
            const fields = this.fields_by_table_name_and_field_name[tableName] || {};
            this.drawLinks(ctx, tableName, fields);
        }

        // Blocs
        for (const tableName of Object.keys(this.tables_by_table_name)) {
            this.drawBlock(ctx, tableName);
        }

        ctx.restore();

        // Bouton Auto-Fit
        if (!this.autoFitEnabled) {
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.fillRect(10, 10, 100, 30);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(10, 10, 100, 30);

            ctx.fillStyle = '#000';
            ctx.font = '14px sans-serif';
            ctx.fillText('Auto-Fit', 25, 30);
            ctx.restore();
        }
    }

    private drawBlock(ctx: CanvasRenderingContext2D, tableName: string) {
        const position = this.blockPositions[tableName];
        const table = this.tables_by_table_name[tableName];
        if (!table) return;

        const blockWidth = 200;
        const titleHeight = 30;
        const fieldHeight = 20;

        const fields = this.fields_by_table_name_and_field_name[tableName] || {};
        const fieldNames = Object.keys(fields);

        const blockHeight = position.folded
            ? titleHeight
            : titleHeight + fieldNames.length * fieldHeight;

        ctx.save();

        // Bloc
        ctx.fillStyle = '#f5f5f5';
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(position.x, position.y, blockWidth, blockHeight);
        ctx.fill();
        ctx.stroke();

        // Titre
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(this.t(table.label.code_text), position.x + 10, position.y + 20);

        // Champs
        if (!position.folded) {
            ctx.font = '12px sans-serif';
            for (let i = 0; i < fieldNames.length; i++) {
                const fname = fieldNames[i];
                const yLine = position.y + titleHeight + i * fieldHeight + 15;

                const isDiscarded = !!this.discarded_field_paths[tableName]?.[fname];
                ctx.fillStyle = isDiscarded ? 'rgba(0,0,0,0.3)' : '#666';
                ctx.fillText(fname, position.x + 20, yLine);
            }
        }

        ctx.restore();
    }

    private drawLinks(
        ctx: CanvasRenderingContext2D,
        tableName: string,
        fields: { [field_name: string]: ModuleTableFieldVO }
    ) {
        const position = this.blockPositions[tableName];
        const blockWidth = 200;
        const titleHeight = 30;
        const fieldHeight = 20;

        for (const [idx, fieldName] of Object.keys(fields).entries()) {
            const field = fields[fieldName];
            if (field.field_type !== ModuleTableFieldVO.FIELD_TYPE_foreign_key || !field.foreign_ref_vo_type) {
                continue;
            }
            const refTableName = field.foreign_ref_vo_type;
            if (!this.tables_by_table_name[refTableName]) continue;

            // Point de départ
            let startX: number, startY: number;
            if (position.folded) {
                startX = position.x + blockWidth / 2;
                startY = position.y + titleHeight / 2;
            } else {
                startX = position.x + blockWidth;
                startY = position.y + titleHeight + idx * fieldHeight + fieldHeight / 2;
            }

            // Point d'arrivée
            const refPos = this.blockPositions[refTableName];
            const refFields = this.fields_by_table_name_and_field_name[refTableName] || {};
            const nbRefFields = Object.keys(refFields).length;
            const refHeight = refPos.folded
                ? titleHeight
                : titleHeight + nbRefFields * fieldHeight;
            const endX = refPos.x + blockWidth / 2;
            const endY = refPos.y + refHeight / 2;

            // Décalage multi-liens
            const linkKey = tableName < refTableName
                ? tableName + '=>' + refTableName
                : refTableName + '=>' + tableName;
            if (!this.linkCountMap[linkKey]) {
                this.linkCountMap[linkKey] = 0;
            }
            const linkIndex = this.linkCountMap[linkKey]++;
            const offset = linkIndex * 5;

            const angle = Math.atan2(endY - startY, endX - startX);
            const offsetX = offset * Math.cos(angle + Math.PI / 2);
            const offsetY = offset * Math.sin(angle + Math.PI / 2);

            const label = this.get_link_label(tableName, fieldName);

            this.drawArrow(
                ctx,
                startX + offsetX,
                startY + offsetY,
                endX + offsetX,
                endY + offsetY,
                label
            );
        }
    }

    private drawArrow(
        ctx: CanvasRenderingContext2D,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        label: string
    ) {
        // Dégradé vert->gris
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, 'green');
        gradient.addColorStop(1, 'gray');

        ctx.save();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -this.dashAnimationOffset;

        // Ligne
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Pointe
        const headlen = 8;
        let angle = Math.atan2(y2 - y1, x2 - x1);

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
            x2 - headlen * Math.cos(angle - Math.PI / 6),
            y2 - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            x2 - headlen * Math.cos(angle + Math.PI / 6),
            y2 - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.lineTo(x2, y2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();

        // Label
        if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
            angle += Math.PI;
        }
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const labelOffset = 10;
        const nx = labelOffset * Math.cos(angle - Math.PI / 2);
        const ny = labelOffset * Math.sin(angle - Math.PI / 2);

        ctx.save();
        ctx.translate(mx + nx, my + ny);
        ctx.rotate(angle);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        ctx.fillText(label, 0, 0);
        ctx.restore();
    }

    private onWheel(e: WheelEvent) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.scale = Math.max(0.05, this.scale + delta);
        this.autoFitEnabled = false;
        this.drawDiagram();
    }

    private onMouseDown(e: MouseEvent) {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Bouton Auto-Fit ?
        if (!this.autoFitEnabled && mouseX >= 10 && mouseX <= 110 && mouseY >= 10 && mouseY <= 40) {
            this.autoFit();
            return;
        }

        // Clic sur bloc ?
        const clickedTable = this.findClickedTable(mouseX, mouseY);
        if (clickedTable) {
            // Toggle fold si pas SHIFT ?
            if (!e.shiftKey) {
                this.blockPositions[clickedTable].folded = !this.blockPositions[clickedTable].folded;
            }
            // Début drag table
            const diagCoords = this.screenToDiagramCoords(mouseX, mouseY);
            this.draggedTable = clickedTable;
            this.dragTableOffsetX = diagCoords.x - this.blockPositions[clickedTable].x;
            this.dragTableOffsetY = diagCoords.y - this.blockPositions[clickedTable].y;
            this.autoFitEnabled = false;
            return;
        }

        // Drag canvas
        this.isDraggingCanvas = true;
        this.dragStartX = mouseX - this.offsetX;
        this.dragStartY = mouseY - this.offsetY;
    }

    private onMouseMove(e: MouseEvent) {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (this.draggedTable) {
            const diagCoords = this.screenToDiagramCoords(mouseX, mouseY);
            this.blockPositions[this.draggedTable].x = diagCoords.x - this.dragTableOffsetX;
            this.blockPositions[this.draggedTable].y = diagCoords.y - this.dragTableOffsetY;
            this.autoFitEnabled = false;
            return;
        }

        if (!this.isDraggingCanvas) return;
        this.offsetX = mouseX - this.dragStartX;
        this.offsetY = mouseY - this.dragStartY;
        this.autoFitEnabled = false;
        this.drawDiagram();
    }

    private onMouseUp() {
        this.isDraggingCanvas = false;
        this.draggedTable = null;
    }

    private findClickedTable(mouseX: number, mouseY: number): string | null {
        const diagCoords = this.screenToDiagramCoords(mouseX, mouseY);
        const xClick = diagCoords.x;
        const yClick = diagCoords.y;
        const blockWidth = 200;

        for (const tableName of Object.keys(this.tables_by_table_name)) {
            const pos = this.blockPositions[tableName];
            const fields = this.fields_by_table_name_and_field_name[tableName] || {};
            const nbFields = Object.keys(fields).length;
            const titleH = 30;
            const fieldH = 20;
            const blockH = pos.folded ? titleH : titleH + nbFields * fieldH;

            if (
                xClick >= pos.x &&
                xClick <= pos.x + blockWidth &&
                yClick >= pos.y &&
                yClick <= pos.y + blockH
            ) {
                return tableName;
            }
        }
        return null;
    }

    private screenToDiagramCoords(screenX: number, screenY: number) {
        return {
            x: (screenX - this.offsetX) / this.scale,
            y: (screenY - this.offsetY) / this.scale,
        };
    }
}
