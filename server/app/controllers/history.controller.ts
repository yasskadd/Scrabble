import { HistoryStorageService } from '@app/services/database/history-storage.service';
import { Request, Response, Router } from 'express';
import { Service } from 'typedi';

@Service()
export class HistoryController {
    router: Router;

    constructor(private readonly historyStorage: HistoryStorageService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/', async (req: Request, res: Response) => {
            const history = await this.historyStorage.getHistory();
            res.json(history);
        });

        this.router.delete('/', async (req: Request, res: Response) => {
            const NO_CONTENT = 204;
            await this.historyStorage.clearHistory();
            res.sendStatus(NO_CONTENT);
        });
    }
}
