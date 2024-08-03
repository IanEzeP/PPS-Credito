import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AnimSplashPage } from './anim-splash.page';

const routes: Routes = [
  {
    path: '',
    component: AnimSplashPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AnimSplashPageRoutingModule {}
