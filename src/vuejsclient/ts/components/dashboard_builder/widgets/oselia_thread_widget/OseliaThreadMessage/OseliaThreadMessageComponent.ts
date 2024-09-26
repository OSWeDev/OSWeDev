import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import { filter } from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import GPTAssistantAPIThreadMessageContentVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO';
import GPTAssistantAPIThreadMessageVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import { field_names, reflect } from '../../../../../../../shared/tools/ObjectHandler';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../../../VueAppController';
import AjaxCacheClientController from '../../../../../modules/AjaxCache/AjaxCacheClientController';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../../VueComponentBase';
import DatatableComponentField from '../../../../datatable/component/fields/DatatableComponentField';
import MailIDEventsComponent from '../../../../mail_id_events/MailIDEventsComponent';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import TablePaginationComponent from '../../table_widget/pagination/TablePaginationComponent';
import OseliaThreadMessageActionURLComponent from '../OseliaThreadMessageActionURL/OseliaThreadMessageActionURLComponent';
import './OseliaThreadMessageComponent.scss';
import VueMarkdown from 'vue-markdown-render';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import OseliaThreadFeedbackComponent from '../OseliaThreadFeedback/OseliaThreadFeedbackComponent';
import ImageViewComponent from '../../../../image/View/ImageViewComponent';
import GPTAssistantAPIThreadMessageAttachmentVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageAttachmentVO';
import FileVO from '../../../../../../../shared/modules/File/vos/FileVO';
import GPTAssistantAPIFileVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFileVO';
import GPTAssistantAPIThreadMessageContentFileCitationVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentFileCitationVO';

@Component({
    template: require('./OseliaThreadMessageComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Datatablecomponentfield: DatatableComponentField,
        Tablepaginationcomponent: TablePaginationComponent,
        Oseliathreadmessageactionurlcomponent: OseliaThreadMessageActionURLComponent,
        Mailideventscomponent: MailIDEventsComponent,
        Oseliathreadmessageemailcomponent: MailIDEventsComponent,
        Oseliathreadfeedbackcomponent: OseliaThreadFeedbackComponent,
        Vuemarkdown: VueMarkdown,
        Imageviewcomponent: ImageViewComponent,
    }
})
export default class OseliaThreadMessageComponent extends VueComponentBase {


    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private thread: GPTAssistantAPIThreadVO;

    @Prop({ default: null })
    private thread_message: GPTAssistantAPIThreadMessageVO;

    public thread_message_contents: GPTAssistantAPIThreadMessageContentVO[] = [];
    private thread_message_files: { [key: string]: FileVO }[] = [];

    private is_loading_thread_message: boolean = true;

    private avatar_url: string = null;
    private user_name: string = null;

    private new_message_text: string = null;
    private current_thread_message_id: number = null;

    private is_editing_content: boolean[] = [];
    private changed_input: boolean[] = [];

    private show_feedback: boolean = false;
    private show_current_message: boolean = false;
    private markdown_options = {
        html: true,
        linkify: true,
        typographer: true,
    };
    private oselia_certitude: number = null;
    private throttle_load_thread_message = ThrottleHelper.declare_throttle_without_args(this.load_thread_message.bind(this), 10);
    private throttle_load_thread_message_attachments = ThrottleHelper.declare_throttle_without_args(this.load_thread_message_attachments.bind(this), 10);

    get is_default_avatar() {
        return (!this.avatar_url) || (this.avatar_url == ModuleAccessPolicy.AVATAR_DEFAULT_URL);
    }

    get role_assistant() {
        return GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT;
    }
    get role_assistant_avatar_url() {
        return '/vuejsclient/public/img/avatars/oselia.png';
    }

    get role_system() {
        return GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_SYSTEM;
    }
    get role_system_avatar_url() {
        return '/vuejsclient/public/img/avatars/system.png';
    }

    get role_tool() {
        return GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_TOOL;
    }
    get role_tool_avatar_url() {
        return '/vuejsclient/public/img/avatars/tool.png';
    }

    get role_function() {
        return GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_FUNCTION;
    }
    get role_function_avatar_url() {
        return '/vuejsclient/public/img/avatars/function.png';
    }

    get role_user() {
        return GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER;
    }

    get is_self_user() {

        if ((!this.thread_message) || (!this.thread_message.user_id)) {
            return false;
        }

        if (this.thread_message.role != GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_USER) {
            return false;
        }

        return this.thread_message.user_id == VueAppController.getInstance().data_user.id;
    }

    get message_content_type_text() {
        return GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
    }

