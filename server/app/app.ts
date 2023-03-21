import { HttpException } from '@app/classes/http.exception';
import { HighScoreController } from '@app/controllers/high-score.controller';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as express from 'express';
import { StatusCodes } from 'http-status-codes';
import * as logger from 'morgan';
import * as multer from 'multer';
import * as swaggerJSDoc from 'swagger-jsdoc';
import * as swaggerUi from 'swagger-ui-express';
import { Service } from 'typedi';
import { AuthentificationController } from './controllers/authentification.controller';
import { DictionaryController } from './controllers/dictionary.controller';
import { HistoryController } from './controllers/history.controller';
import { ProfilePictureController } from './controllers/profile-picture.controller';
import { VirtualPlayerController } from './controllers/virtual-players.controller';

@Service()
export class Application {
    app: express.Application;
    private readonly internalError: number = StatusCodes.INTERNAL_SERVER_ERROR;
    private readonly swaggerOptions: swaggerJSDoc.Options;

    constructor(
        private readonly highScoreController: HighScoreController,
        private readonly virtualPlayerController: VirtualPlayerController,
        private readonly historyController: HistoryController,
        private readonly dictionaryController: DictionaryController,
        private readonly authentificationController: AuthentificationController,
        private readonly profilePictureController: ProfilePictureController,
    ) {
        this.app = express();

        this.swaggerOptions = {
            swaggerDefinition: {
                openapi: '3.0.0',
                info: {
                    title: 'Cadriciel Serveur',
                    version: '1.0.0',
                },
            },
            apis: ['**/*.ts'],
        };

        this.config();

        this.bindRoutes();
    }

    bindRoutes(): void {
        this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(this.swaggerOptions)));
        this.app.use('/highScore', this.highScoreController.router);
        this.app.use('/history', this.historyController.router);
        this.app.use('/dictionary', this.dictionaryController.router);
        this.app.use('/virtualPlayer', this.virtualPlayerController.router);
        this.app.use('/auth', this.authentificationController.router);
        this.app.use('/image', this.profilePictureController.router);
        this.app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(this.swaggerOptions)));
        this.app.use('/', (req, res) => {
            res.redirect('/docs');
        });
        this.errorHandling();
    }

    private config(): void {
        // Middlewares configuration
        this.app.use(logger('dev'));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser());
        this.app.use(cors({ credentials: true, origin: true }));
    }

    private errorHandling(): void {
        // When previous handlers have not served a request: path wasn't found
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            const err: HttpException = new HttpException('Not Found');
            next(err);
        });

        this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (err instanceof multer.MulterError) {
                res.status(StatusCodes.BAD_REQUEST).send({
                    message: 'Error uploading file',
                    error: err.message,
                });
            } else next(err);
        });

        // development error handler
        // will print stacktrace
        if (this.app.get('env') === 'development') {
            this.app.use((err: HttpException, req: express.Request, res: express.Response) => {
                res.status(err.status || this.internalError);
                res.send({
                    message: err.message,
                    error: err,
                });
            });
        }

        // production error handler
        // no stacktraces leaked to user (in production env only)
        this.app.use((err: HttpException, req: express.Request, res: express.Response) => {
            res.status(err.status || this.internalError);
            res.send({
                message: err.message,
                error: {},
            });
        });
    }
}
