/* eslint-disable @typescript-eslint/no-magic-numbers */
import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
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
export class UserProfilePageComponent implements AfterViewInit {
    @ViewChild('myChart') canvasRef: ElementRef<HTMLCanvasElement>;

    userStats: UserStats;
    connections: HistoryEvent[];
    games: HistoryEvent[];
    private allEvents: HistoryEvent[];

    constructor(
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

    ngAfterViewInit() {
        // TODO: Language, data
        // winRate = this.userStats.loss

        const myChart = new Chart(this.canvasRef.nativeElement.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Perdues', 'Gagnées'],
                datasets: [
                    {
                        data: [this.userStats.loss, this.userStats.win],
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

        myChart.update();
    }

    setUserStats() {
        this.httpHandlerService.getStats().then((userStats: UserStats) => {
            userStats.averageGameScore = Math.round(userStats.averageGameScore);
            this.userStats = userStats;
        });
    }

    async fetchHistories() {
        await this.httpHandlerService.getUserHistoryEvents().then((result) => {
            this.allEvents = result.historyEventList as HistoryEvent[];
        });
    }

    setConnections() {
        this.allEvents.forEach((event: HistoryEvent) => {
            if (event.event != HistoryActions.Game) {
                this.connections.push(event);
            }
        });
    }

    setGames() {
        this.allEvents.forEach((event: HistoryEvent) => {
            if (event.event == HistoryActions.Game) {
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
}
