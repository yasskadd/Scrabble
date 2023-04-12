import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '@app/services/user.service';
import { UserStats } from '@common/interfaces/user-stats';
import Chart from 'chart.js/auto';

@Component({
    selector: 'app-user-profile-page',
    templateUrl: './user-profile-page.component.html',
    styleUrls: ['./user-profile-page.component.scss'],
})
export class UserProfilePageComponent {
    @ViewChild('myChart') canvasRef: ElementRef<HTMLCanvasElement>;
    userStats: UserStats;

    ngAfterViewInit() {
        // TODO: Language
        const canvas = this.canvasRef.nativeElement;
        const context = canvas.getContext('2d');
        const myChart = new Chart(context, {
            type: 'doughnut',
            data: {
                labels: ['Perdues', 'Gagnées'],
                datasets: [
                    {
                        data: [12, 19],
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
                    // title: {
                    //     display: true,
                    //     text: 'Taux de réussite',
                    // },
                },
            },
        });

        // myChart.data.datasets[0].data = [5, 10];
        myChart.update();
    }

    constructor(protected userService: UserService, private router: Router) {
        this.setUserStats();
        console.log(this.userStats + '0');
    }

    redirectSettingsPage() {
        this.router.navigate(['/settings']).then();
    }

    setUserStats() {
        this.userService.getStats().then((userStats) => {
            console.log(this.userStats + '1');
            this.userStats = userStats;
        });
    }
}
