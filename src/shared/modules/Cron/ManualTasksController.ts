import * as moment from 'moment';
import RangeHandler from '../../tools/RangeHandler';
import TypesHandler from '../../tools/TypesHandler';
import IRange from '../DataRender/interfaces/IRange';
import HourRange from '../DataRender/vos/HourRange';
import NumRange from '../DataRender/vos/NumRange';
import TSRange from '../DataRender/vos/TSRange';
import IDistantVOBase from '../IDistantVOBase';
import VOsTypesManager from '../VOsTypesManager';

export default class ManualTasksController {

    public static getInstance(): ManualTasksController {
        if (!ManualTasksController.instance) {
            ManualTasksController.instance = new ManualTasksController();
        }
        return ManualTasksController.instance;
    }

    private static instance: ManualTasksController = null;

    public registered_manual_tasks_by_name: { [name: string]: () => Promise<any> } = {};

    private constructor() { }
}