import { Component, OnDestroy, OnInit } from '@angular/core';
import { 
  BarcodeScanner,
  Barcode 
} from '@capacitor-mlkit/barcode-scanning';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { map, Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  public barcodes: Barcode[] = []; //?
  public infoQR: string | null = null;
  public scanSupported: boolean = false;
  public scanAvailable: boolean = false;
  public creditos: number = 0;
  public nombre: string = '';

  private perfil: string = '';
  private idUser: number = 0;
  private codigosQR: Array<any> = [];
  private escaneosUsuarios: Array<any> = [];
  private codigosSubs: Subscription = Subscription.EMPTY;
  private escaneosSubs: Subscription = Subscription.EMPTY;

  constructor(private alert: AlertService, private data: DatabaseService, private auth: AuthService) {}

  /*
  QR encriptado, al escanearlo devuelve un código
  100 = 2786f4877b9091dcad7f35751bfcf5d5ea712b2f--
  50 = ae338e4e0cbb4e4bcffaf9ce5b409feb8edd5172 --(Tiene un espacio al final, carácter vacio)
  10 = 8c95def646b6127282ed50454b73240300dccabc--
  */
 
  ngOnInit(): void {
    this.perfil = this.auth.loggedUser.perfil;
    this.nombre = this.auth.loggedUser.nombre;
    this.idUser = this.auth.loggedUser.id;

    BarcodeScanner.isSupported().then((result) => {
      this.scanSupported = result.supported;
      BarcodeScanner.isGoogleBarcodeScannerModuleAvailable().then((res) => {
        if (res.available == false) {
          BarcodeScanner.installGoogleBarcodeScannerModule().then(() => {
            BarcodeScanner.addListener("googleBarcodeScannerModuleInstallProgress",
              () => this.scanAvailable = true);
          })
          .catch((err) => console.log("Error in installation: " + err));
        } else {
          this.scanAvailable = res.available;
        }
      }).catch((err) => console.log("Error: " + err));
    });

    //Necesito 2 tablas, una de los qr y otra con la info de los usuarios y los qr que escanearon.
    const codigosObs = this.data.getCollectionSnapshot('codigos-qr')!.pipe(
      map((actions) => actions.map((a) => {
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return {id, ...data};
      })
    ));
    
    this.codigosSubs = codigosObs.subscribe(((data : any[]) => {
      this.codigosQR = [];
      this.codigosQR = data;
      console.log(this.codigosQR);
    }));

    this.escaneosSubs = this.data.getCollectionObservable('creditos-usuarios').subscribe((next: any) => {
      this.escaneosUsuarios = [];
      this.escaneosUsuarios = next;
      console.log(next);
      /*
      let result : Array<any> = next;

      result.forEach(usuario => {
        this.escaneosUsuarios.push(usuario);
      });*/
    });
  }

  ngOnDestroy(): void {
    this.escaneosSubs.unsubscribe();
    this.codigosSubs.unsubscribe();
  }

  evaluarCarga() {
    this.escaneosUsuarios.forEach(doc => {
      if (doc.idUsuario = this.idUser) {

      } else {
        this.cargarCreditos();
      }
    });
  }

  cargarCreditos() {
    //Cruzar id de usuario con la lista relacional, Si hay coincidencia, cruzar qr scaneado con lista de qrs de la lista relacional.
    //Si no hay coincidencia, crear documento y subirla a la lista relacional

    let codigo = this.codigosQR.find(qr => qr.id == this.infoQR);
    let valor: number | undefined =  codigo.valor;

    if (valor != undefined) {
      this.creditos += valor;
    }
  }



  async scan() {
    const permisson = await this.requestCameraPermission();
    console.log(permisson);
    if (permisson) {
      const { barcodes } = await BarcodeScanner.scan();
      if (barcodes.length > 0) {
        this.infoQR = barcodes[0].rawValue.trim();
        this.evaluarCarga();
      }
      this.barcodes.push(...barcodes);
    } else {
      this.alert.sweetAlert('Escáner rechazado',
        'Debe habilitar los permisos para poder escanear el QR',
        'error');
    }
  }

  async requestCameraPermission() {
    const { camera } = await BarcodeScanner.requestPermissions();
    //return camera === 'granted' || camera === 'limited';
    return camera;
  }
}
