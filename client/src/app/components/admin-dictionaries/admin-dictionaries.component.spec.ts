import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Dictionary } from '@app/interfaces/dictionary';
import { DictionaryService } from '@app/services/dictionary.service';
import * as saver from 'file-saver';
import { of } from 'rxjs';
import { AdminDictionariesComponent } from './admin-dictionaries.component';

export class MatDialogMock {
    open() {
        return {
            afterClosed: () => of({ action: true }),
        };
    }
}

describe('AdminDictionariesComponent', () => {
    let component: AdminDictionariesComponent;
    let fixture: ComponentFixture<AdminDictionariesComponent>;
    let saveAsSpy: jasmine.Spy<jasmine.Func>;
    let dictionaryServiceSpy: jasmine.SpyObj<DictionaryService>;

    beforeEach(async () => {
        dictionaryServiceSpy = jasmine.createSpyObj('DictionaryService', [
            'deleteDictionary',
            'getDictionaries',
            'addDictionary',
            'modifyDictionary',
            'resetDictionaries',
            'uploadDictionary',
        ]);

        dictionaryServiceSpy.getDictionaries.and.resolveTo([]);
        // eslint-disable-next-line deprecation/deprecation
        saveAsSpy = spyOn(saver, 'saveAs').and.stub();
        await TestBed.configureTestingModule({
            imports: [MatDialogModule],
            providers: [
                { provide: DictionaryService, useValue: dictionaryServiceSpy },
                { provide: MatDialog, useClass: MatDialogMock },
            ],
            declarations: [AdminDictionariesComponent],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AdminDictionariesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.dictionaryList = [
            {
                title: 'Mon dictionnaire',
                description: 'Description de base',
            },
        ];
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should download a file', () => {
        component.downloadJson({} as Dictionary);
        expect(saveAsSpy).toHaveBeenCalled();
    });

    describe('Default dictionary tests', () => {
        it('isDefault() should return true if the dictionary is the default dictionary', () => {
            expect(
                component.isDefault({
                    title: 'Mon dictionnaire',
                    description: 'Description de base',
                }),
            ).toBeTruthy();
        });

        it('isDefault() should return false if dictionary is not default dictionary', () => {
            expect(
                component.isDefault({
                    title: 'Le dictionnaire larousse',
                    description: 'dictionnaire francais',
                }),
            ).toBeFalsy();
        });

        it('dictionary in list should have buttons if isDefault() returns false', () => {
            spyOn(component, 'isDefault').and.returnValue(false);
            fixture.detectChanges();
            const button = fixture.debugElement.nativeElement.querySelector('.buttonModify');
            expect(button).toBeTruthy();
        });

        it('dictionary in list should not have buttons if isDefault() returns true', () => {
            spyOn(component, 'isDefault').and.returnValue(true);
            fixture.detectChanges();
            const button = fixture.debugElement.nativeElement.querySelector('.buttonModify');
            expect(button).toBeFalsy();
        });
    });

    describe('Delete dictionary tests', () => {
        it('deleteDictionary() should call dictionaryService.deleteDictionary()', () => {
            component.deleteDictionary({
                title: 'Le dictionnaire larousse',
                description: 'dictionnaire francais',
            });
            expect(dictionaryServiceSpy.deleteDictionary).toHaveBeenCalled();
        });

        // it('deleted dictionary should disappear dictionary from list', () => {
        //     component.dictionaries = [
        //         {
        //             title: 'Mon dictionnaire',
        //             description: 'Description de base',
        //         },
        //         {
        //             title: 'Mauvais',
        //             description: 'Mauvais de base',
        //         },
        //     ];

        //     expect(component.dictionaries.length).toEqual(0);
        //     component.deleteDictionary({
        //         title: 'Mauvais',
        //         description: 'Mauvais de base',
        //     });
        //     expect(component.dictionaries.length).toEqual(0);
        // });
    });

    // describe('Add dictionary tests', () => {
    //     it('addDictionary() should call dictionaryService.addDictionary() and resetDictionaryInput', () => {
    //         const resetDictionnarySpy = spyOn(component, 'resetDictionaryInput' as never);
    //         component.dictionaryInput = {
    //             title: 'Mon dictionnaire 2',
    //             description: 'Un dictionnaire',
    //             words: ['string'],
    //         };
    //         component.addDictionary();
    //         expect(dictionaryServiceSpy.addDictionary).toHaveBeenCalled();
    //         expect(resetDictionnarySpy).toHaveBeenCalled();
    //     });

    //     it('addDictionary() should not call dictionaryService.addDictionary()  if the title exist already', () => {
    //         const resetDictionnarySpy = spyOn(component, 'resetDictionaryInput' as never);

    //         component.dictionaryInput = {
    //             title: 'Mon dictionnaire',
    //             description: 'Un dictionnaire',
    //             words: ['string'],
    //         };
    //         component.addDictionary();
    //         expect(dictionaryServiceSpy.addDictionary).not.toHaveBeenCalled();
    //         expect(resetDictionnarySpy).toHaveBeenCalled();
    //     });
    //     it('added dictionary should be added to list', () => {});
    // });

    describe('Modify dictionary tests', () => {
        it('openModifyDictionaryDialog() should open dialog box', () => {
            // eslint-disable-next-line dot-notation
            const dialogSpy = spyOn(component['modifyDictionaryDialog'], 'open').and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<
                typeof component
            >);
            const spy = spyOn(component, 'modifyDictionary');
            component.openModifyDictionaryDialog({
                title: 'Le dictionnaire larousse',
                description: 'dictionnaire francais',
            });
            expect(dialogSpy).toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
        });

        it('modifyDictionary() should call dictionaryService.modifyDictionary()', () => {
            component.modifyDictionary({ title: 'Titre de Base', newTitle: 'Titre Modifier', newDescription: 'Nouvelle Description' });
            expect(dictionaryServiceSpy.modifyDictionary).toHaveBeenCalled();
            expect(dictionaryServiceSpy.getDictionaries).toHaveBeenCalled();
        });

        it('modifyDictionary() should not call updateDictionaryList if the title or the description is blank', () => {
            const spy = spyOn(component, 'updateDictionaryList');

            component.modifyDictionary({ title: '', newTitle: '', newDescription: '' });
            expect(spy).not.toHaveBeenCalled();
        });

        it('modifyDictionary() should not call updateDictionaryList if the title is the same as an other one', () => {
            const spy = spyOn(component, 'updateDictionaryList');

            component.modifyDictionary({ title: 'Mon dictionnaire2', newTitle: 'Mon dictionnaire', newDescription: 'Bonjour' });
            expect(spy).not.toHaveBeenCalled();
        });
        // it('modified dictionary should have a new title and old description if only title is modified', () => {});

        // it('modified dictionary should have a new description and old title if only description is modified', () => {});

        // it('modified dictionary should have a new title and  description if title and description are modified', () => {});
    });

    describe('reset Dictionaries tests', () => {
        it('resetDictionaries() should call dictionaryService.resetDictionaries() and updateDictionaryList()', () => {
            const spy = spyOn(component, 'updateDictionaryList');
            component.resetDictionaries();
            expect(dictionaryServiceSpy.resetDictionaries).toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('reset DictionaryInput tests', () => {
        it('resetDictionaryInput() should call dictionaryService.resetDictionaries() and updateDictionaryList()', () => {
            const spy = spyOn(component, 'updateDictionaryList');
            component.resetDictionaries();
            expect(dictionaryServiceSpy.resetDictionaries).toHaveBeenCalled();
            expect(spy).toHaveBeenCalled();
        });
    });
});
