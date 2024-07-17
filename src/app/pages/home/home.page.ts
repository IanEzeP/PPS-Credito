import { Component } from '@angular/core';
import { 
  BarcodeScanner,
  Barcode 
} from '@capacitor-mlkit/barcode-scanning';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  public scannedData: string = '';

  public barcodes: Barcode[] = []; //?
  public infoQR: string | null = null;
  public scanSupported: boolean = false;
  public scanAvailable: boolean = false;

  constructor() {}

}
