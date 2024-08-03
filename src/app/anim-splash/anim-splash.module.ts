import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AnimSplashPageRoutingModule } from './anim-splash-routing.module';

import { AnimSplashPage } from './anim-splash.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AnimSplashPageRoutingModule
  ],
  declarations: [AnimSplashPage]
})
export class AnimSplashPageModule {}
