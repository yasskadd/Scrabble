import { ScoreStorageService } from '@app/services/database/score-storage.service';
import { UserStatsStorageService } from '@app/services/database/user-stats-storage.service';
import { Request, Response, Router } from 'express';
import { Service } from 'typedi';

@Service()
export class HighScoreController {
    router: Router;

    constructor(private scoreStorage: ScoreStorageService, private userStatsStorage: UserStatsStorageService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/classique', async (req: Request, res: Response) => {
            const highScore = await this.userStatsStorage.getTopRanking();
            res.json(highScore);
        });

        this.router.get('/log2990', async (req: Request, res: Response) => {
            const highScore = await this.scoreStorage.getLOG2990TopScores();
            res.json(highScore);
        });

        this.router.delete('/reset', async (req: Request, res: Response) => {
            const NO_CONTENT = 204;
            await this.scoreStorage.resetHighScores();
            res.sendStatus(NO_CONTENT);
        });
    }
}
