import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from './header.component';

@Component({
    template: '',
})
export class StubComponent {}

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;
    let location: Location;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [HeaderComponent],
            imports: [
                RouterTestingModule.withRoutes([
                    { path: 'home', component: StubComponent },
                    { path: 'admin', component: StubComponent },
                ]),
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        location = TestBed.inject(Location);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call redirectHome() when home button is clicked', fakeAsync(() => {
        const homeSpy = spyOn(component, 'redirectHome');
        const button = fixture.debugElement.nativeElement.querySelector('#home');
        button.click();
        tick();
        expect(homeSpy).toHaveBeenCalled();
    }));

    it('redirectHome should navigate to /home', fakeAsync(() => {
        component.redirectHome();
        tick();
        fixture.detectChanges();
        expect(location.path()).toBe('/home');
    }));

    it('should call redirectAdmin() when home button is clicked', fakeAsync(() => {
        const adminSpy = spyOn(component, 'redirectAdmin');
        const button = fixture.debugElement.nativeElement.querySelector('#admin');
        button.click();
        tick();
        expect(adminSpy).toHaveBeenCalled();
    }));

    it('redirectAdmin should navigate to /admin', fakeAsync(() => {
        component.redirectAdmin();
        tick();
        fixture.detectChanges();
        expect(location.path()).toBe('/admin');
    }));
});
