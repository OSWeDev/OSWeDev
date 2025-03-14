import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import OseliaRunTemplateVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';


interface LinkDrawInfo {
    sourceItemId: string;
    targetItemId: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

@Component({
    /**
     * On suppose que vous utilisez Pug pour le template.
     * Exemple minimal :
     *
     * template: require('./CanvasDiagram.pug'),
     *
     * Dans votre CanvasDiagram.pug, vous devez avoir au moins :
     *
     * canvas.diagram-canvas(ref="diagramCanvas")
     *
     * pour que le composant puisse accéder à this.$refs.diagramCanvas.
     */
    template: require('./CanvasDiagram.pug'),
})
export default class CanvasDiagram extends Vue {

    /**
     * Liste de vos items, indexés par leur id (sous forme de string).
     * On suppose que l'id numérique est converti en string en tant que clé.
     */
    @Prop({ default: () => ({}) })
    readonly items!: { [id: string]: OseliaRunTemplateVO };

    /**
     * ID de l'item actuellement sélectionné (ou null).
     * Vous pouvez le recevoir en prop ou le gérer en local, selon vos besoins.
     */
    @Prop({ default: null })
    private selectedItem!: string | null;

    // -- CONTEXTE CANVAS
    private ctx: CanvasRenderingContext2D | null = null;

    // -- PARAMÈTRES D'AFFICHAGE
    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;

    // -- DRAG CANVAS
    private isDraggingCanvas: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;

    // -- DRAG ITEM
    private draggedItemId: string | null = null;
    private dragItemOffsetX: number = 0;
    private dragItemOffsetY: number = 0;

    // -- GESTION DU CLIC VS DRAG
    private mouseDownX: number = 0;
    private mouseDownY: number = 0;
    private hasMovedSinceMouseDown: boolean = false;
    private CLICK_DRAG_THRESHOLD: number = 5;

    // -- POSITIONS ET VITESSES DE CHAQUE ITEM (pour la simulation)
    private blockPositions: {
        [itemId: string]: {
            x: number;
            y: number;
            folded: boolean;
        };
    } = {};

    private velocities: {
        [itemId: string]: { vx: number; vy: number };
    } = {};

    // -- ADJACENCE (les liens entre items)
    private adjacency: { [itemId: string]: string[] } = {};

    // -- DÉTECTION DE CYCLES
    private cycle_items: Set<string> = new Set();

    // -- GESTION DU LAYOUT
    private isLayoutRunning: boolean = false;
    private layoutRequestId: number = 0;
    private autoFitEnabled: boolean = true;

    // -- PARAMÈTRES DE PHYSIQUE
    private dashAnimationOffset: number = 0;
    private BASE_REPULSION = 3;
    private COLLISION_PUSH = 0.3;
    private SPRING_LENGTH = 200;
    private ATTRACTION_FACTOR = 0.0005;
    private CENTER_FORCE = 0.0001;
    private DAMPING = 0.95;
    private MAX_SPEED = 5;

    // -- LISTE DES LIENS DESSINÉS (pour gérer le clic sur un lien si besoin)
    private drawnLinks: LinkDrawInfo[] = [];

    // -- WATCHERS
    @Watch('items', { deep: true, immediate: true })
    private onItemsChange() {
        this.setupNodesAndEdges();
        this.detectCycles();
        this.startLayout();
        this.autoFit();
    }

