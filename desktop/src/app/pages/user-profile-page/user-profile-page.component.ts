/* eslint-disable @typescript-eslint/no-magic-numbers */
import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
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
    games: HistoryEvent[];
    connections: HistoryEvent[];
    httpHandlerService: any;

    constructor(protected userService: UserService, private router: Router) {
        this.setUserStats();
        console.log(this.userStats + 'profile-page');
        // this.setGames();
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
            Math.round(userStats.averageGameScore);
            this.userStats = userStats;
        });
    }

    // get userHistoryEvents(): HistoryEvent[] {
    //     return this.httpHandlerService.getUserHistoryEvents().then((userHistoryEvents: HistoryEvent[]) => {
    //         return userHistoryEvents;
    //     });
    // }

    // setGames() {
    //     this.userHistoryEvents.forEach((historyEvent: HistoryEvent) => {
    //         if (historyEvent.gameWon != null) this.games.push(historyEvent);
    //     });
    // }

    redirectSettingsPage() {
        this.router.navigate(['/settings']).then();
    }
}
