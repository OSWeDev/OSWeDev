import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleTableFieldVO from '../../../../shared/modules/DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../../../shared/modules/DAO/vos/ModuleTableVO';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './ModuleTablesComponent.scss';
import ModuleTableFieldController from '../../../../shared/modules/DAO/ModuleTableFieldController';

interface LinkDrawInfo {
    table: string;          // table qui porte le champ
    field: string;          // nom du champ
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

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

    @Prop({ default: () => ({}) })
    readonly all_tables_by_table_name!: { [table_name: string]: ModuleTableVO };

    private ctx: CanvasRenderingContext2D | null = null;

    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;

    private isDraggingCanvas: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;

    private draggedTable: string | null = null;
    private dragTableOffsetX: number = 0;
    private dragTableOffsetY: number = 0;

    private mouseDownX: number = 0;
    private mouseDownY: number = 0;
    private hasMovedSinceMouseDown: boolean = false;
    private CLICK_DRAG_THRESHOLD: number = 5;

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
    private adjacency_full: { [tableName: string]: { [fieldName: string]: string } } = {};

    private linkCountMap: { [key: string]: number } = {};

    private isLayoutRunning: boolean = false;
    private layoutRequestId: number = 0;
    private autoFitEnabled: boolean = true;

    private dashAnimationOffset: number = 0;

    private BASE_REPULSION = 10;
    private COLLISION_PUSH = 0.1;
    private SPRING_LENGTH = 150;
    private ATTRACTION_FACTOR = 0.0005;
    private CENTER_FORCE = 0.0001;
    private DAMPING = 0.9;
    private MAX_SPEED = 5;

    // Repérage cycles
    private cycle_tables: Set<string> = new Set();
    private cycle_fields: { [table: string]: Set<string> } = {};
    private cycle_links: { [table: string]: Set<string> } = {};

    // Sélections
    private selectedTable: string | null = null;
    private selectedLink: { table: string; field: string } | null = null;

    // Panneau d'ajout
    private showAddPanel: boolean = false;
    private addSearch: string = '';
    private hideVersioned: boolean = true;

    // On stocke les infos de dessin de chaque lien pour la sélection
    private drawnLinks: LinkDrawInfo[] = [];


    // --------------------------------------------------------------------
    // Panneau sélection
    // --------------------------------------------------------------------
    get foreignKeyFieldsOfSelectedTable(): { [fName: string]: ModuleTableFieldVO } {
        if (!this.selectedTable) return {};
        const all = this.fields_by_table_name_and_field_name[this.selectedTable] || {};
        const res: { [fName: string]: ModuleTableFieldVO } = {};
        for (const [fname, field] of Object.entries(all)) {
            if (field.field_type === ModuleTableFieldVO.FIELD_TYPE_foreign_key) {
                res[fname] = field;
            }
        }
        return res;
    }

    // Panneau ajout
    get filteredTables(): string[] {
        const res: string[] = [];
        const searchLC = (this.addSearch || '').toLowerCase();
        for (const [tn, tVO] of Object.entries(this.all_tables_by_table_name)) {
            if (this.tables_by_table_name[tn]) continue; // déjà dans le graph
            if (this.hideVersioned && this.isVersionedAuxTable(tn)) continue;
            const labelLC = tVO.label?.code_text?.toLowerCase?.() || '';
            if (
                searchLC &&
                !tn.toLowerCase().includes(searchLC) &&
                !labelLC.includes(searchLC)
            ) {
                continue;
            }
            res.push(tn);
        }
        return res.sort();
    }

    private get showPlusButton(): boolean {
        return Object.keys(this.all_tables_by_table_name).some(tn => !this.tables_by_table_name[tn]);
    }

    @Watch('fields_by_table_name_and_field_name', { deep: true })
    @Watch('tables_by_table_name', { deep: true })
    @Watch('discarded_field_paths', { deep: true })
    private onDataChange() {
        this.setupNodesAndEdges();
        this.detectCycles();
        this.startLayout();
        this.autoFit();
    }