    get message_content_type_image() {
        return GPTAssistantAPIThreadMessageContentVO.TYPE_IMAGE;
    }

    get message_content_type_action_url() {
        return GPTAssistantAPIThreadMessageContentVO.TYPE_ACTION_URL;
    }

    get message_content_type_email() {
        return GPTAssistantAPIThreadMessageContentVO.TYPE_EMAIL;
    }

    @Watch('thread_message', { immediate: true })
    private async on_change_thread_message() {
        await this.throttle_load_thread_message();
        // await this.throttle_load_thread_message_attachments();
    }

    @Watch('thread_message_contents', { deep: true })
    private on_change_thread_message_contents() {
        for (let content of this.thread_message_contents) {
            if (this.thread_message.role == GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT) {
                if (content.content_type_text.value && content.content_type_text.value.length > 0) {
                    if (content.content_type_text.value.includes("<certitude")) {
                        for (let i = content.content_type_text.value.indexOf('<certitude'); i < content.content_type_text.value.length; i++) {
                            if (content.content_type_text.value[i] === ">") {
                                let certitude = (content.content_type_text.value.substring(content.content_type_text.value.indexOf('<certitude'), i + 1));
                                certitude = certitude.substring(certitude.indexOf(':') + 1, certitude.indexOf('>'));
                                this.oselia_certitude = parseInt(certitude);

                                content.content_type_text.value = content.content_type_text.value.replace(content.content_type_text.value.substring(content.content_type_text.value.indexOf('<certitude'), i + 1), "");
                                break;
                            }
                        }
                        event.preventDefault();
                    }
                }

            }
            if (content.hidden == false) {
                this.show_current_message = true;
            }
        }
        this.is_editing_content = this.thread_message_contents ? this.thread_message_contents.map(() => false) : [];
        this.changed_input = this.thread_message_contents ? this.thread_message_contents.map(() => false) : [];
    }

    private async copy(ref: string) {

        // // On récupère le texte du message, donc le texte brut de tous les contenus de type texte
        // let text = '';

        // for (const i in this.thread_message_contents) {
        //     const content = this.thread_message_contents[i];

        //     if (content.type == GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT) {
        //         text += ((text == '') ? '\n\n' : '') + (content.content_type_text ? content.content_type_text.value : '');
        //     }
        // }

        // await navigator.clipboard.writeText(text);

        let selection = null;
        try {

            const range = document.createRange();
            let ref_node = this.$refs[ref];
            if (Array.isArray(ref_node)) {
                ref_node = ref_node[0];
            }
            if (ref_node && (ref_node as any).$el) {
                ref_node = (ref_node as any).$el;
            }

            const textToCopy = (ref_node as any).textContent || (ref_node as any).innerText;

            if (!textToCopy) {
                await this.$snotify.error(this.label('oselia_thread_message.copy_failed'));
                return;
            }

            navigator.clipboard.writeText(textToCopy.trim()).then(async () => {
                await this.$snotify.success(this.label('oselia_thread_message.copy_success'));
            }).catch(async (err) => {
                await this.$snotify.error(this.label('oselia_thread_message.copy_failed'));
            });

            // range.selectNode(ref_node as any);
            // selection = window.getSelection();
            // selection.removeAllRanges();
            // selection.addRange(range);

            // const successful = document.execCommand('copy');
            // if (successful) {
            //     await this.$snotify.success(this.label('oselia_thread_message.copy_success'));
            // } else {
            //     await this.$snotify.error(this.label('oselia_thread_message.copy_failed'));
            // }
        } catch (err) {
            await this.$snotify.error(this.label('oselia_thread_message.copy_failed'));
            console.error('Unable to copy', err);
        }

        if (selection) {
            selection.removeAllRanges(); // Deselect the content
        }
    }

    private async rerun() {
        throw new Error('Not implemented');
    }

    private async cancel_edit_thread_message_content(message_content: GPTAssistantAPIThreadMessageContentVO, i: number) {
        this.is_editing_content[i] = false;
        this.changed_input[i] = false;

        this.thread_message_contents[i] = await query(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID).filter_by_id(message_content.id).select_vo<GPTAssistantAPIThreadMessageContentVO>();
    }

