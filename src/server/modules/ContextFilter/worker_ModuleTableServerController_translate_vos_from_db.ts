import { parentPort, workerData } from 'worker_threads';
import ModuleTableServerController from '../DAO/ModuleTableServerController';

const translated = ModuleTableServerController.translate_vos_from_db(workerData);
parentPort?.postMessage(translated);
