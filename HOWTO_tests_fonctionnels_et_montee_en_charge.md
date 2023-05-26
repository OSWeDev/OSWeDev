HOWTO tests fonctionnels et tests de montée en charge
PlayWright pour les tests en navigateurs HEADLESS + écriture des tests avec PlayWright codegen
Artillery pour les tests de montée en charge + https://github.com/artilleryio/artillery-engine-playwright#readme pour le lien avec PlayWright

1 - Installer l'extension pour VSCODE
https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright

2 - Lancer l'action "Install Playwright" dans VSCODE sur le projet cible/client (CTRL+SHIFT+P puis "Install Playwright" - cf la page du plugin pour les images/explications complémentaires sur le lancement de l'action)

3 - A la fin de l'installation, il propose de lancer "npx playwright test" le faire pour confirmer l'installation et avoir un aperçu d'un test + à la fin du test il propose "npx playwright show-report" même démarche c'est intéressant

4 - On peut lancer "npx playwright codegen" pour lancer le générateur de test en fonction d'une navigation. ça ouvre un navigateur et ça record toutes les actions pour concevoir le test

5 - Dans le projet, pour gérer les comportements pré-test et post-tests :
    Créer une classe (pour le moment dans le répertoire server, on verra si on peut déplacer dans tests plus tard) PlayWrightTestsController par exemple qui hérite de PlayWrightServerController (dans OSWEDEV)
    La classe doit a minima faire ça (cf projets métiers déjà en place): 

    import PlayWrightServerController from 'oswedev/dist/server/modules/PlayWright/PlayWrightServerController';
    
    export default class PlayWrightTestsController extends PlayWrightServerController {

        public static getInstance(): PlayWrightServerController {
            if (!PlayWrightServerController.instance) {
                PlayWrightServerController.instance = new PlayWrightTestsController();
            }
            return PlayWrightServerController.instance;
        }

        protected constructor() {
            super();
        }

        public async before_all() {
        }

        public async after_all() {
        }
    }

    Ajouter PlayWrightTestsController.getInstance(); dans le fichier server.ts du projet métier pour init le controller (par exemple avant "export default class Server extends ServerBase {")

    Ensuite on peut changer le fonctionnement des before_all, after_all qui se lancent avant/après de faire les tests, et on peut rajouter des méthodes async before_each_[test_title]() {} et after_each_[test_title]() {}
        où test_title est le titre du test (défini dans le fichier de test en replace ([^a-bA-B0-9]) par _) pour les méthodes qui se lancent avant et apèrs chaque test. Ces méthodes seront
        alors lancées côté serveur donc on peut utiliser les modules librement pour init / clean une base pour un test fonctionnel.
    Il faudra aussi avoir le fichier de définition des tests :

test.before_each(async ({ page }, testInfo) => {
  console.log(`Running ${testInfo.title}`);
  await page.goto('https://my.start.url/');
});
