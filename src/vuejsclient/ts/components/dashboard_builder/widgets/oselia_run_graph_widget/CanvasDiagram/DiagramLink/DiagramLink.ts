import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import './DiagramLink.scss';

interface Point { x: number; y: number; }
interface LinkDrawInfo {
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
    // On part du premier point, on trace des lignes successives
        const pts = this.link.pathPoints;
        if (!pts.length) return '';
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            d += ` L ${pts[i].x} ${pts[i].y}`;
        }
        return d;
    }
}
