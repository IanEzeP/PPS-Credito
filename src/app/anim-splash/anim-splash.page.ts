import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-anim-splash',
  templateUrl: './anim-splash.page.html',
  styleUrls: ['./anim-splash.page.scss'],
})
export class AnimSplashPage implements OnInit {

  constructor(public router: Router) 
  {
    setTimeout(() => {
      this.router.navigateByUrl('login');
    }, 3000);
  }

  ionViewDidEnter()
  {
    SplashScreen.hide();
  }

  ngOnInit() {
  }

}
