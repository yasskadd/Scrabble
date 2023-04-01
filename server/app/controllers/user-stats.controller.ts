import { UsersStatsStorageService } from '@app/services/database/user-stats-storage.service';
import { Request, Response, Router } from 'express';
import { Service } from 'typedi';

@Service()
export class UserStatsController {
    router: Router;

    constructor(private userStatsStorage: UsersStatsStorageService) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/:id', async (req: Request, res: Response) => {
            const id = req.params.id;
            const userStats = await this.userStatsStorage.getUserStats(id);
            res.json(userStats);
        });
    }
}
