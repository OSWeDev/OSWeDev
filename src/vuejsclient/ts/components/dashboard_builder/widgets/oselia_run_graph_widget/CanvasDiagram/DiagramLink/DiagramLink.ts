import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import './DiagramLink.scss';
import Vue from 'vue';
import { zIndex } from 'html2canvas/dist/types/css/property-descriptors/z-index';
export interface Point { x: number; y: number; }
export interface LinkDrawInfo {
    sourceItemId: string;
    targetItemId: string;
    pathPoints: Point[];
}

@Component({
    template: require('./DiagramLink.pug')
})
export default class DiagramLink extends Vue {

    @Prop({ required: true })
    link!: LinkDrawInfo;

    /**
     * On trace un path en reliant tous les points successifs
     */
    get pathD(): string {
        const pts = this.link.pathPoints;
        if (!pts.length) return '';
        // On calcule l’offset
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);

        // On “reboucle” les points en soustrayant minX, minY,
        // pour dessiner le path "relatif" à (0,0) dans le <svg>
        const startX = pts[0].x - minX;
        const startY = pts[0].y+40 - minY;

        let d = `M ${startX} ${startY}`;
        for (let i = 1; i < pts.length; i++) {
            d += ` L ${pts[i].x - minX} ${pts[i].y - minY}`;
        }
        return d;
    }

    /**
     * Pour positionner le <svg>, on calcule la bounding box (minX, minY, w, h).
     */
    get svgStyle() {
        const pts = this.link.pathPoints;
        if (!pts.length) {
            return { display: 'none' };
        }
        const xs = pts.map(p => p.x);
        const ys = pts.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const w = maxX - minX;
        const h = maxY - minY;

        return {
            position: 'absolute',
            left: `${minX}px`,
            top: `${minY}px`,
            width: `${w}px`,
            height: `${h}px`,
            pointerEvents: 'none',
            overflow: 'visible',
            'z-index': 10
        };
    }
}
