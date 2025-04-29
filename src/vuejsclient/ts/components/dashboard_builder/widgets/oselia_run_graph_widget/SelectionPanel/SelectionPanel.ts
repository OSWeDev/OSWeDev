import Vue from 'vue';
import VueJsonPretty from 'vue-json-pretty';
import { Component, Prop, Watch } from 'vue-property-decorator';
import './SelectionPanel.scss';
import OseliaRunTemplateVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunVO';
import GPTAssistantAPIFunctionVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import OseliaRunFunctionCallVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO';
import ModuleOselia from '../../../../../../../shared/modules/Oselia/ModuleOselia';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIAssistantVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import OseliaPromptVO from '../../../../../../../shared/modules/Oselia/vos/OseliaPromptVO';
import VueComponentBase from '../../../../VueComponentBase';

@Component({
    template: require('./SelectionPanel.pug'),
    components: {
        VueJsonPretty,
    },
})
export default class SelectionPanel extends VueComponentBase {

    @Prop({ default: () => ({}) })
    public items!: { [id: string]: OseliaRunTemplateVO | OseliaRunVO };

    @Prop({ default: null })
    public selectedItem!: string | null;

    @Prop({ default: null })
    public selectedItemRunInfo!: OseliaRunFunctionCallVO | null;

    @Prop({ type: Function, required: true })
    public removeItemFn!: (itemId: string) => void;

    @Prop({ type: Function, required: true })
    public editItemFn!: (itemId: string) => void;

    private hasSelectedFunction: boolean = false;
    private hasSelectedCall: boolean = false;
    private hasSelectedRun: boolean = false;
    private runTypeIsAssistant: boolean = false;

    /**
     * Contiendra en permanence le JSON "brut" pour nos différents cas,
     * (ex: parameters, assistant instructions, etc.)
     */
    private jsonText: string = '';
    private currentAssistant: GPTAssistantAPIAssistantVO | null = null;
    private currentPromptVO: OseliaPromptVO | null = null;
    private saveInstructions: boolean = false;
    private saveParameters: boolean = false;
    private savePromptParam: boolean = false;
    private savePrompt: boolean = false;

    /**
     * On garde un champ spécifique pour le HTML coloré de l’assistant
     * (uniquement quand c’est un OseliaRunVO).
     */
    private assistantInstructionsHtml: string = '';
    private runPromptHtml: string = '';
    private runPromptParamHtml: string = '';
    private newAssistantInstructionsHtml: string = '';
    private newParams:string = '';
    private newRunPromptParamHtml:string = '';
    private newRunPromptHtml:string = '';

    get currentItem(): OseliaRunTemplateVO | OseliaRunVO | OseliaRunFunctionCallVO | null {
        if (!this.selectedItem) {
            return null;
        }
        if (this.items[this.selectedItem]) {
            const item = this.items[this.selectedItem];
            if (item._type === GPTAssistantAPIFunctionVO.API_TYPE_ID) {
                this.hasSelectedCall = false;
                this.hasSelectedFunction = true;
                this.hasSelectedRun = false;
            } else if (item._type === OseliaRunFunctionCallVO.API_TYPE_ID) {
                this.hasSelectedCall = true;
                this.hasSelectedFunction = false;
                this.hasSelectedRun = false;
            } else if (item._type === OseliaRunVO.API_TYPE_ID) {
                this.hasSelectedCall = false;
                this.hasSelectedFunction = false;
                this.hasSelectedRun = true;
            }
            return item;
        }
        return null;
    }

    /**
     * Exemple : dans le cas d’un function_call, on récupère les parameters
     * et on stocke le JSON dans jsonText.
     */
    get parameters() {
        if (this.currentItem && this.currentItem._type === OseliaRunFunctionCallVO.API_TYPE_ID) {
            this.jsonText = JSON.stringify(
                (this.currentItem as OseliaRunFunctionCallVO).function_call_parameters_initial,
                null,
                2
            );
            return this.jsonText;
        }
        return '{}';
    }

    get highlightedJson(): string {
        // On colorera les parameters dans la zone function_call
        return this.highlightJson(this.parameters);
    }

    /**
     * Watch : quand currentItem change, on check si c’est un OseliaRunVO.
     * Si oui, on appelle l’async `loadInstructionsFromAssistant`.
     */
    @Watch('currentItem', { immediate: true })
    private async onCurrentItemChanged() {
        if (this.hasSelectedRun && this.currentItem && this.currentItem._type === OseliaRunVO.API_TYPE_ID) {
            // On lance la requête asynchrone
            this.runTypeIsAssistant = (this.currentItem as OseliaRunVO).run_type == OseliaRunVO.RUN_TYPE_ASSISTANT;
            if(this.runTypeIsAssistant) {
                await this.loadInstructionsFromAssistant();
            }
            await this.loadPromptsFromRun();
        } else {
            // On reset le HTML si ce n’est pas un OseliaRun
            this.assistantInstructionsHtml = '';
            this.runPromptHtml = '';
            this.runPromptParamHtml = '';
        }
    }

    public onRemoveSelectedItem() {
        if (!this.selectedItem) return;
        this.removeItemFn(this.selectedItem);
    }

    public onEditSelectItem() {
        if (!this.selectedItem) return;
        this.editItemFn(this.selectedItem);
    }