    private mounted() {
        this.initCanvas();
        this.setupNodesAndEdges();
        this.detectCycles();
        this.startLayout();
        this.autoFit();

        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        canvas.addEventListener('mousedown', this.onMouseDown);
        canvas.addEventListener('mousemove', this.onMouseMove);
        canvas.addEventListener('mouseup', this.onMouseUp);
        canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
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
        this.offsetX = canvas.width / 2;
        this.offsetY = canvas.height / 2;
        window.addEventListener('resize', this.onResize);
    }

    private onResize() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.offsetX = canvas.width / 2;
        this.offsetY = canvas.height / 2;
        this.drawDiagram();
    }

    // --------------------------------------------------------------------
    // Setup + liens
    // --------------------------------------------------------------------
    private setupNodesAndEdges() {
        const tableNames = Object.keys(this.tables_by_table_name);

        this.adjacency = {};
        this.adjacency_full = {};

        for (const tn of tableNames) {
            this.adjacency[tn] = [];
            this.adjacency_full[tn] = {};
        }

        for (const tn of tableNames) {
            if (!this.blockPositions[tn]) {
                this.blockPositions[tn] = {
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100,
                    folded: true,
                };
            }
            if (!this.velocities[tn]) {
                this.velocities[tn] = { vx: 0, vy: 0 };
            }
        }

        for (const tableName of tableNames) {
            const fields = this.fields_by_table_name_and_field_name[tableName] || {};
            for (const fieldName of Object.keys(fields)) {
                const field = fields[fieldName];
                // On ignore si discard
                if (this.discarded_field_paths[tableName]?.[fieldName]) continue;
                if (field.field_type === ModuleTableFieldVO.FIELD_TYPE_foreign_key && field.foreign_ref_vo_type) {
                    const ref = field.foreign_ref_vo_type;
                    if (ref !== tableName && this.tables_by_table_name[ref]) {
                        this.adjacency[tableName].push(ref);
                        this.adjacency[ref].push(tableName);
                        this.adjacency_full[tableName][fieldName] = ref;
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
                delete this.adjacency_full[oldName];
            }
        }
    }

    private detectCycles() {
        this.cycle_tables.clear();
        this.cycle_fields = {};
        this.cycle_links = {};

        const visited = new Set<string>();
        const parent: { [table: string]: string | null } = {};

        const dfsCycle = (current: string, par: string | null) => {
            visited.add(current);
            for (const neighbor of this.adjacency[current] || []) {
                if (neighbor === par) continue;
                if (!visited.has(neighbor)) {
                    parent[neighbor] = current;
                    dfsCycle(neighbor, current);
                } else if (neighbor !== par) {
                    // cycle
                    const cycleNodes: string[] = [];
                    let x: string | null = current;
                    while (x !== null && x !== neighbor && x in parent) {
                        cycleNodes.push(x);
                        x = parent[x] || null;
                    }
                    cycleNodes.push(neighbor);
                    // marquage
                    for (const node of cycleNodes) {
                        this.cycle_tables.add(node);
                    }
                    for (let i = 0; i < cycleNodes.length; i++) {
                        const A = cycleNodes[i];
                        const B = cycleNodes[(i + 1) % cycleNodes.length];
                        // arcs A->B
                        for (const [fName, ref] of Object.entries(this.adjacency_full[A] || {})) {
                            if (ref === B) {
                                if (!this.cycle_fields[A]) this.cycle_fields[A] = new Set();
                                if (!this.cycle_links[A]) this.cycle_links[A] = new Set();
                                this.cycle_fields[A].add(fName);
                                this.cycle_links[A].add(fName);
                            }
                        }
                        // arcs B->A
                        for (const [fName, ref] of Object.entries(this.adjacency_full[B] || {})) {
                            if (ref === A) {
                                if (!this.cycle_fields[B]) this.cycle_fields[B] = new Set();
                                if (!this.cycle_links[B]) this.cycle_links[B] = new Set();
                                this.cycle_fields[B].add(fName);
                                this.cycle_links[B].add(fName);
                            }
                        }
                    }
                }
            }
        };

        for (const table of Object.keys(this.adjacency)) {
            if (!visited.has(table)) {
                parent[table] = null;
                dfsCycle(table, null);
            }
        }
    }

    private get_link_label(table_name: string, field_name: string): string {
        return this.t(
            ModuleTableFieldController
                .module_table_fields_by_vo_type_and_field_name[table_name][field_name]
                .field_label
                .code_text
        );
    }

    // --------------------------------------------------------------------
    // Simulation
    // --------------------------------------------------------------------
    private startLayout() {
        if (this.isLayoutRunning) return;
        this.isLayoutRunning = true;
        this.layoutLoop();
    }

    private layoutLoop() {
        if (!this.isLayoutRunning) return;
        for (let i = 0; i < 2; i++) {
            this.applyForcesOnce();
        }
        this.dashAnimationOffset += 0.1;
        if (this.autoFitEnabled) {
            this.autoFit();
        }
        this.drawDiagram();
        this.layoutRequestId = requestAnimationFrame(() => this.layoutLoop());
    }

    private stopLayout() {
        this.isLayoutRunning = false;
        if (this.layoutRequestId) {
            cancelAnimationFrame(this.layoutRequestId);
            this.layoutRequestId = 0;
        }
    }

    private applyForcesOnce() {
        const tableNames = Object.keys(this.tables_by_table_name);
        if (!tableNames.length) return;

        // Coulomb
        for (let i = 0; i < tableNames.length; i++) {
            const tA = tableNames[i];
            for (let j = i + 1; j < tableNames.length; j++) {
                const tB = tableNames[j];
                if (this.draggedTable === tA && this.draggedTable === tB) continue;
                const posA = this.blockPositions[tA];
                const posB = this.blockPositions[tB];
                let dx = posB.x - posA.x;
                let dy = posB.y - posA.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                if (dist < 0.1) dist = 0.1;
                const repulsion = this.BASE_REPULSION / dist;
                const fx = (repulsion * dx) / dist;
                const fy = (repulsion * dy) / dist;
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

        // Collision
        for (let i = 0; i < tableNames.length; i++) {
            const tA = tableNames[i];
            const rA = this.getBlockRadius(tA);
            for (let j = i + 1; j < tableNames.length; j++) {
                const tB = tableNames[j];
                if (this.draggedTable === tA && this.draggedTable === tB) continue;
                const rB = this.getBlockRadius(tB);
                const posA = this.blockPositions[tA];
                const posB = this.blockPositions[tB];
                const dx = posB.x - posA.x;
                const dy = posB.y - posA.y;
                const dist = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
                const minDist = rA + rB;
                if (dist < minDist) {
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

        // Ressorts
        for (const source of tableNames) {
            const neighbors = this.adjacency[source];
            for (const target of neighbors) {
                if (target <= source) continue;
                if (this.draggedTable === source || this.draggedTable === target) continue;
                const sPos = this.blockPositions[source];
                const tPos = this.blockPositions[target];
                const dx = tPos.x - sPos.x;
                const dy = tPos.y - sPos.y;
                const dist = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
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

        // Centre
        for (const tn of tableNames) {
            if (this.draggedTable === tn) continue;
            const pos = this.blockPositions[tn];
            const dx = -pos.x;
            const dy = -pos.y;
            this.velocities[tn].vx += dx * this.CENTER_FORCE;
            this.velocities[tn].vy += dy * this.CENTER_FORCE;
        }

        // Maj
        for (const tn of tableNames) {
            if (this.draggedTable === tn) {
                this.velocities[tn].vx = 0;
                this.velocities[tn].vy = 0;
                continue;
            }
            const v = this.velocities[tn];
            v.vx *= this.DAMPING;
            v.vy *= this.DAMPING;
            const speed = Math.sqrt(v.vx * v.vx + v.vy * v.vy);
            if (speed > this.MAX_SPEED) {
                const ratio = this.MAX_SPEED / speed;
                v.vx *= ratio;
                v.vy *= ratio;
            }
            this.blockPositions[tn].x += v.vx;
            this.blockPositions[tn].y += v.vy;
        }
    }

    private getBlockRadius(tableName: string): number {
        const pos = this.blockPositions[tableName];
        const fields = this.fields_by_table_name_and_field_name[tableName] || {};
        const nbFields = Object.keys(fields).length;
        const titleH = 30;
        const fieldH = 20;
        const blockW = 200;
        const blockH = pos.folded ? titleH : titleH + nbFields * fieldH;
        return Math.sqrt(blockW * blockW + blockH * blockH) / 2;
    }

    // --------------------------------------------------------------------
    // Auto-Fit
    // --------------------------------------------------------------------
    private autoFit() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;
        const tables = Object.keys(this.tables_by_table_name);
        if (!tables.length) return;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const tn of tables) {
            const p = this.blockPositions[tn];
            const f = this.fields_by_table_name_and_field_name[tn] || {};
            const n = Object.keys(f).length;
            const bh = p.folded ? 30 : 30 + n * 20;
            const bw = 200;
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x + bw);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y + bh);
        }
        if (maxX < minX || maxY < minY) return;

        const centerBx = (minX + maxX) / 2;
        const centerBy = (minY + maxY) / 2;
        const dx = -centerBx;
        const dy = -centerBy;

        for (const tn of tables) {
            this.blockPositions[tn].x += dx;
            this.blockPositions[tn].y += dy;
        }

        const newMinX = minX + dx;
        const newMaxX = maxX + dx;
        const newMinY = minY + dy;
        const newMaxY = maxY + dy;

        const contentW = newMaxX - newMinX;
        const contentH = newMaxY - newMinY;
        if (contentW < 1 || contentH < 1) return;

        const margin = 50;
        const scaleX = (canvas.width - 2 * margin) / contentW;
        const scaleY = (canvas.height - 2 * margin) / contentH;
        this.scale = Math.min(scaleX, scaleY);

        this.offsetX = canvas.width / 2;
        this.offsetY = canvas.height / 2;
        this.autoFitEnabled = true;
        this.drawDiagram();
    }

    // --------------------------------------------------------------------
    // Dessin
    // --------------------------------------------------------------------
    private drawDiagram() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        this.linkCountMap = {};
        this.drawnLinks = []; // réinitialise la liste des liens dessinés

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
        this.drawUIOverlays(ctx, canvas);
    }

    private drawBlock(ctx: CanvasRenderingContext2D, tableName: string) {
        const p = this.blockPositions[tableName];
        const table = this.tables_by_table_name[tableName];
        if (!table) return;

        const w = 200;
        const titleH = 30;
        const fields = this.fields_by_table_name_and_field_name[tableName] || {};
        const n = Object.keys(fields).length;
        const blockH = p.folded ? titleH : titleH + n * 20;

        // Couleur si cycle
        const inCycle = this.cycle_tables.has(tableName);
        const isSelected = (this.selectedTable === tableName);

        ctx.save();
        ctx.fillStyle = inCycle ? 'rgba(255, 0, 0, 0.15)' : 'rgba(245, 245, 245, 0.8)';
        ctx.strokeStyle = isSelected ? '#00f' : (inCycle ? 'red' : '#444');
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.beginPath();
        ctx.rect(p.x, p.y, w, blockH);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(this.t(table.label.code_text), p.x + 10, p.y + 20);

        if (!p.folded) {
            ctx.font = '12px sans-serif';
            const names = Object.keys(fields);
            for (let i = 0; i < names.length; i++) {
                const fname = names[i];
                const yLine = p.y + titleH + i * 20 + 15;
                const isDiscarded = !!this.discarded_field_paths[tableName]?.[fname];
                const fieldInCycle = this.cycle_fields[tableName]?.has(fname);

                if (fieldInCycle) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
                    ctx.fillRect(p.x, p.y + titleH + i * 20, w, 20);
                    ctx.restore();
                }
                ctx.fillStyle = isDiscarded ? 'rgba(0,0,0,0.3)' : '#666';
                ctx.fillText(fname, p.x + 20, yLine);
            }
        }
        ctx.restore();
    }

    private drawLinks(
        ctx: CanvasRenderingContext2D,
        tableName: string,
        fields: { [name: string]: ModuleTableFieldVO }
    ) {
        const p = this.blockPositions[tableName];
        const w = 200;
        const titleH = 30;
        const fieldH = 20;

        const fieldNames = Object.keys(fields);
        for (let idx = 0; idx < fieldNames.length; idx++) {
            const fieldName = fieldNames[idx];
            const f = fields[fieldName];
            if (f.field_type !== ModuleTableFieldVO.FIELD_TYPE_foreign_key || !f.foreign_ref_vo_type) {
                continue;
            }
            // if (this.discarded_field_paths[tableName]?.[fieldName]) continue; // discard
            const ref = f.foreign_ref_vo_type;
            if (!this.tables_by_table_name[ref]) continue;
            if (ref === tableName) continue;

            let startX: number, startY: number;
            if (p.folded) {
                // on fait un point sur le bloc
                startX = p.x + w / 2;
                startY = p.y + titleH / 2;
            } else {
                startX = p.x + w;
                startY = p.y + titleH + idx * fieldH + fieldH / 2;
            }

            const refPos = this.blockPositions[ref];
            const refFields = this.fields_by_table_name_and_field_name[ref] || {};
            const nbRef = Object.keys(refFields).length;
            const refH = refPos.folded ? titleH : titleH + nbRef * fieldH;
            const endX = refPos.x + w / 2;
            const endY = refPos.y + refH / 2;

            const linkKey = tableName < ref ? tableName + '=>' + ref : ref + '=>' + tableName;
            if (!this.linkCountMap[linkKey]) {
                this.linkCountMap[linkKey] = 0;
            }
            const linkIndex = this.linkCountMap[linkKey]++;
            const offset = linkIndex * 5;
            const angle = Math.atan2(endY - startY, endX - startX);
            const offsetX = offset * Math.cos(angle + Math.PI / 2);
            const offsetY = offset * Math.sin(angle + Math.PI / 2);

            const label = this.get_link_label(tableName, fieldName);
            const isDiscarded = !!this.discarded_field_paths[tableName]?.[fieldName];
            const isInCycle = this.cycle_links[tableName]?.has(fieldName);

            // On dessine TOUTES les liaisons en courbe
            // => contournement forcé
            this.drawCurvedArrow(
                ctx,
                startX + offsetX,
                startY + offsetY,
                endX + offsetX,
                endY + offsetY,
                label,
                isDiscarded,
                isInCycle,
                true // courbe
            );

            // On stocke l'info pour la sélection de lien
            this.drawnLinks.push({
                table: tableName,
                field: fieldName,
                startX: startX + offsetX,
                startY: startY + offsetY,
                endX: endX + offsetX,
                endY: endY + offsetY,
            });
        }
    }

    private drawCurvedArrow(
        ctx: CanvasRenderingContext2D,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        label: string,
        isDiscarded: boolean,
        isInCycle: boolean,
        forceCurve: boolean
    ) {
        ctx.save();
        // Si ce lien est sélectionné, on l'affiche en bleu
        const isSelectedLink =
            this.selectedLink &&
            this.selectedLink.field &&
            label === this.get_link_label(this.selectedLink.table, this.selectedLink.field);

        if (isSelectedLink) {
            ctx.strokeStyle = '#00f';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
        } else {
            if (isDiscarded) {
                ctx.globalAlpha = 0.3;
            }
            let strokeColor = isInCycle ? 'red' : 'gray';
            if (!isDiscarded && !isInCycle) {
                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, 'green');
                gradient.addColorStop(1, 'gray');
                ctx.strokeStyle = gradient;
            } else {
                ctx.strokeStyle = strokeColor;
            }
            ctx.setLineDash([8, 6]);
            if (!isDiscarded) {
                ctx.lineDashOffset = -this.dashAnimationOffset;
            }
            ctx.lineWidth = 2;
        }

        ctx.beginPath();
        ctx.moveTo(x1, y1);

        // Quadratic
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const ctrlOffset = 40;
        const cx = mx + ctrlOffset * Math.cos(angle - Math.PI / 2);
        const cy = my + ctrlOffset * Math.sin(angle - Math.PI / 2);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();

        // Flèche
        let a = Math.atan2(y2 - y1, x2 - x1);
        const headlen = 8;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
            x2 - headlen * Math.cos(a - Math.PI / 6),
            y2 - headlen * Math.sin(a - Math.PI / 6)
        );
        ctx.lineTo(
            x2 - headlen * Math.cos(a + Math.PI / 6),
            y2 - headlen * Math.sin(a + Math.PI / 6)
        );
        ctx.lineTo(x2, y2);
        if (isSelectedLink) {
            ctx.fillStyle = '#00f';
        } else {
            ctx.fillStyle = isInCycle ? 'red' : (ctx.strokeStyle as string);
        }
        ctx.fill();
        ctx.restore();

        // Label
        if (a > Math.PI / 2 || a < -Math.PI / 2) {
            a += Math.PI;
        }
        const labelOffset = 10;
        const nx = labelOffset * Math.cos(a - Math.PI / 2);
        const ny = labelOffset * Math.sin(a - Math.PI / 2);
        const mx2 = (x1 + x2) / 2;
        const my2 = (y1 + y2) / 2;

        ctx.save();
        if (isDiscarded && !isSelectedLink) {
            ctx.globalAlpha = 0.3;
        }
        ctx.translate(mx2 + nx, my2 + ny);
        ctx.rotate(a);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        ctx.fillText(label, 0, 0);
        ctx.restore();
    }

    private drawUIOverlays(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
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

        // Bouton "+"
        if (this.showPlusButton) {
            ctx.save();
            const btnX = canvas.width - 40;
            const btnY = 10;
            ctx.fillStyle = '#fff';
            ctx.fillRect(btnX, btnY, 30, 30);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(btnX, btnY, 30, 30);
            ctx.fillStyle = '#000';
            ctx.font = '20px sans-serif';
            ctx.fillText('+', btnX + 8, btnY + 22);
            ctx.restore();
        }
    }

    // --------------------------------------------------------------------
    // Souris
    // --------------------------------------------------------------------
    private onWheel(e: WheelEvent) {
        e.preventDefault();
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const diagBefore = this.screenToDiagramCoords(mouseX, mouseY);
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newScale = Math.max(0.05, this.scale + delta);
        this.scale = newScale;
        const diagAfter = this.screenToDiagramCoords(mouseX, mouseY);
        const dx = diagAfter.x - diagBefore.x;
        const dy = diagAfter.y - diagBefore.y;
        this.offsetX += dx * this.scale;
        this.offsetY += dy * this.scale;
        this.autoFitEnabled = false;
        this.drawDiagram();
    }

    private onMouseDown(e: MouseEvent) {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        this.mouseDownX = mouseX;
        this.mouseDownY = mouseY;
        this.hasMovedSinceMouseDown = false;

        // Auto-Fit button
        if (!this.autoFitEnabled && mouseX >= 10 && mouseX <= 110 && mouseY >= 10 && mouseY <= 40) {
            this.autoFit();
            return;
        }

        // Bouton "+"
        if (this.showPlusButton) {
            const plusX = canvas.width - 40;
            const plusY = 10;
            if (mouseX >= plusX && mouseX <= plusX + 30 && mouseY >= plusY && mouseY <= plusY + 30) {
                this.showAddPanel = !this.showAddPanel;
                return;
            }
        }

        // Cherche si on clique une table
        const clickedTable = this.findClickedTable(mouseX, mouseY);
        if (clickedTable) {
            const diagCoords = this.screenToDiagramCoords(mouseX, mouseY);
            this.draggedTable = clickedTable;
            this.dragTableOffsetX = diagCoords.x - this.blockPositions[clickedTable].x;
            this.dragTableOffsetY = diagCoords.y - this.blockPositions[clickedTable].y;
            this.autoFitEnabled = false;

            // On reset la sélection du lien
            this.selectedLink = null;
            return;
        }

        // Sinon, cherche si on clique un lien
        const clickedLink = this.findClickedLink(mouseX, mouseY);
        if (clickedLink) {
            this.selectedLink = clickedLink;
            // On reset la sélection table
            this.selectedTable = null;
            return;
        }

        // Sinon drag canvas
        this.isDraggingCanvas = true;
        this.dragStartX = mouseX - this.offsetX;
        this.dragStartY = mouseY - this.offsetY;
    }

    private onMouseMove(e: MouseEvent) {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const distX = mouseX - this.mouseDownX;
        const distY = mouseY - this.mouseDownY;
        if (Math.abs(distX) > this.CLICK_DRAG_THRESHOLD || Math.abs(distY) > this.CLICK_DRAG_THRESHOLD) {
            this.hasMovedSinceMouseDown = true;
        }

        if (this.draggedTable) {
            const diagCoords = this.screenToDiagramCoords(mouseX, mouseY);
            this.blockPositions[this.draggedTable].x = diagCoords.x - this.dragTableOffsetX;
            this.blockPositions[this.draggedTable].y = diagCoords.y - this.dragTableOffsetY;
            this.autoFitEnabled = false;
            return;
        }

        if (this.isDraggingCanvas) {
            this.offsetX = mouseX - this.dragStartX;
            this.offsetY = mouseY - this.dragStartY;
            this.autoFitEnabled = false;
            this.drawDiagram();
        }
    }

    private onMouseUp(e: MouseEvent) {
        if (this.draggedTable) {
            if (!this.hasMovedSinceMouseDown) {
                // clique => sélection table
                if (this.selectedTable === this.draggedTable) {
                    // toggle fold
                    this.blockPositions[this.draggedTable].folded = !this.blockPositions[this.draggedTable].folded;
                } else {
                    this.selectedTable = this.draggedTable;
                    this.selectedLink = null;
                }
            }
        }
        this.isDraggingCanvas = false;
        this.draggedTable = null;
    }

    private findClickedTable(mouseX: number, mouseY: number): string | null {
        const diag = this.screenToDiagramCoords(mouseX, mouseY);
        const xClick = diag.x;
        const yClick = diag.y;
        for (const tn of Object.keys(this.tables_by_table_name)) {
            const p = this.blockPositions[tn];
            const fields = this.fields_by_table_name_and_field_name[tn] || {};
            const nb = Object.keys(fields).length;
            const h = p.folded ? 30 : 30 + nb * 20;
            const w = 200;
            if (
                xClick >= p.x &&
                xClick <= p.x + w &&
                yClick >= p.y &&
                yClick <= p.y + h
            ) {
                return tn;
            }
        }
        return null;
    }

    private findClickedLink(mouseX: number, mouseY: number): { table: string; field: string } | null {
        // On fait un simple test de distance au segment (ou au midpoint)
        const diag = this.screenToDiagramCoords(mouseX, mouseY);
        for (const link of this.drawnLinks) {
            const dist = this.pointToSegmentDistance(diag.x, diag.y, link.startX, link.startY, link.endX, link.endY);
            if (dist < 10) {
                return { table: link.table, field: link.field };
            }
        }
        return null;
    }

    private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        // Projection du point (px,py) sur le segment (x1,y1)->(x2,y2)
        const dx = x2 - x1;
        const dy = y2 - y1;
        if (dx === 0 && dy === 0) {
            return Math.hypot(px - x1, py - y1);
        }
        const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
        if (t < 0) {
            return Math.hypot(px - x1, py - y1);
        } else if (t > 1) {
            return Math.hypot(px - x2, py - y2);
        }
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        return Math.hypot(px - projX, py - projY);
    }

    private screenToDiagramCoords(sx: number, sy: number): { x: number; y: number } {
        return {
            x: (sx - this.offsetX) / this.scale,
            y: (sy - this.offsetY) / this.scale,
        };
    }

    private isVersionedAuxTable(tn: string): boolean {
        const vo = this.all_tables_by_table_name[tn];
        if (!vo) return false;
        if (!vo.is_versioned) return false;
        if (tn.startsWith('versioned__') || tn.startsWith('trashed__')) {
            return true;
        }
        return false;
    }

    // --------------------------------------------------------------------
    // Actions
    // --------------------------------------------------------------------
    private onRemoveSelectedTable() {
        if (!this.selectedTable) return;
        this.$emit('removeTable', this.selectedTable);
        this.selectedTable = null;
    }

    private onAddTable(tn: string) {
        this.$emit('addTable', tn);
    }

    /**
     * Sur le switch, newIsActive = true => on enlève le discard
     */
    private onSwitchDiscard(table: string, field: string, newIsActive: boolean) {
        const new_discard = !newIsActive;
        this.$emit('setDiscardedField', table, field, new_discard);
    }
}
