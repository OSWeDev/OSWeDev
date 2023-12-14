import ModuleChatModal from '../../../../shared/modules/ChatModal/ModuleChatModal';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class ChatModalVueModule extends VueModuleBase {

    public static getInstance(): ChatModalVueModule {
        if (!ChatModalVueModule.instance) {
            ChatModalVueModule.instance = new ChatModalVueModule();
        }

        return ChatModalVueModule.instance;
    }

    protected static instance: ChatModalVueModule = null;

    protected constructor() {

        super(ModuleChatModal.getInstance().name);

        if (!this.policies_needed) {
            this.policies_needed = [
                ModuleChatModal.POLICY_FO_ACCESS
            ];
        } else if (this.policies_needed.indexOf(ModuleChatModal.POLICY_FO_ACCESS) < 0) {
            this.policies_needed.push(ModuleChatModal.POLICY_FO_ACCESS);
        }
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleChatModal.POLICY_FO_ACCESS]) {
            return;
        }
    }
}