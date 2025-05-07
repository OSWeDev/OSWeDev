/* istanbul ignore file: really difficult tests : not willing to test this part. Maybe divide this in smaller chunks, but I don't see any usefull test */

import IGeneratorWorker from './IGeneratorWorker';
import Patch20210804Changebddvarsindexes from './patchs/postmodules/Patch20210804Changebddvarsindexes';
import Patch20210916SetParamPushData from './patchs/postmodules/Patch20210916SetParamPushData';
import Patch20211214ChangeVarTooltipTrads from './patchs/postmodules/Patch20211214ChangeVarTooltipTrads';
import Patch20220217ChangeLoginTrad from './patchs/postmodules/Patch20220217ChangeLoginTrad';
import Patch20220222MigrationCodesTradsDB from './patchs/postmodules/Patch20220222MigrationCodesTradsDB';
import Patch20220401SetParamPushData from './patchs/postmodules/Patch20220401SetParamPushData';
import Patch20220404UpdateDBBWidgetsDefaultSize from './patchs/postmodules/Patch20220404UpdateDBBWidgetsDefaultSize';
import Patch20220713ChangeVarCacheType1To0 from './patchs/postmodules/Patch20220713ChangeVarCacheType1To0';
import Patch20220725DashboardWidgetUpdate from './patchs/postmodules/Patch20220725DashboardWidgetUpdate';
import Patch20220809ChangeDbbTrad from './patchs/postmodules/Patch20220809ChangeDbbTrad';
import Patch20221216ChangeDbbTradsToIncludeLabels from './patchs/postmodules/Patch20221216ChangeDbbTradsToIncludeLabels';
import Patch20221217ParamBlockVos from './patchs/postmodules/Patch20221217ParamBlockVos';
import Patch20230428FavoriteWidgetsAreNotFilters from './patchs/postmodules/Patch20230428FavoriteWidgetsAreNotFilters';
import Patch20230517InitParamsStats from './patchs/postmodules/Patch20230517InitParamsStats';
import Patch20230519AddRightsFeedbackStateVO from './patchs/postmodules/Patch20230519AddRightsFeedbackStateVO';
import Patch20230927AddAliveTimeoutToSomeBGThreads from './patchs/postmodules/Patch20230927AddAliveTimeoutToSomeBGThreads';
import Patch20230927AddSupervisionToCrons from './patchs/postmodules/Patch20230927AddSupervisionToCrons';
import Patch20231123AddRightsSharedFilters from './patchs/postmodules/Patch20231123AddRightsSharedFilters';
import Patch20240305MigrationCodesTradsMinusculesENV from './patchs/postmodules/Patch20240305MigrationCodesTradsMinusculesENV';
import Patch20240307DuplicateRightsSupervision from './patchs/postmodules/Patch20240307DuplicateRightsSupervision';
import Patch20240409RetrieveOpenAIRunStats from './patchs/postmodules/Patch20240409RetrieveOpenAIRunStats';
import Patch20240507AddDefaultRightsAPIsOselia from './patchs/postmodules/Patch20240507AddDefaultRightsAPIsOselia';
import Patch20240514AddAssistantFunctionGetVoTypeDescription from './patchs/postmodules/Patch20240514AddAssistantFunctionGetVoTypeDescription';
import Patch20240524InitExistingGPTMessageThreadAndRunGPTIds from './patchs/postmodules/Patch20240524InitExistingGPTMessageThreadAndRunGPTIds';
import Patch20240612DbbAdvancedDateFilterChangeIsFilter from './patchs/postmodules/Patch20240612DbbAdvancedDateFilterChangeIsFilter';
import Patch20240619AddRightsSeeGeneratedImages from './patchs/postmodules/Patch20240619AddRightsSeeGeneratedImages';
import Patch20240619DeclareFunctionOseliaGenerateImages from './patchs/postmodules/Patch20240619DeclareFunctionOseliaGenerateImages';
import Patch20240701AddDbOseliaAssistantsetfonctions from './patchs/postmodules/Patch20240701AddDbOseliaAssistantsetfonctions';
import Patch20240905AddOseliaAssistantThreadTitleWriter from './patchs/postmodules/Patch20240905AddOseliaAssistantThreadTitleWriter';
import Patch20240905InitAllThreadsOseliaToHavingContents from './patchs/postmodules/Patch20240905InitAllThreadsOseliaToHavingContents';
import Patch20240906DeleteOldAssistantObjDBLinks from './patchs/postmodules/Patch20240906DeleteOldAssistantObjDBLinks';
import Patch20240912PreinitOseliaPrices from './patchs/postmodules/Patch20240912PreinitOseliaPrices';
import Patch20240926AddOseliaFunction_TRELLO_trello_create_card from './patchs/postmodules/Patch20240926AddOseliaFunction_TRELLO_trello_create_card';
import Patch20240926AddOseliaFunction_TRELLO_trello_delete_card from './patchs/postmodules/Patch20240926AddOseliaFunction_TRELLO_trello_delete_card';
import Patch20240926AddOseliaFunction_TRELLO_trello_get_action from './patchs/postmodules/Patch20240926AddOseliaFunction_TRELLO_trello_get_action';
import Patch20240926AddOseliaFunction_TRELLO_trello_get_board from './patchs/postmodules/Patch20240926AddOseliaFunction_TRELLO_trello_get_board';
import Patch20240926AddOseliaFunction_TRELLO_trello_get_board_actions from './patchs/postmodules/Patch20240926AddOseliaFunction_TRELLO_trello_get_board_actions';
import Patch20240926AddOseliaFunction_TRELLO_trello_get_board_cards from './patchs/postmodules/Patch20240926AddOseliaFunction_TRELLO_trello_get_board_cards';
import Patch20240926AddOseliaFunction_TRELLO_trello_get_card from './patchs/postmodules/Patch20240926AddOseliaFunction_TRELLO_trello_get_card';
import Patch20240926AddOseliaFunction_TRELLO_trello_get_card_actions from './patchs/postmodules/Patch20240926AddOseliaFunction_TRELLO_trello_get_card_actions';
import Patch20240926AddOseliaFunction_TRELLO_trello_get_lists_on_a_board from './patchs/postmodules/Patch20240926AddOseliaFunction_TRELLO_trello_get_lists_on_a_board';
import Patch20240926AddOseliaFunction_TRELLO_trello_get_members_of_a_board from './patchs/postmodules/Patch20240926AddOseliaFunction_TRELLO_trello_get_members_of_a_board';
import Patch20240926AddOseliaFunction_TRELLO_trello_search_trello from './patchs/postmodules/Patch20240926AddOseliaFunction_TRELLO_trello_search_trello';
import Patch20240926AddOseliaFunction_TRELLO_trello_update_card from './patchs/postmodules/Patch20240926AddOseliaFunction_TRELLO_trello_update_card';
import Patch20240926PreInitOseliaThreadRoles from './patchs/postmodules/Patch20240926PreInitOseliaThreadRoles';
import Patch20240930AddOseliaFunction_get_thread_text_content from './patchs/postmodules/Patch20240930AddOseliaFunction_get_thread_text_content';
import Patch20240930AddOseliaFunction_send_teams_messages from './patchs/postmodules/Patch20240930AddOseliaFunction_send_teams_messages';
import Patch20241003AddParamForSplitterAndValidator from './patchs/postmodules/Patch20241003AddParamForSplitterAndValidator';
import Patch20241004AddOseliaFunction_OSELIA_append_new_child_run_step from './patchs/postmodules/Patch20241004AddOseliaFunction_OSELIA_append_new_child_run_step';
import Patch20241004AddOseliaFunction_OSELIA_refuse_run from './patchs/postmodules/Patch20241004AddOseliaFunction_OSELIA_refuse_run';
import Patch20241004AddOseliaFunction_OSELIA_validate_run from './patchs/postmodules/Patch20241004AddOseliaFunction_OSELIA_validate_run';
import Patch20241010CreateLogType from './patchs/postmodules/Patch20241010CreateLogType';
import Patch20241016AddOseliaFunction_OSELIA_get_assistant from './patchs/postmodules/Patch20241016AddOseliaFunction_OSELIA_get_assistant';
import Patch20241016AddOseliaFunction_OSELIA_get_cache_value from './patchs/postmodules/Patch20241016AddOseliaFunction_OSELIA_get_cache_value';
import Patch20241016AddOseliaFunction_OSELIA_set_cache_value from './patchs/postmodules/Patch20241016AddOseliaFunction_OSELIA_set_cache_value';
import Patch20241023AddOseliaFunction_azure_get_last_unread_email from './patchs/postmodules/Patch20241023AddOseliaFunction_azure_get_last_unread_email';
import Patch20241030SuiviCompetencesGroupeShortName from './patchs/postmodules/Patch20241030SuiviCompetencesGroupeShortName';
import Patch20241216LowerDefaultDBLogTypeToWARN from './patchs/postmodules/Patch20241216LowerDefaultDBLogTypeToWARN';
import Patch20241224SupervisionFillProbe from './patchs/postmodules/Patch20241224SupervisionFillProbe';
import Patch20250102AddRightsSupervisedProbe from './patchs/postmodules/Patch20250102AddRightsSupervisedProbe';
import Patch20250115UpdateGraphsPalettes from './patchs/postmodules/Patch20250115UpdateGraphsPalettes';
import Patch20250224AddDbbTrad from './patchs/postmodules/Patch20250224AddDbbTrad';
import Patch20250224AddDefaultPalette from './patchs/postmodules/Patch20250224AddDefaultPalette';
import Patch20250303CheckDBsCycles from './patchs/postmodules/Patch20250303CheckDBsCycles';
import Patch20250331RemoveValueTables from './patchs/postmodules/Patch20250331RemoveValueTables';
import Patch20250331RenameFavoriteFilterOptions from './patchs/postmodules/Patch20250331RenameFavoriteFilterOptions';
import Patch20250505AddOseliaAssistantTraduction from './patchs/postmodules/Patch20250505AddOseliaAssistantTraduction';
import Patch20250505AddOseliaRunTemplate_AssistantTraduction from './patchs/postmodules/Patch20250505AddOseliaRunTemplate_AssistantTraduction';
import Patch20250506AddOseliaFunction_OSELIA_agent_mem_get_entries from './patchs/postmodules/Patch20250506AddOseliaFunction_OSELIA_agent_mem_get_entries';
import Patch20250506AddOseliaFunction_OSELIA_agent_mem_get_keys from './patchs/postmodules/Patch20250506AddOseliaFunction_OSELIA_agent_mem_get_keys';
import Patch20250506AddOseliaFunction_OSELIA_agent_mem_set_mem from './patchs/postmodules/Patch20250506AddOseliaFunction_OSELIA_agent_mem_set_mem';
import Patch20250506AddOseliaFunction_OSELIA_app_mem_get_entries from './patchs/postmodules/Patch20250506AddOseliaFunction_OSELIA_app_mem_get_entries';
import Patch20250506AddOseliaFunction_OSELIA_app_mem_get_keys from './patchs/postmodules/Patch20250506AddOseliaFunction_OSELIA_app_mem_get_keys';
import Patch20250506AddOseliaFunction_OSELIA_app_mem_set_mem from './patchs/postmodules/Patch20250506AddOseliaFunction_OSELIA_app_mem_set_mem';
import Patch20250506AddOseliaFunction_OSELIA_user_mem_get_entries from './patchs/postmodules/Patch20250506AddOseliaFunction_OSELIA_user_mem_get_entries';
import Patch20250506AddOseliaFunction_OSELIA_user_mem_get_keys from './patchs/postmodules/Patch20250506AddOseliaFunction_OSELIA_user_mem_get_keys';
import Patch20250506AddOseliaFunction_OSELIA_user_mem_set_mem from './patchs/postmodules/Patch20250506AddOseliaFunction_OSELIA_user_mem_set_mem';
import Patch20250507DebugFavoritFiltersLimits from './patchs/postmodules/Patch20250507DebugFavoritFiltersLimits';
import Patch20122024TruncateLogsUpdated from './patchs/premodules/Patch20122024TruncateLogsUpdated';
import Patch20210803ChangeDIHDateType from './patchs/premodules/Patch20210803ChangeDIHDateType';
import Patch20210914ClearDashboardWidgets from './patchs/premodules/Patch20210914ClearDashboardWidgets';
import Patch20211004ChangeLang from './patchs/premodules/Patch20211004ChangeLang';
import Patch20220111LocalizeCRONDate from './patchs/premodules/Patch20220111LocalizeCRONDate';
import Patch20220222RemoveVorfieldreffrombdd from './patchs/premodules/Patch20220222RemoveVorfieldreffrombdd';
import Patch20220223Adduniqtranslationconstraint from './patchs/premodules/Patch20220223Adduniqtranslationconstraint';
import Patch20220822ChangeTypeRecurrCron from './patchs/premodules/Patch20220822ChangeTypeRecurrCron';
import Patch20230209AddColumnFormatDatesNombres from './patchs/premodules/Patch20230209AddColumnFormatDatesNombres';
import Patch20230428UpdateUserArchivedField from './patchs/premodules/Patch20230428UpdateUserArchivedField';
import Patch20230512DeleteAllStats from './patchs/premodules/Patch20230512DeleteAllStats';
import Patch20230517DeleteAllStats from './patchs/premodules/Patch20230517DeleteAllStats';
import Patch20231003ForceUnicityCodeText from './patchs/premodules/Patch20231003ForceUnicityCodeText';
import Patch20231010ForceUnicityParamName from './patchs/premodules/Patch20231010ForceUnicityParamName';
import Patch20231010ForceUnicityVarCacheConfVarID from './patchs/premodules/Patch20231010ForceUnicityVarCacheConfVarID';
import Patch20231010ForceUnicityVarConfName from './patchs/premodules/Patch20231010ForceUnicityVarConfName';
import Patch20231030FilePathUnique from './patchs/premodules/Patch20231030FilePathUnique';
import Patch20231030ImagePathUnique from './patchs/premodules/Patch20231030ImagePathUnique';
import Patch20231116AddUniqPhoneUserConstraint from './patchs/premodules/Patch20231116AddUniqPhoneUserConstraint';
import Patch20231117AddUniqCookieNamePopup from './patchs/premodules/Patch20231117AddUniqCookieNamePopup';
import Patch20231120AddUniqCronPlanificationUID from './patchs/premodules/Patch20231120AddUniqCronPlanificationUID';
import Patch20240123ForceUnicityOnGeneratorWorkersUID from './patchs/premodules/Patch20240123ForceUnicityOnGeneratorWorkersUID';
import Patch20240206InitNullFieldsFromWidgets from './patchs/premodules/Patch20240206InitNullFieldsFromWidgets';
import Patch20240222MoveModuleFieldsToParamVOs from './patchs/premodules/Patch20240222MoveModuleFieldsToParamVOs';
import Patch20240222RenameFieldIdsToFieldNames from './patchs/premodules/Patch20240222RenameFieldIdsToFieldNames';
import Patch20240305EmptyPixelFieldsFromVarConf from './patchs/premodules/Patch20240305EmptyPixelFieldsFromVarConf';
import Patch20240329Adduniqlangconstraint from './patchs/premodules/Patch20240329Adduniqlangconstraint';
import Patch20240329Adduniqroleconstraint from './patchs/premodules/Patch20240329Adduniqroleconstraint';
import Patch20240329Adduniqtranslatabletextconstraint from './patchs/premodules/Patch20240329Adduniqtranslatabletextconstraint';
import Patch20240329Adduniquserconstraints from './patchs/premodules/Patch20240329Adduniquserconstraints';
import Patch20240329CeliaToOseliaDBWidget from './patchs/premodules/Patch20240329CeliaToOseliaDBWidget';
import Patch20240415Adduniqmail_id from './patchs/premodules/Patch20240415Adduniqmail_id';
import Patch20240515RunStatusToEnum from './patchs/premodules/Patch20240515RunStatusToEnum';
import Patch20240521ChangeFormatDbAssistants from './patchs/premodules/Patch20240521ChangeFormatDbAssistants';
import Patch20240530AddUniqNameMailCategory from './patchs/premodules/Patch20240530AddUniqNameMailCategory';
import Patch20240827DeleteVersionedAssistantsWithoutInstructions from './patchs/premodules/Patch20240827DeleteVersionedAssistantsWithoutInstructions';
import Patch20241107SwitchParamsUrlsPublics from './patchs/premodules/Patch20241107SwitchParamsUrlsPublics';
import Patch20241119DeleteSessions from './patchs/premodules/Patch20241119DeleteSessions';
import Patch2024OSELIAAssistantDescriptionNotNULL from './patchs/premodules/Patch2024OSELIAAssistantDescriptionNotNULL';
import Patch20250106createTableSupProbe from './patchs/premodules/Patch20250106createTableSupProbe';
import Patch20250228DeleteDuplicateGraphVO from './patchs/premodules/Patch20250228DeleteDuplicateGraphVO';
import Patch20250304DropArchivesConfVO from './patchs/premodules/Patch20250304TruncateArchivesConfVO';
import Patch20250507InitLastOseliaRunID from './patchs/premodules/Patch20250507InitLastOseliaRunID';
import Patch20250507OseliaRunTemplateNames from './patchs/premodules/Patch20250507OseliaRunTemplateNames';

