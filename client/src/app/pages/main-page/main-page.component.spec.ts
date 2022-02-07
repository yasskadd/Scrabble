import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { of } from 'rxjs';

export class MatDialogMock {
    open() {
        return {
            afterClosed: () => of({}),
        };
    }
}

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RouterTestingModule, MatButtonModule, MatCardModule, MatIconModule],
            declarations: [MainPageComponent],
            providers: [
                {
                    provide: MatDialog,
                    useClass: MatDialogMock,
                },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('openDialog() should open the dialog', () => {
        const stubParameter = '';
        const dialogSpy = spyOn(component.dialog, 'open');
        component.openDialog(stubParameter);
        expect(dialogSpy).toHaveBeenCalled();
    });
    it('The Classic button should pass the Classique game mode', () => {
        const CLASSIC_GAME_MODE = 'classique';
        const openDialogSpy = spyOn(component, 'openDialog');

        const button = fixture.debugElement.nativeElement.querySelector('#classique');
        button.click();
        expect(openDialogSpy).toHaveBeenCalledWith(CLASSIC_GAME_MODE);
    });
    it('A title should exist', () => {
        expect(component.title).toBeTruthy();
    });
});
