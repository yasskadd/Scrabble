import { Request, Response, Router } from 'express';
import { Service } from 'typedi';

@Service()
export class ProfilePictureController {
    router: Router;

    constructor() {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.post('/profilePicture', async (req: Request, res: Response) => {});
    }
}
