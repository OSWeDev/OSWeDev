import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VueComponentBase from '../../../../VueComponentBase';

import './QRCodeComponent.scss';

@Component({
    template: require('./QRCodeComponent.pug'),
    components: {}
})
export default class QRCodeComponent extends VueComponentBase {

    @Prop({ required: true })
    public data: string;

    @Prop({ default: 200 })
    public size: number;

    private get qrCodeSvg(): string {
        // Pour simplifier, on utilise une API publique pour générer le QR Code
        // En production, vous pourriez vouloir utiliser une bibliothèque côté client
        const encodedData = encodeURIComponent(this.data);
        return `https://api.qrserver.com/v1/create-qr-code/?size=${this.size}x${this.size}&data=${encodedData}`;
    }

    private async created(): Promise<void> { }
}
