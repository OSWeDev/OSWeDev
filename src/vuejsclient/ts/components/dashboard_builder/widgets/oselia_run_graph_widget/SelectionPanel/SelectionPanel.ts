import Vue from 'vue';
import VueJsonPretty from 'vue-json-pretty';
import { Component, Prop } from 'vue-property-decorator';
import { ItemInterface } from '../interface';
import './SelectionPanel.scss';
import OseliaRunTemplateVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunVO';
import GPTAssistantAPIFunctionVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import OseliaRunFunctionCallVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO';
import ModuleOselia from '../../../../../../../shared/modules/Oselia/ModuleOselia';
@Component({
    template: require('./SelectionPanel.pug'),
    components: {
        VueJsonPretty,
    },
})
export default class SelectionPanel extends Vue {

    @Prop({ default: () => ({}) })
    public items!: { [id: string]: OseliaRunTemplateVO | OseliaRunVO };

    @Prop({ default: null })
    public selectedItem!: string | null;

    @Prop({ default: null })
    public selectedItemRunInfo!: OseliaRunFunctionCallVO | null;

    // Nouvelle prop : la fonction pour supprimer un item
    @Prop({ type: Function, required: true })
    public removeItemFn!: (itemId: string) => void;

    // Nouvelle prop : la fonction pour supprimer un item
    @Prop({ type: Function, required: true })
    public editItemFn!: (itemId: string) => void;

    private hasSelectedFunction: boolean = false;

    get currentItem(): OseliaRunTemplateVO | OseliaRunVO | null {
        if (!this.selectedItem) {
            return null;
        }
        if (this.items[this.selectedItem]) {
            if (this.items[this.selectedItem]._type === GPTAssistantAPIFunctionVO.API_TYPE_ID) {
                this.hasSelectedFunction = true;
            } else {
                this.hasSelectedFunction = false;
            }
            return this.items[this.selectedItem];
        }
        return null;
    }
    // On conserve un event pour switchHidden, par exemple
    public onSwitchHidden(itemId: string, linkTo: string, newIsActive: boolean) {
        this.$emit('switchHidden', itemId, linkTo, !newIsActive);
    }

    public onRemoveSelectedItem() {
        if (!this.selectedItem) return;
        // Appel direct de la fonction
        this.removeItemFn(this.selectedItem);
    }

    public onEditSelectItem() {
        if (!this.selectedItem) return;
        this.editItemFn(this.selectedItem);
    }

    private async replay_from_id(function_call_id: number) {
        await ModuleOselia.getInstance().replay_function_call(function_call_id);
    }

    private try_parse_json(json: string): any {
        if (!json) {
            return {};
        }

        if (typeof json !== 'string') {
            return json;
        }

        if (!(json.startsWith('{') && json.endsWith('}'))) {
            return json;
        }

        try {
            return JSON.parse(json);
        } catch (error) {
            //
        }
        return json;
    }

}
