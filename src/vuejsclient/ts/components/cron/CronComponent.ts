import Component from 'vue-class-component';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleCron from '../../../../shared/modules/Cron/ModuleCron';
import CronWorkerPlanification from '../../../../shared/modules/Cron/vos/CronWorkerPlanification';
import ModuleSupervision from '../../../../shared/modules/Supervision/ModuleSupervision';
import SupervisionController from '../../../../shared/modules/Supervision/SupervisionController';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import './CronComponent.scss';

@Component({
    template: require('./CronComponent.pug'),
    components: {}
})
export default class CronComponent extends VueComponentBase {

    private is_running: boolean = false;

    private cron_workers: CronWorkerPlanification[] = [];
    private manual_tasks: string[] = [];
    private patch_premodules: string[] = [];
    private patch_postmodules: string[] = [];

    get supervised_items(): string[] {
        return Object.keys(SupervisionController.getInstance().registered_controllers);
    }

    private async run_cron() {
        this.is_running = true;

        ModuleCron.getInstance().executeWorkersManually();

        this.snotify.info(this.label('CronComponent.info.executeWorkersManually.started'));

        const self = this;
        setTimeout(() => {
            self.is_running = false;
        }, 1000);
    }

    private async run_manual_task(name: string) {
        this.snotify.info(this.label('CronComponent.info.run_manual_task.started'));
        await ModuleCron.getInstance().run_manual_task(name);
        this.snotify.info(this.label('CronComponent.info.run_manual_task.ended'));
    }

    private async mounted() {
        this.cron_workers = await query(CronWorkerPlanification.API_TYPE_ID).select_vos<CronWorkerPlanification>();
        this.manual_tasks = await ModuleCron.getInstance().get_manual_tasks();
        this.patch_premodules = await ModuleCron.getInstance().get_patch_premodules();
        this.patch_postmodules = await ModuleCron.getInstance().get_patch_postmodules();
    }

    private async run_cron_individuel(cron_worker: CronWorkerPlanification) {
        this.is_running = true;

        ModuleCron.getInstance().executeWorkerManually(cron_worker.worker_uid);

        this.snotify.info(this.label('CronComponent.info.executeWorkerManually.started'));

        const self = this;
        setTimeout(() => {
            self.is_running = false;
        }, 1000);
    }

    private async update_supervised_items(api_type_id: string) {
        this.snotify.info(this.label('CronComponent.info.update_supervised.started'));
        await ModuleSupervision.getInstance().execute_manually(api_type_id);
        this.snotify.info(this.label('CronComponent.info.update_supervised.ended'));
    }


    private async rerun_patch_premodule(patch_premodule: string) {
        this.snotify.info(this.label('CronComponent.info.patch_premodule.started'));
        await ModuleCron.getInstance().rerun_patch(patch_premodule);
        this.snotify.info(this.label('CronComponent.info.patch_premodule.ended'));
    }


    private async rerun_patch_postmodule(patch_postmodule: string) {
        this.snotify.info(this.label('CronComponent.info.patch_postmodule.started'));
        await ModuleCron.getInstance().rerun_patch(patch_postmodule);
        this.snotify.info(this.label('CronComponent.info.patch_postmodule.ended'));
    }
}