    // -- HOOKS VUE
    mounted() {
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

    beforeDestroy() {
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

    // -- MÉTHODES D'INITIALISATION
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

    /**
     * Construire la liste des noeuds (items) et les arêtes (adjacency).
     * Dans cet exemple, on considère 2 types de lien :
     *  1. parent_run_id (si un item pointe vers un parent)
     *  2. for_each_element_run_template_id (si un item pointe vers un template enfant)
     *
     * À vous d’ajouter/modifier selon vos besoins (run_type, assistant_id, etc.).
     */
    private setupNodesAndEdges() {
        this.adjacency = {};

        // Initialiser adjacency + positions pour chaque item
        for (const itemId of Object.keys(this.items)) {
            if (!this.adjacency[itemId]) {
                this.adjacency[itemId] = [];
            }
            if (!this.blockPositions[itemId]) {
                this.blockPositions[itemId] = {
                    x: Math.random() * 200 - 100,
                    y: Math.random() * 200 - 100,
                    folded: true,
                };
            }
            if (!this.velocities[itemId]) {
                this.velocities[itemId] = { vx: 0, vy: 0 };
            }
        }

        // Construire l’adjacence d’après parent_run_id et for_each_element_run_template_id
        for (const itemId of Object.keys(this.items)) {
            const item = this.items[itemId];
            // 1) parent_run_id => itemId
            if (item.parent_run_id) {
                const parentId = String(item.parent_run_id);
                if (this.items[parentId] && parentId !== itemId) {
                    this.adjacency[itemId].push(parentId);
                    this.adjacency[parentId].push(itemId);
                }
            }
            // 2) for_each_element_run_template_id => itemId
            if (item.for_each_element_run_template_id) {
                const childId = String(item.for_each_element_run_template_id);
                if (this.items[childId] && childId !== itemId) {
                    this.adjacency[itemId].push(childId);
                    this.adjacency[childId].push(itemId);
                }
            }
        }

        // Nettoyage : enlever les infos des items disparus
        for (const oldId of Object.keys(this.blockPositions)) {
            if (!this.items[oldId]) {
                delete this.blockPositions[oldId];
                delete this.velocities[oldId];
                delete this.adjacency[oldId];
            }
        }
    }

    /**
     * Détecter les cycles dans le graphe (DFS).
     * On stocke les items dans un Set `cycle_items` pour repérer ceux faisant partie de cycles.
     */
    private detectCycles() {
        this.cycle_items.clear();
        const visited = new Set<string>();
        const parent: { [itemId: string]: string | null } = {};

        const dfsCycle = (current: string, par: string | null) => {
            visited.add(current);
            for (const neighbor of this.adjacency[current] || []) {
                if (neighbor === par) continue;
                if (!visited.has(neighbor)) {
                    parent[neighbor] = current;
                    dfsCycle(neighbor, current);
                } else if (neighbor !== par) {
                    // Cycle détecté
                    const cycleNodes: string[] = [];
                    let x: string | null = current;
                    while (x !== null && x !== neighbor && x in parent) {
                        cycleNodes.push(x);
                        x = parent[x] || null;
                    }
                    cycleNodes.push(neighbor);
                    for (const node of cycleNodes) {
                        this.cycle_items.add(node);
                    }
                }
            }
        };

        for (const itemId of Object.keys(this.adjacency)) {
            if (!visited.has(itemId)) {
                parent[itemId] = null;
                dfsCycle(itemId, null);
            }
        }
    }

    // -- LAYOUT / PHYSICS
    private startLayout() {
        if (this.isLayoutRunning) return;
        this.isLayoutRunning = true;
        this.layoutLoop();
    }

    private layoutLoop() {
        if (!this.isLayoutRunning) return;
        // Ajuster le nombre d’itérations par frame si besoin

        if (Object.values(this.items).length != Object.values(this.blockPositions).length) {
            this.setupNodesAndEdges();
        }
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

    /**
     * Application des forces (répulsion, attraction, collision, etc.).
     */
    private applyForcesOnce() {
        const itemIds = Object.keys(this.items);
        if (!itemIds.length) return;

        // Coulomb (répulsion)
        for (let i = 0; i < itemIds.length; i++) {
            const A = itemIds[i];
            if (!this.blockPositions[A]) {
                continue;
            }
            for (let j = i + 1; j < itemIds.length; j++) {
                const B = itemIds[j];
                if (!this.blockPositions[B]) {
                    continue;
                }
                if (this.draggedItemId === A && this.draggedItemId === B) continue;
                const posA = this.blockPositions[A];
                const posB = this.blockPositions[B];
                const dx = posB.x - posA.x;
                const dy = posB.y - posA.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                if (dist < 0.1) dist = 0.1;
                const repulsion = this.BASE_REPULSION / dist;
                const fx = (repulsion * dx) / dist;
                const fy = (repulsion * dy) / dist;
                if (this.draggedItemId !== A) {
                    this.velocities[A].vx -= fx;
                    this.velocities[A].vy -= fy;
                }
                if (this.draggedItemId !== B) {
                    this.velocities[B].vx += fx;
                    this.velocities[B].vy += fy;
                }
            }
        }

        // Collision
        for (let i = 0; i < itemIds.length; i++) {
            const A = itemIds[i];
            if (!this.blockPositions[A]) {
                continue;
            }
            const rA = this.getBlockRadius(A);
            for (let j = i + 1; j < itemIds.length; j++) {
                const B = itemIds[j];
                if (!this.blockPositions[B]) {
                    continue;
                }
                if (this.draggedItemId === A && this.draggedItemId === B) continue;
                const rB = this.getBlockRadius(B);
                const posA = this.blockPositions[A];
                const posB = this.blockPositions[B];
                const dx = posB.x - posA.x;
                const dy = posB.y - posA.y;
                const dist = Math.max(0.1, Math.sqrt(dx * dx + dy * dy));
                const minDist = rA + rB;
                if (dist < minDist) {
                    const overlap = (minDist - dist) / minDist;
                    const force = overlap * this.COLLISION_PUSH;
                    const fx = (force * dx) / dist;
                    const fy = (force * dy) / dist;
                    if (this.draggedItemId !== A) {
                        this.velocities[A].vx -= fx;
                        this.velocities[A].vy -= fy;
                    }
                    if (this.draggedItemId !== B) {
                        this.velocities[B].vx += fx;
                        this.velocities[B].vy += fy;
                    }
                }
            }
        }

        // Ressorts (pour items liés)
        for (const source of itemIds) {
            if (!this.blockPositions[source]) {
                continue;
            }
            const neighbors = this.adjacency[source] || [];
            for (const target of neighbors) {
                // Pour éviter de doubler le lien source->target et target->source
                if (target <= source) continue;
                if (this.draggedItemId === source || this.draggedItemId === target) continue;
                if (!this.blockPositions[target]) {
                    continue;
                }
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

        // Force de rappel vers le centre
        for (const id of itemIds) {
            if (!this.blockPositions[id]) {
                continue;
            }
            if (this.draggedItemId === id) {
                this.velocities[id].vx = 0;
                this.velocities[id].vy = 0;
                continue;
            }
            const pos = this.blockPositions[id];
            const dx = -pos.x;
            const dy = -pos.y;
            this.velocities[id].vx += dx * this.CENTER_FORCE;
            this.velocities[id].vy += dy * this.CENTER_FORCE;
        }

        // Mise à jour des positions
        for (const id of itemIds) {
            if (!this.blockPositions[id]) {
                continue;
            }
            if (this.draggedItemId === id) {
                this.velocities[id].vx = 0;
                this.velocities[id].vy = 0;
                continue;
            }
            const v = this.velocities[id];
            v.vx *= this.DAMPING;
            v.vy *= this.DAMPING;
            const speed = Math.sqrt(v.vx * v.vx + v.vy * v.vy);
            if (speed > this.MAX_SPEED) {
                const ratio = this.MAX_SPEED / speed;
                v.vx *= ratio;
                v.vy *= ratio;
            }
            this.blockPositions[id].x += v.vx;
            this.blockPositions[id].y += v.vy;
        }
    }

    private getBlockRadius(itemId: string): number {
        const pos = this.blockPositions[itemId];
        // Exemple de dimensions simplifiées
        const blockW = 200;
        const blockH = pos.folded ? 30 : 70;
        return Math.sqrt(blockW * blockW + blockH * blockH) / 2;
    }

    private autoFit() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;
        const itemIds = Object.keys(this.items);
        if (!itemIds.length) return;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const id of itemIds) {
            const p = this.blockPositions[id];
            const bh = p.folded ? 30 : 70;
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

        for (const id of itemIds) {
            this.blockPositions[id].x += dx;
            this.blockPositions[id].y += dy;
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

    // -- RENDU
    private drawDiagram() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        this.drawnLinks = [];


        // Dessiner d'abord les liens
        for (const itemId of Object.keys(this.items)) {
            this.drawLinks(ctx, itemId);
        }

        // Dessiner les blocs
        for (const itemId of Object.keys(this.items)) {
            this.drawBlock(ctx, itemId);
        }

        ctx.restore();
        this.drawUIOverlays(ctx, canvas);
    }

    private drawBlock(ctx: CanvasRenderingContext2D, itemId: string) {
        const item = this.items[itemId];
        const p = this.blockPositions[itemId];
        const patternCanvas = document.createElement("canvas");
        patternCanvas.width = 20;
        patternCanvas.height = 20;
        const patternCtx = patternCanvas.getContext("2d");

        // Dimensions simplifiées
        const w = 200;
        const titleH = 30;
        const blockH = p.folded ? titleH : 70;

        // Déterminer le type
        const isAssistant = (item.run_type === 0);
        const isForeach = (item.run_type === 1);
        const isParent = (item.parent_run_id == null);

        // État "en cycle" ou "sélectionné"
        const inCycle = this.cycle_items.has(itemId);
        const isSelected = (this.selectedItem === itemId);

        // Couleur de fond selon le type
        //  - assistant: vert
        //  - foreach: orange
        let fillColor = isAssistant ? 'rgba(144, 238, 144, 0.8)' : 'rgba(255, 165, 0, 0.8)'; // vert ou orange
        if (inCycle) {
            // Si l'item est dans un cycle, on fonce un peu la couleur (exemple)
            fillColor = isAssistant ? 'rgba(60, 179, 113, 0.4)' : 'rgba(255, 140, 0, 0.4)';
        }

        // Couleur et épaisseur du contour (stroke)
        let strokeColor = inCycle ? 'red' : '#444';
        if (isSelected) {
            strokeColor = '#00f'; // bleu si sélectionné
        }

        // Sauvegarde du contexte pour ne pas polluer
        ctx.save();
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeStyle = strokeColor;


        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.rect(p.x, p.y, w, blockH);
        ctx.fill();

        if (isParent) {
            if (patternCtx) {
                // Dessin du pattern en grille (diagonales croisées)
                patternCtx.strokeStyle = "black";
                patternCtx.lineWidth = 1;

                patternCtx.beginPath();
                patternCtx.moveTo(0, 0);
                patternCtx.lineTo(20, 20);
                patternCtx.moveTo(20, 0);
                patternCtx.lineTo(0, 20);
                patternCtx.stroke();

                // Création du pattern
                const pattern = ctx.createPattern(patternCanvas, "repeat");

                if (pattern) {
                    // Application du pattern par-dessus
                    ctx.fillStyle = pattern;
                }
            }
        }
        ctx.fill();

        ctx.stroke();

        // Écriture du titre
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px sans-serif';

        // Coordonnées de texte : on le place dans le bloc ou le losange
        // Pour un rectangle => p.x + 10, p.y + 20
        // Pour un losange => on se base aussi sur p.x + 10, p.y + 20, c’est simple
        //   (sachant qu'on a fait un "losange" centré, on peut ajuster si besoin)
        let textPosX = p.x + 10;
        let textPosY = p.y + 20;

        // Si on est en foreach (losange), le "haut" du bloc est p.y, le centre horizontal est p.x + w/2
        // On va plutôt écrire le titre un peu plus au centre horizontal :
        if (isForeach) {
            textPosX = p.x + (w / 2) - 40; // ajustez à votre goût
            textPosY = p.y + 20;
        }

        // Titre principal
        ctx.fillText(item.template_name || `Item ${item.id}`, textPosX, textPosY);

        // Informations supplémentaires si unfolded
        if (!p.folded) {
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#666';

            let lineY = textPosY + 20;
            ctx.fillText(`Étape: ${item.name || 'N/A'}`, textPosX, lineY);

            // Si on veut rappeler le type dans le texte
            lineY += 15;
            const typeLabel = isAssistant ? 'Assistant' : 'Foreach';
            ctx.fillText(`Type: ${typeLabel}`, textPosX, lineY);
            lineY += 5;
        }

        ctx.restore();
    }


    /**
     * Dessiner les liens à partir de itemId vers ses « voisins » (adjacency).
     */
    private drawLinks(ctx: CanvasRenderingContext2D, itemId: string) {
        const p = this.blockPositions[itemId];
        if (!p) return;
        // Coordonnées de départ
        const startX = p.x + 100;   // milieu horizontal du bloc
        const startY = p.y + (p.folded ? 15 : 35); // un peu plus bas s'il est unfold

        const neighbors = this.adjacency[itemId] || [];
        for (const neighborId of neighbors) {
            // Pour éviter de dessiner 2 fois
            if (neighborId < itemId) continue;

            const np = this.blockPositions[neighborId];
            if (!np) continue;
            const endX = np.x + 100;
            const endY = np.y + (np.folded ? 15 : 35);

            this.drawSegmentArrow(ctx, startX, startY, endX, endY, itemId, neighborId);
        }
    }

    /**
     * Dessin d'une flèche (ou d'un segment) entre deux points.
     */
    private drawSegmentArrow(
        ctx: CanvasRenderingContext2D,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        sourceId: string,
        targetId: string
    ) {
        ctx.save();
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -this.dashAnimationOffset;
        ctx.strokeStyle = 'gray';
        ctx.lineWidth = 2;

        // Segment
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Flèche
        const a = Math.atan2(y2 - y1, x2 - x1);
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
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();

        ctx.restore();

        // Si on veut détecter le clic sur ce lien, on stocke la géométrie
        this.drawnLinks.push({
            sourceItemId: sourceId,
            targetItemId: targetId,
            startX: x1,
            startY: y1,
            endX: x2,
            endY: y2,
        });
    }

    private drawUIOverlays(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
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

    // -- INTERACTIONS SOURIS
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

        // Bouton Auto-Fit
        if (!this.autoFitEnabled && mouseX >= 10 && mouseX <= 110 && mouseY >= 10 && mouseY <= 40) {
            this.autoFit();
            return;
        }

        // Vérifier s'il y a un item cliqué
        const clickedItem = this.findClickedItem(mouseX, mouseY);
        if (clickedItem) {
            const diagCoords = this.screenToDiagramCoords(mouseX, mouseY);
            this.draggedItemId = clickedItem;
            this.dragItemOffsetX = diagCoords.x - this.blockPositions[clickedItem].x;
            this.dragItemOffsetY = diagCoords.y - this.blockPositions[clickedItem].y;
            return;
        }

        // Vérifier s'il y a un lien cliqué (si on veut gérer la sélection de lien)
        // const clickedLink = this.findClickedLink(mouseX, mouseY);
        // if (clickedLink) {
        //     // this.$emit("select_link", clickedLink);
        //     return;
        // }

        // Sinon, on drag le canvas
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

        // Drag d’un item
        if (this.draggedItemId) {
            const diagCoords = this.screenToDiagramCoords(mouseX, mouseY);
            this.blockPositions[this.draggedItemId].x = diagCoords.x - this.dragItemOffsetX;
            this.blockPositions[this.draggedItemId].y = diagCoords.y - this.dragItemOffsetY;
            this.autoFitEnabled = false;
            return;
        }

        // Drag du canvas
        if (this.isDraggingCanvas) {
            this.offsetX = mouseX - this.dragStartX;
            this.offsetY = mouseY - this.dragStartY;
            this.autoFitEnabled = false;
            this.drawDiagram();
        }
    }

    private onMouseUp(e: MouseEvent) {
        if (this.draggedItemId) {
            // Clic simple => toggle fold / sélection
            if (!this.hasMovedSinceMouseDown) {
                if (this.selectedItem === this.draggedItemId) {
                    // On toggle l'état folded
                    this.blockPositions[this.draggedItemId].folded = !this.blockPositions[this.draggedItemId].folded;
                } else {
                    // On sélectionne l'item
                    this.$emit("select_item", this.draggedItemId);
                }
            }
        }
        this.isDraggingCanvas = false;
        this.draggedItemId = null;
    }

    private findClickedItem(mouseX: number, mouseY: number): string | null {
        const diag = this.screenToDiagramCoords(mouseX, mouseY);
        const xClick = diag.x;
        const yClick = diag.y;
        for (const id of Object.keys(this.items)) {
            const p = this.blockPositions[id];
            const w = 200;
            const h = p.folded ? 30 : 70;
            if (
                xClick >= p.x &&
                xClick <= p.x + w &&
                yClick >= p.y &&
                yClick <= p.y + h
            ) {
                return id;
            }
        }
        return null;
    }

    private findClickedLink(mouseX: number, mouseY: number): { sourceItemId: string; targetItemId: string } | null {
        const diag = this.screenToDiagramCoords(mouseX, mouseY);
        for (const link of this.drawnLinks) {
            const dist = this.pointToSegmentDistance(
                diag.x, diag.y,
                link.startX, link.startY,
                link.endX, link.endY
            );
            if (dist < 10) {
                return { sourceItemId: link.sourceItemId, targetItemId: link.targetItemId };
            }
        }
        return null;
    }

    private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
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
}
