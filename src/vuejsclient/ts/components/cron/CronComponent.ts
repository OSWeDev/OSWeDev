import Component from 'vue-class-component';
import ModuleCron from '../../../../shared/modules/Cron/ModuleCron';
import ManualTasksController from '../../../../shared/modules/Cron/ManualTasksController';
import ModuleSupervision from '../../../../shared/modules/Supervision/ModuleSupervision';
import SupervisionController from '../../../../shared/modules/Supervision/SupervisionController';
import CronWorkerPlanification from '../../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './CronComponent.scss';

@Component({
    template: require('./CronComponent.pug'),
    components: {}
})
export default class CronComponent extends VueComponentBase {

    private is_running: boolean = false;

    private cron_workers: CronWorkerPlanification[] = [];

    private async run_cron() {
        this.is_running = true;

        ModuleCron.getInstance().executeWorkersManually();

        this.snotify.info(this.label('CronComponent.info.executeWorkersManually.started'));

        let self = this;
        setTimeout(() => {
            self.is_running = false;
        }, 1000);
    }

    get manual_tasks(): string[] {
        return Object.keys(ManualTasksController.getInstance().registered_manual_tasks_by_name);
    }

    private async run_manual_task(name: string) {
        this.snotify.info(this.label('CronComponent.info.run_manual_task.started'));
        await ModuleCron.getInstance().run_manual_task(name);
        this.snotify.info(this.label('CronComponent.info.run_manual_task.ended'));
    }

    private async mounted() {
        this.cron_workers = await ModuleDAO.getInstance().getVos<CronWorkerPlanification>(CronWorkerPlanification.API_TYPE_ID);
    }

    private async run_cron_individuel(cron_worker: CronWorkerPlanification) {
        this.is_running = true;

        ModuleCron.getInstance().executeWorkerManually(cron_worker.worker_uid);

        this.snotify.info(this.label('CronComponent.info.executeWorkerManually.started'));

        let self = this;
        setTimeout(() => {
            self.is_running = false;
        }, 1000);
    }

    get supervised_items(): string[] {
        return Object.keys(SupervisionController.getInstance().registered_controllers);
    }

    private async update_supervised_items(api_type_id: string) {
        this.snotify.info(this.label('CronComponent.info.update_supervised.started'));
        await ModuleSupervision.getInstance().execute_manually(api_type_id);
        this.snotify.info(this.label('CronComponent.info.update_supervised.ended'));
    }
}