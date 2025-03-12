import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { ItemInterface } from '../interface'; // Ou un fichier de types externe
import './CanvasDiagram.scss';
import OseliaRunTemplateVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';

@Component({
    template: require('./CanvasDiagram.pug'),
})
export default class CanvasDiagram extends Vue {

    @Prop({ default: () => ({}) })
    public items!: { [id: string]: OseliaRunTemplateVO };

    @Prop({ default: () => ({}) })
    public links!: { [id: string]: string[] };

    @Prop({ default: () => ({}) })
    public hidden_links!: { [from: string]: { [to: string]: boolean } };

    @Prop({ default: null })
    public selectedItem!: string | null;

    @Prop({ default: null })
    public selectedLink!: { from: string; to: string } | null;

    private ctx: CanvasRenderingContext2D | null = null;
    private scale: number = 1.0;
    private offsetX: number = 0;
    private offsetY: number = 0;

    private isPanning: boolean = false;
    private startX: number = 0;
    private startY: number = 0;
    private draggingItemId: string | null = null;

    @Watch('items', { deep: true })
    @Watch('links', { deep: true })
    onDataChanged() {
        this.drawAll();
    }

    mounted() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (canvas) {
            this.ctx = canvas.getContext('2d');
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            canvas.addEventListener('mousedown', this.onMouseDown);
            canvas.addEventListener('mousemove', this.onMouseMove);
            canvas.addEventListener('mouseup', this.onMouseUp);
            canvas.addEventListener('wheel', this.onWheel);

            this.drawAll();
        }
    }

    beforeDestroy() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (canvas) {
            canvas.removeEventListener('mousedown', this.onMouseDown);
            canvas.removeEventListener('mousemove', this.onMouseMove);
            canvas.removeEventListener('mouseup', this.onMouseUp);
            canvas.removeEventListener('wheel', this.onWheel);
        }
    }



    private onWheel(e: WheelEvent) {
        e.preventDefault();
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const oldScale = this.scale;

        this.scale += wheel * zoomIntensity;
        this.scale = Math.max(0.2, Math.min(this.scale, 5));

        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const dx = mx / oldScale - mx / this.scale;
        const dy = my / oldScale - my / this.scale;

        this.offsetX += dx;
        this.offsetY += dy;

        this.drawAll();
    }

    private onMouseDown(e: MouseEvent) {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startY = e.clientY - rect.top;

        const clickedItemId = this.findItemAt(this.startX, this.startY);
        if (clickedItemId) {
            this.draggingItemId = clickedItemId;
        } else {
            this.isPanning = true;
        }
    }

    private onMouseMove(e: MouseEvent) {
        if (!this.isPanning && !this.draggingItemId) return;
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const dx = (currentX - this.startX) / this.scale;
        const dy = (currentY - this.startY) / this.scale;

        if (this.isPanning) {
            this.offsetX += dx;
            this.offsetY += dy;
        } else if (this.draggingItemId) {
            const item = this.items[this.draggingItemId];
            if (item) {
                // On suppose qu'on stocke x,y dans l'objet OseliaRunTemplateVO
                // (Si ce n'est pas le cas, vous pouvez conserver x,y dans un store externe)
                (item as any).x = (item as any).x || 0;
                (item as any).y = (item as any).y || 0;

                (item as any).x += dx;
                (item as any).y += dy;
            }
        }

        this.startX = currentX;
        this.startY = currentY;

        this.drawAll();
    }

    private onMouseUp(e: MouseEvent) {
        if (this.draggingItemId) {
            // Fin du drag d'un item
            this.draggingItemId = null;
        }
        this.isPanning = false;

        // Vérifier si on clique sur un item ou un lien (sélection)
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (!this.isPanning) {
            const itemId = this.findItemAt(x, y);
            if (itemId) {
                this.$emit('select_item', itemId);
                return;
            }
            const link = this.findLinkAt(x, y);
            if (link) {
                this.$emit('select_link', link);
            }
        }
    }

    private drawAll() {
        if (!this.ctx) return;
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.ctx.save();
        this.ctx.translate(this.startX, this.startY);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.translate(-this.startX, -this.startY);

        // Dessiner les liens
        this.drawLinks();

        // Dessiner les items
        this.drawItems();

        this.ctx.restore();
    }

    private drawItems() {
        if (!this.ctx) return;

        Object.keys(this.items).forEach((itemId) => {
            const item = this.items[itemId];

            // On récupère x,y (qu'on aura ajoutés ou gérés autrement)
            const x: number = (item as any).x || 0;
            const y: number = (item as any).y || 0;

            // Largeur / hauteur du rectangle
            const w = 100;
            const h = 50;

            // Choix de la couleur en fonction de run_type
            if (item.run_type === 0) {
                this.ctx!.fillStyle = 'blue';
            } else if (item.run_type === 1) {
                this.ctx!.fillStyle = 'orange';
            } else {
                // Couleur par défaut si run_type n'est pas 0 ou 1
                this.ctx!.fillStyle = '#ccddff';
            }

            // Mise en surbrillance si sélectionné
            if (itemId === this.selectedItem) {
                this.ctx!.strokeStyle = '#f00';
                this.ctx!.lineWidth = 3;
            } else {
                this.ctx!.strokeStyle = '#333';
                this.ctx!.lineWidth = 1;
            }

            // Dessin du rectangle
            this.ctx!.fillRect(x, y, w, h);
            this.ctx!.strokeRect(x, y, w, h);

            // Dessin du "name"
            this.ctx!.fillStyle = '#000';
            this.ctx!.font = '14px Arial';
            const text = item.name || `Item ${itemId}`;
            this.ctx!.fillText(text, x + 5, y + 28);
        });
    }

    private drawLinks() {
        if (!this.ctx) return;
        Object.keys(this.links).forEach((fromId) => {
            const itemFrom = this.items[fromId];
            if (!itemFrom) return;

            const xF = (itemFrom as any).x || 0;
            const yF = (itemFrom as any).y || 0;
            const fromCenter = { x: xF + 50, y: yF + 25 }; // centre du rectangle

            this.links[fromId].forEach((toId) => {
                const itemTo = this.items[toId];
                if (!itemTo) return;

                const xT = (itemTo as any).x || 0;
                const yT = (itemTo as any).y || 0;
                const toCenter = { x: xT + 50, y: yT + 25 };

                // Vérifier si le lien est "hidden"
                const hidden = this.hidden_links[fromId]?.[toId] ?? false;
                this.ctx!.strokeStyle = hidden ? '#bbb' : '#666';
                this.ctx!.lineWidth = 2;

                // Dessiner la ligne
                this.ctx!.beginPath();
                this.ctx!.moveTo(fromCenter.x, fromCenter.y);
                this.ctx!.lineTo(toCenter.x, toCenter.y);
                this.ctx!.stroke();

                // Surbrillance si lien sélectionné
                if (
                    this.selectedLink &&
                    this.selectedLink.from === fromId &&
                    this.selectedLink.to === toId
                ) {
                    this.ctx!.strokeStyle = 'red';
                    this.ctx!.lineWidth = 3;
                    this.ctx!.beginPath();
                    this.ctx!.moveTo(fromCenter.x, fromCenter.y);
                    this.ctx!.lineTo(toCenter.x, toCenter.y);
                    this.ctx!.stroke();
                }
            });
        });
    }

    private findItemAt(x: number, y: number): string | null {
        const transformed = this.screenToWorld(x, y);
        for (const itemId in this.items) {
            const item = this.items[itemId];
            const ix = (item as any).x || 0;
            const iy = (item as any).y || 0;
            const w = 100, h = 50;
            if (
                transformed.x >= ix &&
                transformed.x <= ix + w &&
                transformed.y >= iy &&
                transformed.y <= iy + h
            ) {
                return itemId;
            }
        }
        return null;
    }

    private findLinkAt(x: number, y: number): { from: string; to: string } | null {
        const transformed = this.screenToWorld(x, y);
        const threshold = 5;
        for (const fromId in this.links) {
            const itemFrom = this.items[fromId];
            if (!itemFrom) continue;

            const xF = (itemFrom as any).x || 0;
            const yF = (itemFrom as any).y || 0;
            const fromCenter = { x: xF + 50, y: yF + 25 };

            for (const toId of this.links[fromId]) {
                const itemTo = this.items[toId];
                if (!itemTo) continue;

                const xT = (itemTo as any).x || 0;
                const yT = (itemTo as any).y || 0;
                const toCenter = { x: xT + 50, y: yT + 25 };

                if (this.isPointNearLine(transformed, fromCenter, toCenter, threshold)) {
                    return { from: fromId, to: toId };
                }
            }
        }
        return null;
    }

    private screenToWorld(x: number, y: number) {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        // On applique l’inverse de la transformation
        const worldX = (x - this.startX) / this.scale - this.offsetX + this.startX;
        const worldY = (y - this.startY) / this.scale - this.offsetY + this.startY;
        return { x: worldX, y: worldY };
    }

    private isPointNearLine(
        point: { x: number; y: number },
        start: { x: number; y: number },
        end: { x: number; y: number },
        threshold: number
    ): boolean {
        const { x, y } = point;
        const A = x - start.x;
        const B = y - start.y;
        const C = end.x - start.x;
        const D = end.y - start.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;
        if (param < 0) {
            xx = start.x;
            yy = start.y;
        } else if (param > 1) {
            xx = end.x;
            yy = end.y;
        } else {
            xx = start.x + param * C;
            yy = start.y + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < threshold;
    }
}
