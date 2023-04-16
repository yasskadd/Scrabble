/* eslint-disable @typescript-eslint/no-magic-numbers */
import { AfterViewInit, Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpHandlerService } from '@app/services/communication/http-handler.service';
import { UserService } from '@app/services/user.service';
import { HistoryEvent } from '@common/interfaces/history-event';
import { UserStats } from '@common/interfaces/user-stats';
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

    constructor(
        protected userService: UserService,
        private readonly httpHandlerService: HttpHandlerService,
        private router: Router,
        private ngZone: NgZone,
    ) {
        this.connections = [];
        this.games = [];

        this.setUserStats();
        this.setConnections();
        this.setGames();
        console.log(this.connections);
        console.log(this.games);
    }

    ngAfterViewInit() {
        // TODO: Language, data
        const myChart = new Chart(this.canvasRef.nativeElement.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Perdues', 'Gagnées'],
                datasets: [
                    {
                        data: [12, 19], // TODO
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

    setConnections() {
        this.httpHandlerService.getUserHistoryEvents().then((result) => {
            result.historyEventList.forEach((event: HistoryEvent) => this.connections.push(event));
        });
    }

    setGames() {
        this.connections.forEach((event: HistoryEvent) => {
            if (event.gameWon) {
                this.games.push(event);
                console.log('gotit');
            }
        });
    }

    redirectSettingsPage() {
        this.ngZone.run(() => {
            this.router.navigate(['/settings']).then();
        });
    }
}
