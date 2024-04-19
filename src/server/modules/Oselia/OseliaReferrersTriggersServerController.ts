import { Thread } from 'openai/resources/beta/threads/threads';
import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadMessageVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import OseliaPromptVO from '../../../shared/modules/Oselia/vos/OseliaPromptVO';
import OseliaUserPromptVO from '../../../shared/modules/Oselia/vos/OseliaUserPromptVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import GPTAssistantAPIServerController from '../GPT/GPTAssistantAPIServerController';

export default class OseliaReferrersTriggersServerController {

    private static
}