    /**
     * Méthode pour charger les instructions depuis l’assistant lié,
     * et stocker le HTML coloré dans `assistantInstructionsHtml`.
     */
    private async loadInstructionsFromAssistant() {
        if (this.currentItem && this.currentItem._type === OseliaRunVO.API_TYPE_ID) {
            const run = this.currentItem as OseliaRunVO;

            // On récupère l’assistant s’il y en a un
            const assistant: GPTAssistantAPIAssistantVO | null = run.assistant_id
                ? await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                    .filter_by_id(run.assistant_id)
                    .select_vo()
                : null;

            if (assistant) {
                this.currentAssistant = assistant;
                // On stocke la version brute dans jsonText
                this.jsonText = JSON.stringify(assistant.instructions, null, 2);

                // On génère la version colorée
                this.assistantInstructionsHtml = this.highlightJson(this.jsonText);
                return;
            }
        }
        // Si on n’a rien trouvé, on vide simplement
        this.jsonText = '';
        this.assistantInstructionsHtml = '';
        this.currentAssistant = null;
    }

    /**
     * Méthode pour charger le prompt lié au run,
     * et stocker le HTML coloré dans `runPromptHtml`.
     */
    private async loadPromptsFromRun() {
        if (this.currentItem && this.currentItem._type === OseliaRunVO.API_TYPE_ID) {
            const run = this.currentItem as OseliaRunVO;

            // On récupère le prompt s’il y en a un
            const prompt: OseliaPromptVO | null = run.initial_prompt_id
                ? await query(OseliaPromptVO.API_TYPE_ID)
                    .filter_by_id(run.initial_prompt_id)
                    .select_vo()
                : null;

            if (prompt) {
                this.currentPromptVO = prompt;
                // On stocke la version brute dans jsonText
                this.jsonText = JSON.stringify(prompt.prompt, null, 2);

                // On génère la version colorée
                this.runPromptHtml = this.highlightJson(this.jsonText);

                this.runPromptParamHtml = this.highlightJson(JSON.stringify(prompt.prompt_parameters_description, null, 2));
                return;
            }
        }
        // Si on n’a rien trouvé, on vide simplement
        this.jsonText = '';
        this.runPromptHtml = '';
        this.runPromptParamHtml = '';
        this.currentPromptVO = null;
    }

    private async replay_from_id(function_call_id: number) {
        await ModuleOselia.getInstance().replay_function_call(function_call_id).then(() => {
            this.$emit('replayFunctionCall');
        });
    }

    private onJsonInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        this.jsonText = target.value; // ou autre si tu veux un <div contenteditable> etc.
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
            // silencieux
        }
        return json;
    }

    private highlightJson(jsonString: string): string {
        // On essaie de parser le JSON pour le re-formatter
        try {
            const obj = JSON.parse(jsonString);
            jsonString = JSON.stringify(obj, null, 2);
        } catch (e) {
            // Pas JSON valide -> on laisse tel quel
        }

        // Protection anti balises HTML
        let escaped = jsonString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Regex de coloration
        escaped = escaped.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
                let cls = 'number';
                if (/^"/.test(match)) {
                    cls = /:$/.test(match) ? 'key' : 'string';
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );

        return escaped;
    }
    private unhighlightJson(highlighted: string): string {
        // 1) Supprimer les balises <span ...> et </span>
        let plain = highlighted
            .replace(/<span[^>]*>/g, '')  // enlève les <span ...>
            .replace(/<\/span>/g, '');    // enlève les </span>

        // 2) Décoder les entités HTML de base
        plain = plain
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            // Facultatif si tu veux gérer d’autres entités (ex. &quot;)
            .replace(/&quot;/g, '"');

        return plain;
    }


    private onInstructionsChange(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        this.saveInstructions = true;
        this.newAssistantInstructionsHtml = target.innerText;
    }

    private async onSaveInstructions() {
        if (this.currentAssistant && this.newAssistantInstructionsHtml) {
            const assistant = this.currentAssistant;
            assistant.instructions = this.unhighlightJson(this.newAssistantInstructionsHtml);
            await ModuleDAO.getInstance().insertOrUpdateVO(assistant).then(() => {
                this.saveInstructions = false;
                this.snotify.success('Sauvegarde réussie');
            });
        }
    }

    private onPromptParamChange(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        this.savePromptParam = true;
        this.newRunPromptParamHtml = target.innerText;
    }

    private async onSavePromptParam() {
        if (this.currentPromptVO && this.newRunPromptParamHtml) {
            const prompt = this.currentPromptVO;
            prompt.prompt_parameters_description = this.try_parse_json(this.unhighlightJson(this.newRunPromptParamHtml));
            await ModuleDAO.getInstance().insertOrUpdateVO(prompt).then(() => {
                this.savePromptParam = false;
                this.snotify.success('Sauvegarde réussie');
            });
        }
    }

    private async onPromptChange(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        this.savePrompt = true;
        this.newRunPromptHtml = target.innerText;
    }

    private async onSavePrompt() {
        if (this.currentPromptVO && this.newRunPromptHtml) {
            const prompt = this.currentPromptVO;
            prompt.prompt = this.unhighlightJson(this.newRunPromptHtml);
            await ModuleDAO.getInstance().insertOrUpdateVO(prompt).then(() => {
                this.savePrompt = false;
                this.snotify.success('Sauvegarde réussie');
            });
        }
    }

    private onParamsChange(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        this.saveParameters = true;
        this.newParams = target.innerText;
    }

    private onSaveParams() {
        if(this.currentItem && this.currentItem._type === OseliaRunFunctionCallVO.API_TYPE_ID) {
            const run = this.currentItem as OseliaRunFunctionCallVO;
            run.function_call_parameters_initial = this.try_parse_json(this.newParams);
            ModuleDAO.getInstance().insertOrUpdateVO(run).then(() => {
                this.saveParameters = false;
                this.snotify.success('Sauvegarde réussie');
            });
        }
    }
}