export default class GeneratorPatchsListHandler {

    public static pre_modules_workers: IGeneratorWorker[] = [
        Patch20240329CeliaToOseliaDBWidget.getInstance(),
        Patch20240329Adduniqroleconstraint.getInstance(),
        Patch20240329Adduniqlangconstraint.getInstance(),
        Patch20240329Adduniquserconstraints.getInstance(),
        Patch20240329Adduniqtranslatabletextconstraint.getInstance(),
        Patch20240123ForceUnicityOnGeneratorWorkersUID.getInstance(),
        Patch20231003ForceUnicityCodeText.getInstance(),
        Patch20231010ForceUnicityVarConfName.getInstance(),
        Patch20231010ForceUnicityVarCacheConfVarID.getInstance(),
        Patch20231010ForceUnicityParamName.getInstance(),
        Patch20210803ChangeDIHDateType.getInstance(),
        Patch20210914ClearDashboardWidgets.getInstance(),
        Patch20211004ChangeLang.getInstance(),
        Patch20220111LocalizeCRONDate.getInstance(),
        Patch20220222RemoveVorfieldreffrombdd.getInstance(),
        Patch20220223Adduniqtranslationconstraint.getInstance(),
        Patch20220822ChangeTypeRecurrCron.getInstance(),
        Patch20230209AddColumnFormatDatesNombres.getInstance(),
        Patch20230512DeleteAllStats.getInstance(),
        Patch20230517DeleteAllStats.getInstance(),
        Patch20230428UpdateUserArchivedField.getInstance(),
        Patch20231030FilePathUnique.getInstance(),
        Patch20231030ImagePathUnique.getInstance(),
        Patch20231116AddUniqPhoneUserConstraint.getInstance(),
        Patch20231117AddUniqCookieNamePopup.getInstance(),
        Patch20231120AddUniqCronPlanificationUID.getInstance(),
        Patch20240206InitNullFieldsFromWidgets.getInstance(),
        Patch20240222MoveModuleFieldsToParamVOs.getInstance(),
        Patch20240222RenameFieldIdsToFieldNames.getInstance(),
        Patch20240305EmptyPixelFieldsFromVarConf.getInstance(),
        Patch20240415Adduniqmail_id.getInstance(),
        Patch20240515RunStatusToEnum.getInstance(),
        Patch20240521ChangeFormatDbAssistants.getInstance(),
        Patch20240530AddUniqNameMailCategory.getInstance(),
        Patch2024OSELIAAssistantDescriptionNotNULL.getInstance(),
        Patch20240827DeleteVersionedAssistantsWithoutInstructions.getInstance(),
        Patch20241107SwitchParamsUrlsPublics.getInstance(),
        Patch20241119DeleteSessions.getInstance(),
        Patch20122024TruncateLogsUpdated.getInstance(),
        // Patch20241129PreCreateEventsConfs.getInstance(),
        // Patch20241126TruncateLogs.getInstance(),
        Patch20250106createTableSupProbe.getInstance(),
        Patch20250228DeleteDuplicateGraphVO.getInstance(),
        Patch20250304DropArchivesConfVO.getInstance(),
        Patch20250507OseliaRunTemplateNames.getInstance(),
        Patch20250507InitLastOseliaRunID.getInstance(),
    ];

