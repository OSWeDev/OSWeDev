import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import './DiagramLink.scss';

interface Point { x: number; y: number; }
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

    get pathD(): string {
        if (!this.link.pathPoints.length) return '';
        const pts = this.link.pathPoints;
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            d += ` L ${pts[i].x} ${pts[i].y}`;
        }
        return d;
    }

    get svgStyle() {
        const pts = this.link.pathPoints;
        if (!pts.length) return { display: 'none' };
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
            'z-index': 1
        };
    }
}
