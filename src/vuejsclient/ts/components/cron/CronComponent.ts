import Component from 'vue-class-component';
import ModuleCron from '../../../../shared/modules/Cron/ModuleCron';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import CronWorkerPlanification from '../../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';

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
}