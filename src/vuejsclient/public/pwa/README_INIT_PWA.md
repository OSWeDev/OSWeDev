<!-- INITIALISER PWA DANS APPLI -->
----------------------------------------------------------------------------------------------------------------------------------
1. Installation des packages dans l'application :
npm i webpack-pwa-manifest --save-dev
npm i workbox-webpack-plugin --save-dev
----------------------------------------------------------------------------------------------------------------------------------


----------------------------------------------------------------------------------------------------------------------------------
2. Modifier fichier webpack_common.config.ts
Ajouter l'import suivant en haut du fichier :
import WebpackPwaManifest = require('webpack-pwa-manifest');

Ajouter les lignes suivantes pour remplir le common_plugins :
if (config.ACTIVATE_PWA) {
    common_plugins.push(
        new WebpackPwaManifest({
            name: config.APP_TITLE,
            short_name: config.APP_TITLE,
            description: config.APP_TITLE,
            background_color: BACKGROUND_COLOR,
            crossorigin: 'use-credentials',
            theme_color: THEME_COLOR,
            orientation: 'any',
            start_url: config.BASE_URL + 'login',
            ios: {
                "apple-touch-icon": config.BASE_URL + 'client/public/img/logo_pwa.png',
            },
            icons: [
                {
                    src: path.resolve(projectRoot, 'src/client/public/img/logo_pwa.png'),
                    sizes: [96, 128, 192, 512], // multiple sizes,
                },
                {
                    src: path.resolve(projectRoot, 'src/client/public/img/logo_pwa.png'),
                    size: 96,
                    purpose: 'maskable'
                }
            ]
        })
    );
}
----------------------------------------------------------------------------------------------------------------------------------


----------------------------------------------------------------------------------------------------------------------------------
3. Logo PWA
Ajouter le logo de l'application dans le répertoire défini au dessus
Dans notre cas : src/client/public/img/logo_pwa.png
----------------------------------------------------------------------------------------------------------------------------------


----------------------------------------------------------------------------------------------------------------------------------
4. Modifier fichier webpack_client.config.ts
Ajouter l'import suivant en haut du fichier :
import WorkboxPlugin = require('workbox-webpack-plugin');

Créer une variable plugins_client pour pouvoir remplir le default plugins avec des conditions
Exemple :

const config = ConfigurationService.getInstance().getNodeConfiguration();

var plugins_client = [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
        title: 'OSWEDEV',
        filename: '../index.html',
        template: path.join(__dirname, 'views/index.pug')
    })
];

if (config.ACTIVATE_PWA) {
    plugins_client.push(
        new WorkboxPlugin.InjectManifest({
            swSrc: path.resolve(projectRoot, "node_modules/oswedev/dist/vuejsclient/public/pwa/client-src-sw.js"),
            swDest: path.resolve(projectRoot, "dist/vuejsclient/public/pwa/client-sw." + version + ".js"),
            include: [
                /.*/,
            ]
        } as any)
    );
}

Bien penser à remplacer la ligne plugins dans export.default par :
plugins: plugins_client.concat(common_plugins),
----------------------------------------------------------------------------------------------------------------------------------


----------------------------------------------------------------------------------------------------------------------------------
5. Modifier fichier webpack_login.config.ts
Ajouter l'import suivant en haut du fichier :
import WorkboxPlugin = require('workbox-webpack-plugin');

Créer une variable plugins_login pour pouvoir remplir le default plugins avec des conditions
Exemple :

const config = ConfigurationService.getInstance().getNodeConfiguration();

var plugins_login = [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
        title: 'OSWEDEV',
        filename: '../login.html',
        template: path.join(__dirname, 'views/login.pug')
    }),
];

if (config.ACTIVATE_PWA) {
    plugins_login.push(
        new WorkboxPlugin.InjectManifest({
            swSrc: path.resolve(projectRoot, "node_modules/oswedev/dist/vuejsclient/public/pwa/login-src-sw.js"),
            swDest: path.resolve(projectRoot, "dist/vuejsclient/public/pwa/login-sw." + version + ".js"),
            include: [
                /.*/,
            ]
        } as any)
    );
}

Bien penser à remplacer la ligne plugins dans export.default par :
plugins: plugins_login.concat(common_plugins),
----------------------------------------------------------------------------------------------------------------------------------


----------------------------------------------------------------------------------------------------------------------------------
6. Modifier le STATIC_ENV_PARAMS pour activer le PWA sur les environnements souhaités
ACTIVATE_PWA: true
----------------------------------------------------------------------------------------------------------------------------------


----------------------------------------------------------------------------------------------------------------------------------
7. Vérifier le STATIC_ENV_PARAMS
Vérifier que le BASE_URL se termine bien par / pour que le start_url défini dans le fichier webpack_common.config.ts
----------------------------------------------------------------------------------------------------------------------------------