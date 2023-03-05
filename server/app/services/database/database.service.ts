import { DatabaseCollection } from '@app/classes/database-collection.class';
import { Service } from 'typedi';

@Service()
export class DatabaseService {
    histories: DatabaseCollection;
    scores: DatabaseCollection;
    virtualNames: DatabaseCollection;
    dictionaries: DatabaseCollection;
    users: DatabaseCollection;

    constructor() {
        this.histories = new DatabaseCollection('Histories');
        this.scores = new DatabaseCollection('Scores');
        this.virtualNames = new DatabaseCollection('VirtualNames');
        this.dictionaries = new DatabaseCollection('Dictionary');
        this.users = new DatabaseCollection('Users');
    }

    async connect() {
        await this.scores.connect();
        await this.dictionaries.connect();
        await this.virtualNames.connect();
        await this.histories.connect();
        await this.users.connect();
    }
}
