import Dates from "../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import StatsController from "../../../../shared/modules/Stats/StatsController";
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";
import IDBDisconnectionHanbler from "../../../../shared/tools/IDBDisconnectionHanbler";
import ThreadHandler from "../../../../shared/tools/ThreadHandler";
import ModuleServiceBase from '../../ModuleServiceBase';
import TeamsAPIServerController from "../../TeamsAPI/TeamsAPIServerController";

export default class DBDisconnectionServerHandler implements IDBDisconnectionHanbler {

    public db_is_disconnected: boolean = false;

    public db_is_disconnected_since: number = null;

    public mark_as_disconnected() {

        if (this.db_is_disconnected) {
            return;
        }

        // On commence par alerter sur la déconnexion
        ConsoleHandler.error('!!!! DB Disconnected !!!!');

        this.db_is_disconnected = true;
        this.db_is_disconnected_since = Dates.now();

        // On lance le process de vérification de rétablissement de la connexion
        this.check_reconnection();
    }

    public async wait_for_reconnection(): Promise<void> {

        if (!this.db_is_disconnected) {
            return;
        }

        while (this.db_is_disconnected) {
            await ThreadHandler.sleep(1000, "DBDisconnectionServerHandler.wait_for_reconnection");
        }
    }

    private async check_reconnection() {

        if (!this.db_is_disconnected) {
            return;
        }

        // On attend 1 seconde avant de vérifier
        await ThreadHandler.sleep(1000, "DBDisconnectionServerHandler.check_reconnection");

        // On vérifie si la connexion est rétablie => on appelle directement db_ pour éviter les contrôles et reprises sur erreurs, qui nous ont déjà amenés ici
        await ModuleServiceBase.getInstance()['db_'].query("SELECT 1").then(() => {
            this.mark_as_connected();
        }).catch(() => {
            this.check_reconnection();
        });
    }

    private async mark_as_connected() {

        if (!this.db_is_disconnected) {
            return;
        }

        // On commence par alerter sur la reconnexion
        ConsoleHandler.warn('!!!! DB Reconnected !!!!');

        this.db_is_disconnected = false;

        // On peut faire un bilan sur la déconnexion, qu'on peut cette fois-ci envoyer par Teams
        let disconnection_duration = Dates.now() - this.db_is_disconnected_since;
        this.db_is_disconnected_since = null;

        ConsoleHandler.warn('DB Disconnection duration: ' + disconnection_duration + 'secs');
        let msg = '<p class="alert">Le serveur d\'application a été déconnecté de la base de données pendant <strong>' + disconnection_duration + ' secondes</strong>.</p>' +
            '<p>Il est possible que des données aient été :</p>' +
            '<ul>' +
            '<li>Perdues</li>' +
            '<li>Corrompues</li>' +
            '<li>Dupliquées</li>' +
            '</ul>' +
            '<p>Vérifier le bon fonctionnement de l\'application et les logs de l\'application.</p>' +
            '<p class="info">Ce message est envoyé par le thread :</p>' +
            '<p><code>' + StatsController.THREAD_NAME + '</code></p>' +
            '<p>Il est très probable que ce message soit transmis également par les autres threads.</p>';

        await TeamsAPIServerController.send_teams_error(
            'RAPPORT de DECONNEXION de la base de données !',
            msg);
    }
}