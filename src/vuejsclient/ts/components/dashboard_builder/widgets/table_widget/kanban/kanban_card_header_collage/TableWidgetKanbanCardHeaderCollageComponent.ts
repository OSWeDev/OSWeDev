import Component from 'vue-class-component';
import VueComponentBase from '../../../../../VueComponentBase';
import './TableWidgetKanbanCardHeaderCollageComponent.scss';
import { PhotoCollageWrapper } from "vue-photo-collage";
import { Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ImageVO from '../../../../../../../../shared/modules/Image/vos/ImageVO';
import FileVO from '../../../../../../../../shared/modules/File/vos/FileVO';

@Component({
    template: require('./TableWidgetKanbanCardHeaderCollageComponent.pug'),
    components: {
        Photocollagewrapper: PhotoCollageWrapper
    }
})
export default class TableWidgetKanbanCardHeaderCollageComponent extends VueComponentBase {

    @Prop({ default: null })
    private image_ids: string[];
    // private image_ids: number[];

    @Prop({ default: 1 })
    private max_images_row_1: number;

    @Prop({ default: 2 })
    private max_images_row_2: number;

    @Prop({ default: "1em" })
    private collage_gap_size: string;

    @Prop({ default: "1em" })
    private collage_border_radius: string;

    @Prop({ default: "auto" })
    private collage_width: string;

    @Prop({ default: "10em" })
    private single_row_height: string;

    @Prop({ default: "5em" })
    private two_rows_first_row_height: string;

    @Prop({ default: "5em" })
    private two_rows_second_row_height: string;


    // private image_urls: string[] = [];

    // @Watch('image_ids', { immediate: true })
    // private async watch_image_ids() {

    //     this.image_urls = [];

    //     if ((!this.image_ids) || (!this.image_ids.length)) {
    //         return;
    //     }

    //     let images = await query(FileVO.API_TYPE_ID).filter_by_ids(this.image_ids).select_vos<FileVO>();
    //     if ((!images) || (!images.length)) {
    //         return;
    //     }

    //     for (let i in images) {
    //         let image = images[i];
    //         this.image_urls.push(image.path);
    //     }
    // }

    private async item_click_handler(item: any, index, event) {
        if ((!item) || (!item.source)) {
            return;
        }

        if (event && event.stopPropagation) {
            event.stopPropagation();
        }

        window.open(window.location.origin + '/' + item.source, '_blank');
    }

    get collage(): any {

        if ((!this.image_ids) || (!this.image_ids.length)) { //image_ids == image_ids pour le moment
            return null;
        }

        const nb_images = this.image_ids.length;
        let height = [this.single_row_height];
        let layout = [this.max_images_row_1];
        if (nb_images > this.max_images_row_1) {
            height = [this.two_rows_first_row_height, this.two_rows_second_row_height];
            layout = [this.max_images_row_1, this.max_images_row_2];
        }

        const photos: Array<{ source: string }> = [];
        for (const i in this.image_ids) {
            const image_url = this.image_ids[i];
            photos.push({ source: image_url });
        }

        return {
            gapSize: this.collage_gap_size,
            borderRadius: this.collage_border_radius,
            width: this.collage_width,
            height,
            layout,
            photos,
            showNumOfRemainingPhotos: true,
        };
    }
}