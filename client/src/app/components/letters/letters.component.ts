import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-letters',
    templateUrl: './letters.component.html',
    styleUrls: ['./letters.component.scss'],
})
export class LettersComponent implements OnInit {
    letters;
    constructor(private letterService: LetterReserveService) {}

    ngOnInit(): void {}
}
