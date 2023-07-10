import ServerAPIController from '../../../src/server/modules/API/ServerAPIController';
import APIControllerWrapper from '../../../src/shared/modules/API/APIControllerWrapper';
APIControllerWrapper.API_CONTROLLER = ServerAPIController.getInstance();

import { test, expect } from "playwright-test-coverage";

import SemaphoreHandler from '../../../src/shared/tools/SemaphoreHandler';
import ThreadHandler from '../../../src/shared/tools/ThreadHandler';
import { all_promises } from '../../../src/shared/tools/PromiseTools';

test('TestSemaphoreHandler: test semaphore async return_if_unavailable true', async () => {

    let nb = 0;
    let count = 100;

    let increment = async () => {
        await ThreadHandler.sleep(100, 'TestSemaphoreHandler');
        nb++;
    };

    // On await, donc la première exec on attend le résultat de la fonction increment et le renvoie, donc la libération du semaphore
    nb = 0;
    count = 100;
    while (count--) {
        await SemaphoreHandler.semaphore_async('TestSemaphoreHandler', increment, true);
    }
    expect(nb).toStrictEqual(100);

    // On fait en // donc le semaphore est pas libéré avant les 100 ms d'attente, donc on incrémente qu'il fois
    nb = 0;
    count = 100;
    let promises = [];
    while (count--) {
        promises.push(SemaphoreHandler.semaphore_async('TestSemaphoreHandler', increment, true));
    }
    await all_promises(promises);
    expect(nb).toStrictEqual(1);
});

test('TestSemaphoreHandler: test semaphore async return_if_unavailable false', async () => {

    let nb = 0;
    let count = 100;

    let increment = async () => {
        await ThreadHandler.sleep(100, 'TestSemaphoreHandler');
        nb++;
    };

    // On await, donc la première exec on attend le résultat de la fonction increment et le renvoie, donc la libération du semaphore
    nb = 0;
    count = 100;
    while (count--) {
        await SemaphoreHandler.semaphore_async('TestSemaphoreHandler', increment, false);
    }
    expect(nb).toStrictEqual(100);

    // On fait en // donc le semaphore est pas libéré avant les 100 ms d'attente, mais on await la libération du sémaphore pour chaque appel
    nb = 0;
    count = 100;
    let promises = [];
    while (count--) {
        promises.push(SemaphoreHandler.semaphore_async('TestSemaphoreHandler', increment, false));
    }
    await all_promises(promises);
    expect(nb).toStrictEqual(100);
});


test('TestSemaphoreHandler: test semaphore sync', async () => {

    let nb = 0;
    let count = 100;

    let increment = () => {
        nb++;
    };

    nb = 0;
    count = 100;
    while (count--) {
        SemaphoreHandler.semaphore_sync('TestSemaphoreHandler', increment);
    }
    expect(nb).toStrictEqual(100);

    nb = 0;
    count = 100;
    let promises = [];
    while (count--) {
        promises.push(async () => { SemaphoreHandler.semaphore_sync('TestSemaphoreHandler', increment); });
    }
    await all_promises(promises);
    expect(nb).toBeLessThan(100);
});