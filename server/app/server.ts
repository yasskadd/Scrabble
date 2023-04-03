import { Application } from '@app/app';
import * as http from 'http';
import { AddressInfo } from 'net';
import { Service } from 'typedi';
import { DatabaseService } from './services/database/database.service';
import { SocketManager } from './services/socket/socket-manager.service';
import { SocketSubscribeHandler } from './services/socket/socket-subscribe-handler.service';
import * as https from 'https';
import * as fs from 'fs';

@Service()
export class Server {
    private static readonly appPort: string | number | boolean = Server.normalizePort(process.env.PORT || '3000');
    private static readonly secureAppPort: string | number | boolean = Server.normalizePort(process.env.PORT || '3443');
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    private static readonly baseTen: number = 10;
    private server: http.Server;
    private secureServer: https.Server;

    constructor(
        private readonly application: Application,
        private socketManager: SocketManager,
        private handler: SocketSubscribeHandler,
        private databaseService: DatabaseService,
    ) {}

    private static normalizePort(val: number | string): number | string | boolean {
        const port: number = typeof val === 'string' ? parseInt(val, this.baseTen) : val;
        if (isNaN(port)) {
            return val;
        } else if (port >= 0) {
            return port;
        } else {
            return false;
        }
    }

    async init(): Promise<void> {
        this.application.app.set('port', Server.secureAppPort);

        this.server = http.createServer(this.application.app);
        this.secureServer = https.createServer(
            {
                key: fs.readFileSync('app/certs/server.key'),
                cert: fs.readFileSync('app/certs/server.pem'),
                passphrase: '2345',
            },
            this.application.app,
        );
        this.socketManager.init(this.secureServer);
        this.socketManager.handleSockets();
        this.handler.initSocketsEvents();

        this.server.listen(Server.appPort);
        this.secureServer.listen(Server.secureAppPort);
        this.server.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        this.server.on('listening', () => this.onListening(this.server));
        this.secureServer.on('error', (error: NodeJS.ErrnoException) => this.onError(error));
        this.secureServer.on('listening', () => this.onListening(this.secureServer));

        try {
            await this.databaseService.connect();
        } catch {
            process.exit(1);
        }
    }

    private onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind: string = typeof Server.appPort === 'string' ? 'Pipe ' + Server.appPort : 'Port ' + Server.appPort;
        switch (error.code) {
            case 'EACCES':
                // eslint-disable-next-line no-console
                console.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                // eslint-disable-next-line no-console
                console.error(`${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    private onListening(server: any): void {
        const addr = server.address() as AddressInfo;
        const bind: string = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        // eslint-disable-next-line no-console
        console.log(`Listening on ${bind}`);
    }
}
