import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnimSplashPage } from './anim-splash.page';

describe('AnimSplashPage', () => {
  let component: AnimSplashPage;
  let fixture: ComponentFixture<AnimSplashPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AnimSplashPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
