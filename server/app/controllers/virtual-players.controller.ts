import { VirtualPlayersStorageService } from '@app/services/database/virtual-players-storage.service';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

const HTTP_STATUS_CREATED = StatusCodes.CREATED;

@Service()
export class VirtualPlayerController {
    router: Router;

    constructor(private readonly virtualPlayerStorage: VirtualPlayersStorageService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/beginner', async (req: Request, res: Response) => {
            const beginnerBot = await this.virtualPlayerStorage.getBeginnerBot();
            res.json(beginnerBot);
        });

        this.router.get('/expert', async (req: Request, res: Response) => {
            const expertBots = await this.virtualPlayerStorage.getExpertBot();
            res.json(expertBots);
        });

        this.router.post('/', async (req: Request, res: Response) => {
            const bot = req.body;
            await this.virtualPlayerStorage.addBot(bot);
            res.sendStatus(HTTP_STATUS_CREATED);
        });

        this.router.put('/', async (req: Request, res: Response) => {
            const bot = req.body;
            await this.virtualPlayerStorage.replaceBotName(bot);
            res.sendStatus(HTTP_STATUS_CREATED);
        });

        this.router.patch('/remove', async (req: Request, res: Response) => {
            const NO_CONTENT = 204;
            const bot = req.body;
            await this.virtualPlayerStorage.removeBot(bot);
            res.sendStatus(NO_CONTENT);
        });

        this.router.delete('/reset', async (req: Request, res: Response) => {
            const NO_CONTENT = 204;
            await this.virtualPlayerStorage.resetBot();
            res.sendStatus(NO_CONTENT);
        });
    }
}