    public static post_modules_workers: IGeneratorWorker[] = [
        Patch20210804Changebddvarsindexes.getInstance(),
        Patch20210916SetParamPushData.getInstance(),
        Patch20211214ChangeVarTooltipTrads.getInstance(),
        Patch20220217ChangeLoginTrad.getInstance(),
        Patch20220222MigrationCodesTradsDB.getInstance(),
        Patch20220404UpdateDBBWidgetsDefaultSize.getInstance(),
        Patch20220401SetParamPushData.getInstance(),
        Patch20220713ChangeVarCacheType1To0.getInstance(),
        Patch20220725DashboardWidgetUpdate.getInstance(),
        Patch20220809ChangeDbbTrad.getInstance(),
        Patch20221216ChangeDbbTradsToIncludeLabels.getInstance(),
        Patch20221217ParamBlockVos.getInstance(),
        Patch20230428FavoriteWidgetsAreNotFilters.getInstance(),
        Patch20230517InitParamsStats.getInstance(),
        Patch20230519AddRightsFeedbackStateVO.getInstance(),
        Patch20230927AddSupervisionToCrons.getInstance(),
        Patch20230927AddAliveTimeoutToSomeBGThreads.getInstance(),
        Patch20231123AddRightsSharedFilters.getInstance(),
        Patch20240612DbbAdvancedDateFilterChangeIsFilter.getInstance(),
        Patch20240305MigrationCodesTradsMinusculesENV.getInstance(),
        Patch20240307DuplicateRightsSupervision.getInstance(),
        Patch20240409RetrieveOpenAIRunStats.getInstance(),
        Patch20240507AddDefaultRightsAPIsOselia.getInstance(),
        Patch20240514AddAssistantFunctionGetVoTypeDescription.getInstance(),
        Patch20240524InitExistingGPTMessageThreadAndRunGPTIds.getInstance(),
        Patch20240619DeclareFunctionOseliaGenerateImages.getInstance(),
        Patch20240619AddRightsSeeGeneratedImages.getInstance(),
        Patch20240701AddDbOseliaAssistantsetfonctions.getInstance(),
        Patch20240905InitAllThreadsOseliaToHavingContents.getInstance(),
        Patch20240905AddOseliaAssistantThreadTitleWriter.getInstance(),
        Patch20240906DeleteOldAssistantObjDBLinks.getInstance(),
        Patch20241010CreateLogType.getInstance(),
        Patch20240912PreinitOseliaPrices.getInstance(),
        Patch20240926PreInitOseliaThreadRoles.getInstance(),
        Patch20240926AddOseliaFunction_TRELLO_trello_create_card.getInstance(),
        Patch20240926AddOseliaFunction_TRELLO_trello_get_card.getInstance(),
        Patch20240926AddOseliaFunction_TRELLO_trello_get_lists_on_a_board.getInstance(),
        Patch20240926AddOseliaFunction_TRELLO_trello_search_trello.getInstance(),
        Patch20240926AddOseliaFunction_TRELLO_trello_get_members_of_a_board.getInstance(),
        Patch20240926AddOseliaFunction_TRELLO_trello_get_board.getInstance(),
        Patch20240926AddOseliaFunction_TRELLO_trello_update_card.getInstance(),
        Patch20240926AddOseliaFunction_TRELLO_trello_delete_card.getInstance(),
        Patch20240926AddOseliaFunction_TRELLO_trello_get_action.getInstance(),
        Patch20240926AddOseliaFunction_TRELLO_trello_get_board_actions.getInstance(),
        Patch20240926AddOseliaFunction_TRELLO_trello_get_board_cards.getInstance(),
        Patch20240926AddOseliaFunction_TRELLO_trello_get_card_actions.getInstance(),

        Patch20240930AddOseliaFunction_get_thread_text_content.getInstance(),

        Patch20240930AddOseliaFunction_send_teams_messages.getInstance(),
        Patch20241003AddParamForSplitterAndValidator.getInstance(),

        Patch20241004AddOseliaFunction_OSELIA_refuse_run.getInstance(),
        Patch20241004AddOseliaFunction_OSELIA_validate_run.getInstance(),
        Patch20241004AddOseliaFunction_OSELIA_append_new_child_run_step.getInstance(),

        Patch20241016AddOseliaFunction_OSELIA_get_cache_value.getInstance(),
        Patch20241016AddOseliaFunction_OSELIA_set_cache_value.getInstance(),
        Patch20241016AddOseliaFunction_OSELIA_get_assistant.getInstance(),
        Patch20241030SuiviCompetencesGroupeShortName.getInstance(),
        Patch20241224SupervisionFillProbe.getInstance(),
        Patch20250102AddRightsSupervisedProbe.getInstance(),
        // Patch20240409AddOseliaPromptForFeedback.getInstance(),

        Patch20241023AddOseliaFunction_azure_get_last_unread_email.getInstance(),

        Patch20241216LowerDefaultDBLogTypeToWARN.getInstance(),

        Patch20250115UpdateGraphsPalettes.getInstance(),
        Patch20250224AddDbbTrad.getInstance(),
        Patch20250224AddDefaultPalette.getInstance(),

        Patch20250303CheckDBsCycles.getInstance(),
        Patch20250331RenameFavoriteFilterOptions.getInstance(),
        Patch20250331RemoveValueTables.getInstance(),

        Patch20250505AddOseliaAssistantTraduction.getInstance(),
        Patch20250505AddOseliaRunTemplate_AssistantTraduction.getInstance(),


        Patch20250506AddOseliaFunction_OSELIA_agent_mem_set_mem.getInstance(),
        Patch20250506AddOseliaFunction_OSELIA_app_mem_set_mem.getInstance(),
        Patch20250506AddOseliaFunction_OSELIA_user_mem_set_mem.getInstance(),

        Patch20250506AddOseliaFunction_OSELIA_agent_mem_get_entries.getInstance(),
        Patch20250506AddOseliaFunction_OSELIA_app_mem_get_entries.getInstance(),
        Patch20250506AddOseliaFunction_OSELIA_user_mem_get_entries.getInstance(),

        Patch20250506AddOseliaFunction_OSELIA_agent_mem_get_keys.getInstance(),
        Patch20250506AddOseliaFunction_OSELIA_app_mem_get_keys.getInstance(),
        Patch20250506AddOseliaFunction_OSELIA_user_mem_get_keys.getInstance(),

        Patch20250507DebugFavoritFiltersLimits.getInstance(),
    ];
}