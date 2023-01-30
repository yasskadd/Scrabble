import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { VirtualPlayersService } from '@app/services/virtual-players.service';
import { of } from 'rxjs';
import { AdminVirtualPlayersComponent } from './admin-virtual-players.component';

const BOT_EXPERT_LIST = [
    {
        username: 'Paul',
        difficulty: 'Expert',
    },
    {
        username: 'MARC',
        difficulty: 'Expert',
    },
    {
        username: 'Luc',
        difficulty: 'Expert',
    },
    {
        username: 'Jean',
        difficulty: 'Expert',
    },
    {
        username: 'Charles',
        difficulty: 'Expert',
    },
];

const BOT_BEGINNER_LIST = [
    {
        username: 'Paul',
        difficulty: 'debutant',
    },
    {
        username: 'MARC',
        difficulty: 'debutant',
    },
    {
        username: 'Luc',
        difficulty: 'debutant',
    },
    {
        username: 'Jean',
        difficulty: 'debutant',
    },
    {
        username: 'Jules',
        difficulty: 'debutant',
    },
];

export class MatDialogMock {
    open() {
        return {
            afterClosed: () => of({ action: true }),
        };
    }
}

describe('AdminVirtualPlayersComponent', () => {
    let component: AdminVirtualPlayersComponent;
    let fixture: ComponentFixture<AdminVirtualPlayersComponent>;
    let virtualPlayersServiceSpy: jasmine.SpyObj<VirtualPlayersService>;

    beforeEach(async () => {
        virtualPlayersServiceSpy = jasmine.createSpyObj(
            'VirtualPlayersService',
            ['getBotNames', 'addBotName', 'replaceBotName', 'deleteBotName', 'resetBotNames'],
            {
                beginnerBotNames: BOT_BEGINNER_LIST,
                expertBotNames: BOT_EXPERT_LIST,
            },
        );

        await TestBed.configureTestingModule({
            imports: [MatIconModule, MatFormFieldModule, MatInputModule, BrowserAnimationsModule, FormsModule],
            declarations: [AdminVirtualPlayersComponent],
            schemas: [NO_ERRORS_SCHEMA],
            providers: [
                { provide: VirtualPlayersService, useValue: virtualPlayersServiceSpy },
                { provide: MatDialog, useClass: MatDialogMock },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdminVirtualPlayersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('isUniqueName() should return false if the name of the new bot already exist ', () => {
        expect(component.isUniqueName('Jean')).toBeFalsy();
        expect(component.isUniqueName('Jules')).toBeFalsy();
    });

    it('isUniqueName() should return true if the name of the new bot does not already exist ', () => {
        expect(component.isUniqueName('Ludovique')).toBeTruthy();
    });

    it('addExpertName() should call updateBotList and virtualPlayer.addBotname if the name does not already exit ', () => {
        const spy = spyOn(component, 'updateBotList');
        component.expertInput = 'Marcelliee';
        component.addExpertName();
        expect(virtualPlayersServiceSpy.addBotName).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
    });

    it('addExpertName() should not call virtualPlayer.addBotname if the name does already exit ', () => {
        const spy = spyOn(component, 'updateBotList');
        component.expertInput = 'Paul';
        component.addExpertName();
        expect(virtualPlayersServiceSpy.addBotName).not.toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
    });

    it('addBeginnerName() should call updateBotList and virtualPlayer.addBotname if the name does not already exit ', () => {
        const spy = spyOn(component, 'updateBotList');
        component.beginnerInput = 'Marcelliee';
        component.addBeginnerName();
        expect(virtualPlayersServiceSpy.addBotName).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
    });

    it('addBeginnerName() should  not call updateBotList and virtualPlayer.addBotname if the name does already exit ', () => {
        const spy = spyOn(component, 'updateBotList');
        component.beginnerInput = 'Paul';
        component.addBeginnerName();
        expect(virtualPlayersServiceSpy.addBotName).not.toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
    });

    it('should open a dialog box if the openReplaceNameDialog method is called', () => {
        // Reason : we want to call private method
        // eslint-disable-next-line dot-notation
        const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<typeof component>);
        component.openReplaceNameDialog('vincent', 'debutant');
        expect(dialogSpy).toHaveBeenCalled();
    });

    it('replaceBotName should not call updateBotList and  virtualPlayerService.replaceBotName if the newName is undefined', () => {
        const spy = spyOn(component, 'updateBotList');
        component.replaceBotName('vinc', '', 'debutant');
        expect(virtualPlayersServiceSpy.replaceBotName).not.toHaveBeenCalled();
        expect(spy).not.toHaveBeenCalled();
    });

    it('replaceBotName should not call virtualPlayerService.replaceBotName if the currentName is a name already', () => {
        component.replaceBotName('MARC', 'MARC', 'debutant');
        expect(virtualPlayersServiceSpy.replaceBotName).not.toHaveBeenCalled();
    });

    it('replaceBotName should call updateBotList and  virtualPlayerService.replaceBotName if the newName is  not undefined', () => {
        const spy = spyOn(component, 'updateBotList');
        component.replaceBotName('vinc', 'lore', 'debutant');
        expect(virtualPlayersServiceSpy.replaceBotName).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
    });

    it('isNameDefault should return true if the name is from the defaultList', () => {
        expect(component.isNameDefault('robert')).toBeTruthy();
    });

    it('deleteBot should call updateBotList() and virtualPlayerService.deleteBotName if the name is not from the default list', () => {
        const spy = spyOn(component, 'updateBotList');
        component.deleteBot('vinc', 'debutant');
        expect(virtualPlayersServiceSpy.deleteBotName).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
    });

    it('resetBot should  call virtualPlayerService.resetBotName if the list of bot names contains more than the default one', () => {
        component.resetBot();
        expect(virtualPlayersServiceSpy.resetBotNames).toHaveBeenCalled();
    });

    it('resetBot should not call virtualPlayerService.resetBotName if the list of bot names does not contains more than the default one', () => {
        const BOT_BEGINNER_LIST_3 = [
            {
                username: 'Paul',
                difficulty: 'debutant',
            },
            {
                username: 'MARC',
                difficulty: 'debutant',
            },
            {
                username: 'Luc',
                difficulty: 'debutant',
            },
        ];

        const BOT_EXPERT_LIST_3 = [
            {
                username: 'Ford',
                difficulty: 'Expert',
            },
            {
                username: 'Ponle',
                difficulty: 'Expert',
            },
            {
                username: 'Luc',
                difficulty: 'Expert',
            },
        ];
        Object.defineProperty(virtualPlayersServiceSpy, 'beginnerBotNames', { value: BOT_BEGINNER_LIST_3, enumerable: true });
        Object.defineProperty(virtualPlayersServiceSpy, 'expertBotNames', { value: BOT_EXPERT_LIST_3, enumerable: true });

        component.resetBot();
        expect(virtualPlayersServiceSpy.resetBotNames).not.toHaveBeenCalled();
    });
});
