import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DocumentVO from '../../../../../shared/modules/Document/vos/DocumentVO';
import './DocumentComponent.scss';
import VueComponentBase from '../../VueComponentBase';

@Component({
    template: require('./DocumentComponent.pug'),
    components: {}
})
export default class DocumentComponent extends VueComponentBase {

    @Prop({ default: null })
    private document: DocumentVO;
    private classnames: string[] = [
        'XS',
        'S',
        'M',
        'L',
        'XL',
        'XXL'];

    get type_video() {
        return DocumentVO.DOCUMENT_TYPE_YOUTUBE;
    }

    get type_pdf() {
        return DocumentVO.DOCUMENT_TYPE_PDF;
    }

    get type_xls() {
        return DocumentVO.DOCUMENT_TYPE_XLS;
    }

    get type_doc() {
        return DocumentVO.DOCUMENT_TYPE_DOC;
    }

    get type_ppt() {
        return DocumentVO.DOCUMENT_TYPE_PPT;
    }

    get type_other() {
        return DocumentVO.DOCUMENT_TYPE_OTHER;
    }

    private open_document(url: string) {
        window.open(url, "_blank");
    }
}