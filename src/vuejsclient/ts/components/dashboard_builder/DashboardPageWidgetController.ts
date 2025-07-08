import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import LocaleManager from '../../../../shared/tools/LocaleManager';

export default class DashboardPageWidgetController {

    public static async delete_widget(
        page_widget: DashboardPageWidgetVO,
        set_selected_widget: (widget: DashboardPageWidgetVO) => void,
        snotify: any // Assuming snotify is an instance of a notification service
    ) {

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        snotify.confirm(LocaleManager.label('DashboardBuilderBoardComponent.delete_widget.body'), LocaleManager.label('DashboardBuilderBoardComponent.delete_widget.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: LocaleManager.t('YES'),
                    action: async (toast) => {
                        snotify.remove(toast.id);
                        snotify.async(
                            LocaleManager.label('DashboardBuilderBoardComponent.delete_widget.start'),
                            () => new Promise(async (resolve, reject) => {

                                try {

                                    await ModuleDAO.instance.deleteVOs([page_widget]);
                                    set_selected_widget(null);

                                    resolve({
                                        body: LocaleManager.label('DashboardBuilderBoardComponent.delete_widget.ok'),
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                } catch (error) {
                                    reject({
                                        body: error,
                                        config: {
                                            timeout: 10000,
                                            showProgressBar: true,
                                            closeOnClick: false,
                                            pauseOnHover: true,
                                        },
                                    });
                                }
                            })
                        );
                    },
                    bold: false
                },
                {
                    text: LocaleManager.t('NO'),
                    action: (toast) => {
                        snotify.remove(toast.id);
                    }
                }
            ]
        });
    }
}