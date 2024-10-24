import ModuleMaintenance from "../../../../shared/modules/Maintenance/ModuleMaintenance";
import ConfigurationService from "../../../env/ConfigurationService";
import ICronWorker from "../../Cron/interfaces/ICronWorker";
import TeamsAPIServerController from "../TeamsAPIServerController";
import * as https from 'https';

export default class SendMessageWorker implements ICronWorker {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!SendMessageWorker.instance) {
            SendMessageWorker.instance = new SendMessageWorker();
        }
        return SendMessageWorker.instance;
    }

    private static instance: SendMessageWorker = null;

    private constructor() {
    }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "SendMessageWorker";
    }
    private async sendObjectToWorkflow() {
        const url = new URL('https://prod2-05.francecentral.logic.azure.com/workflows/097962a8d0cf41e0ac3ba76200638dbf/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=v_1_G49qNqoGNQS2UMgPXxgQ7ZtKugp5n703qgCWBaY');
        const exampleObject: {
            channelId: string;
            groupId: string;
            attachments: Array<{
                name: string;
                contentType: string;
                content: {
                    type: string;
                    body: Array<{
                        type: string;
                        text: string;
                        weight?: string;
                        size?: string;
                        wrap?: boolean;
                        spacing?: string;
                        style?: string;
                    }>;
                    $schema: string;
                    version: string;
                };
            }>;
        } = {
            channelId: "19:Qukt3bJpCBi5dR00QoFMvDPDEhp4ALyuZvbuI3jto6w1@thread.tacv2",
            groupId: "713db04d-6258-4767-b837-f48a87d3d9ae",
            attachments: [
                {
                    name: "Example Attachment",
                    contentType: "application/vnd.microsoft.card.adaptive",
                    content: {
                        type: "AdaptiveCard",
                        body: [
                            {
                                type: "TextBlock",
                                text: "This is a text block",
                                weight: "bolder",
                                size: "medium",
                                wrap: true
                            },
                            {
                                type: "Image",
                                text: "This is an image",
                                spacing: "medium",
                                style: "emphasis"
                            }
                        ],

                        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
                        version: "1.2"
                    }
                }
            ]
        };
        const data = JSON.stringify(exampleObject);

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        return new Promise<void>((resolve, reject) => {
            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200 || res.statusCode === 202) {
                        console.error('Response:', responseData, res.statusCode);
                        resolve();
                    } else {
                        console.error('Error:', res.statusCode, responseData);
                        reject(new Error(`Request failed with status code ${res.statusCode}`));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('Request error:', error);
                reject(error);
            });

            req.write(data);
            req.end();
        });
    }
    // istanbul ignore next: nothing to test : work
    public async work() {
        this.sendObjectToWorkflow();
        // TeamsAPIServerController.send_teams_info('TITRE', 'MESSAGE');
    }
}