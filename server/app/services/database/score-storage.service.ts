import { Document } from 'mongodb';
import { Service } from 'typedi';
import { DatabaseService } from './database.service';

type ScoreInfo = { username: string; type: string; score: number };

@Service()
export class ScoreStorageService {
    private static maxLength: number;
    private static lastElement: number;
    constructor(private database: DatabaseService) {
        ScoreStorageService.maxLength = 5;
        ScoreStorageService.lastElement = ScoreStorageService.maxLength + 1;
    }
    async addTopScores(scoreInfo: ScoreInfo) {
        await this.populateDb();
        const currentTopScores = await this.database.scores.fetchDocuments({ type: scoreInfo.type });
        const scorePlace = this.getTopScoresPosition(currentTopScores, scoreInfo.score);
        if (scorePlace === ScoreStorageService.lastElement) return;
        const currentElement = currentTopScores[scorePlace - 1];
        if (currentElement === undefined) return;
        if (currentElement.score === scoreInfo.score && !this.isNameAlreadyThere(scoreInfo.username, currentElement.username)) {
            await this.addPlayerToSameScore(scoreInfo, scorePlace, currentElement);
            return;
        }
        if (currentElement.score !== scoreInfo.score) await this.addNewScore(currentTopScores, scorePlace, scoreInfo);
    }

    async getLOG2990TopScores(): Promise<Document[]> {
        await this.populateDb();
        const currentTopScores = await this.database.scores.fetchDocuments({ type: 'LOG2990' });
        return currentTopScores;
    }
    async getClassicTopScores(): Promise<Document[]> {
        await this.populateDb();
        const currentTopScores = await this.database.scores.fetchDocuments({ type: 'classique' });
        return currentTopScores;
    }

    async resetHighScores() {
        await this.database.scores.resetCollection();
        await this.populateDb();
    }

    private async populateDb() {
        const currentTopScores = await this.database.scores.fetchDocuments({});
        if (currentTopScores.length !== 0) return;
        const dummyClassicScoreInfo = (() => {
            let i = 1;
            return () => {
                return { username: 'Tarnished', type: 'classique', score: 0, position: i++ };
            };
        })();
        const dummyLOG2990ScoreInfo = (() => {
            let i = 1;
            return () => {
                return { username: 'EldenLord', type: 'LOG2990', score: 0, position: i++ };
            };
        })();
        for (let i = 0; i < ScoreStorageService.maxLength; i++) {
            await this.database.scores.addDocument(dummyClassicScoreInfo());
            await this.database.scores.addDocument(dummyLOG2990ScoreInfo());
        }
    }

    private async addPlayerToSameScore(scoreInfo: ScoreInfo, scorePlace: number, currentElement: Document) {
        await this.database.scores.replaceDocument(
            { position: scorePlace, type: scoreInfo.type },
            {
                position: scorePlace,
                username: currentElement.username + ' - ' + scoreInfo.username,
                type: scoreInfo.type,
                score: scoreInfo.score,
            },
        );
    }

    private async addNewScore(currentTopScores: Document[], scorePlace: number, scoreInfo: ScoreInfo) {
        currentTopScores.forEach((value) => {
            if (value.position >= scorePlace && value.position !== ScoreStorageService.lastElement) {
                this.database.scores.replaceDocument(
                    { position: value.position + 1, type: value.type },
                    { position: value.position + 1, username: value.username, type: value.type, score: value.score },
                );
            }
        });
        this.database.scores.replaceDocument(
            { position: scorePlace, type: scoreInfo.type },
            { position: scorePlace, username: scoreInfo.username, type: scoreInfo.type, score: scoreInfo.score },
        );
    }

    private getTopScoresPosition(currentTopScores: Document[], score: number): number {
        const scores = currentTopScores.map((element) => element.score as number);
        scores.push(score);
        scores.sort((a, b) => {
            return b - a;
        });
        return scores.indexOf(score) + 1;
    }

    private isNameAlreadyThere(newPlayer: string, currentPlayer: string): boolean {
        const notFound = -1;
        const playerName = currentPlayer.split(' - ');
        if (playerName.indexOf(newPlayer) === notFound) return false;
        return true;
    }
}