    private async save_edit_thread_message_content(message_content: GPTAssistantAPIThreadMessageContentVO, i: number) {
        this.is_editing_content[i] = false;
        this.changed_input[i] = false;

        /**
         * TODO FIXME : Ici on devrait avoir un trigger côté serveur pour relancer le run qui suivait ce message - potentiellement pas le message content suivant du coup.
         * Le truc c'est que contrairement à GPT, faut bien récupérer l'assistant du run, puisqu'il évolue dans la discussion potentiellement.
         * Et donc faut aussi gérer une logique d'arborescence de discussion et pas de thread linéaire pour stocker toutes les variantes de la discussion.
         * Pour le moment, on propose de modifier les messages, et avec un bouton dédié à chaque contenu issu d'un assistant,
         *  de run à nouveau l'assistant pour la section de la discussion concernée, sans impacter le reste - on perd l'ancien résultat du coup si on fait ça...
         */
        await ModuleDAO.getInstance().insertOrUpdateVO(message_content);
    }

    private async force_reload() {
        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([
            GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID,
        ]);

        this.throttle_load_thread_message();
    }

    /**
     * Obligatoire pour la synchro propre des données
     */
    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }

    private async load_thread_message() {

        if (!this.thread_message) {

            this.thread_message_contents = [];
            this.is_editing_content = [];
            this.changed_input = [];
            this.is_loading_thread_message = false;
            await this.unregister_all_vo_event_callbacks();
            return;
        }

        if (this.current_thread_message_id == this.thread_message.id) {
            return;
        }

        this.current_thread_message_id = this.thread_message.id;

        this.is_loading_thread_message = true;
        this.thread_message_contents = [];
        this.is_editing_content = [];
        this.changed_input = [];

        await this.unregister_all_vo_event_callbacks();

        if (!this.thread_message/* || !this.thread_message.attachments*/) {
            this.is_loading_thread_message = false;
            return;
        }

        // On récupère les contenus du message
        await this.register_vo_updates_on_list(
            GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID,
            reflect<this>().thread_message_contents,
            [filter(GPTAssistantAPIThreadMessageContentVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageContentVO>().thread_message_id).by_num_eq(this.thread_message.id)]
        );

        await this.load_thread_message_attachments();

        await this.load_avatar_url_and_user_name();

        this.is_loading_thread_message = false;

        this.$nextTick(() => {
            this.$emit('thread_message_updated');
        });
    }

    private async load_thread_message_attachments() {

        // this.is_loading_thread_message = true;
        if (!this.thread_message || !this.thread_message.attachments) {
            // this.is_loading_thread_message = false;
            return;
        }

        // On récupère les contenus des attachments
        for (const attachment of this.thread_message.attachments) {
            if (attachment.file_id) {
                const gpt_files: GPTAssistantAPIFileVO[] = await query(GPTAssistantAPIFileVO.API_TYPE_ID)
                    .filter_by_id(attachment.file_id)
                    .select_vos<GPTAssistantAPIFileVO>();
                const files: FileVO[] = [];
                for (const gpt_file of gpt_files) {
                    const file = await query(FileVO.API_TYPE_ID)
                        .filter_by_id(gpt_file.file_id)
                        .select_vos<FileVO>();
                    files.push(file[0]);
                }
                if (files.length > 0) {
                    for (const file of files) {
                        this.thread_message_files.push({ ['.' + file.path.split('.').pop()]: file });
                    }
                }
            }
            if (attachment.gpt_file_id) {
                const gpt_files: GPTAssistantAPIFileVO[] = await query(GPTAssistantAPIFileVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<GPTAssistantAPIFileVO>().gpt_file_id, attachment.gpt_file_id)
                    .select_vos<GPTAssistantAPIFileVO>();
                const files: FileVO[] = []
                for (const gpt_file of gpt_files) {
                    const file = await query(FileVO.API_TYPE_ID)
                        .filter_by_id(gpt_file.file_id)
                        .select_vos<FileVO>();
                    files.push(file[0]);
                }
                if (files.length > 0) {
                    for (const file of files) {
                        if (this.thread_message_files.every((value) => {
                            if (value['.' + file.path.split('.').pop()].id = file.id) {
                                return false;
                            }
                            return true;
                        })) {
                            this.thread_message_files.push({ ['.' + file.path.split('.').pop()]: file });
                        }
                    }
                }
            }
        }


        // this.is_loading_thread_message = false;
    }

    private async load_avatar_url_and_user_name() {
        const promises = [];
        promises.push((async () => {
            this.user_name = await ModuleAccessPolicy.getInstance().get_avatar_name(this.thread_message.user_id);
        })());
        promises.push((async () => {
            this.avatar_url = await ModuleAccessPolicy.getInstance().get_avatar_url(this.thread_message.user_id);
        })());
        await all_promises(promises);
    }
}