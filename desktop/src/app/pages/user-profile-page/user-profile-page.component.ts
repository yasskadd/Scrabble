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
        const canvas = this.canvasRef.nativeElement;
        const context = canvas.getContext('2d');
        const myChart = new Chart(context, {
            type: 'pie',
            data: {
                labels: ['Red', 'Blue', 'Yellow'],
                datasets: [
                    {
                        label: '# of Votes',
                        data: [12, 19, 3],
                        backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(255, 206, 86, 0.2)'],
                        borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 'rgba(255, 206, 86, 1)'],
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
                    title: {
                        display: true,
                        text: 'Chart.js Pie Chart',
                    },
                },
            },
        });

        myChart.data.datasets[0].data = [5, 10, 15];
        myChart.update();
    }

    constructor(protected userService: UserService, private router: Router) {
        // this.setUserStats();
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
