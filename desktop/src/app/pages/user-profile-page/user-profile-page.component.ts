/* eslint-disable @typescript-eslint/no-magic-numbers */
import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AppRoutes } from '@app/models/app-routes';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { LanguageService } from '@app/services/language.service';
import { UserService } from '@app/services/user.service';
import { HistoryEvent } from '@common/interfaces/history-event';
import { UserStats } from '@common/interfaces/user-stats';
import { HistoryActions } from '@common/models/history-actions';
import Chart from 'chart.js/auto';

@Component({
    selector: 'app-user-profile-page',
    templateUrl: './user-profile-page.component.html',
    styleUrls: ['./user-profile-page.component.scss'],
})
export class UserProfilePageComponent {
    @ViewChild('myChart') canvasRef: ElementRef<HTMLCanvasElement>;

    userStats: UserStats;
    connections: HistoryEvent[];
    games: HistoryEvent[];
    private allEvents: HistoryEvent[];
    private myChart: Chart;

    constructor(
        protected languageService: LanguageService,
        protected userService: UserService,
        private readonly httpHandlerService: HttpHandlerService,
        private router: Router,
        private ngZone: NgZone,
    ) {
        this.connections = [];
        this.games = [];

        this.setUserStats();
        this.fetchHistories().then(() => {
            this.setConnections();
            this.setGames();
        });
    }

    setUserStats() {
        this.httpHandlerService.getStats().then((userStats: UserStats) => {
            userStats.averageGameScore = Math.round(userStats.averageGameScore);
            this.userStats = userStats;
            this.updateChart(this.userStats.win, this.userStats.loss);
        });
    }

    async fetchHistories() {
        await this.httpHandlerService.getUserHistoryEvents().then((result) => {
            this.allEvents = result.historyEventList as HistoryEvent[];
        });
    }

    setConnections() {
        this.allEvents.forEach((event: HistoryEvent) => {
            if (event.event !== HistoryActions.Game) {
                this.connections.push(event);
            }
        });
    }

    setGames() {
        this.allEvents.forEach((event: HistoryEvent) => {
            if (event.event === HistoryActions.Game) {
                this.games.push(event);
            }
        });
    }

    calculatePercentageWon() {}

    redirectSettingsPage() {
        this.ngZone.run(() => {
            this.router.navigate(['/settings']).then();
        });
    }

    protected playerHasntPlayed(): boolean {
        return this.userStats?.win === 0 && this.userStats?.loss === 0;
    }

    private updateChart(win: number, loss: number): void {
        if (this.myChart) {
            this.myChart.destroy();
        }

        this.myChart = new Chart(this.canvasRef.nativeElement.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Lost', 'Won'],
                datasets: [
                    {
                        data: [loss, win],
                        backgroundColor: ['rgba(255, 99, 132, 1)', 'rgba(201, 242, 155, 1)'],
                        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(201, 242, 155, 1)'],
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
            },
        });

        this.myChart.update();
    }

    protected redirectHome() {
        this.ngZone.run(() => {
            this.router.navigate([AppRoutes.HomePage]).then();
        });
    }

    protected getLanguage() {
        return this.languageService.language;
    }
}
