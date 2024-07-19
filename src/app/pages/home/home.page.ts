import { Component, OnDestroy, OnInit } from '@angular/core';
import { 
  BarcodeScanner,
  Barcode 
} from '@capacitor-mlkit/barcode-scanning';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { DatabaseService } from 'src/app/services/database.service';
import { map, Subscription } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';

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

  constructor(private alert: AlertService, private data: DatabaseService, 
    private auth: AuthService, private firestore: AngularFirestore) {}

  /*
  QR encriptado, al escanearlo devuelve un código
  100 = 2786f4877b9091dcad7f35751bfcf5d5ea712b2f--
  50 = ae338e4e0cbb4e4bcffaf9ce5b409feb8edd5172 --
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

    const codigosObs = this.data.getCollectionSnapshot('codigos-qr')!.pipe(
      map((actions) => actions.map((a) => {
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return {id, ...data};
      })
    ));
    
    this.codigosSubs = codigosObs.subscribe(((data: any[]) => {
      this.codigosQR = [];
      this.codigosQR = data;
      console.log(this.codigosQR);
    }));

    const escaneoObs = this.data.getCollectionSnapshot('creditos-usuarios')!.pipe(
      map((actions) => actions.map((a) => {
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return {id, ...data};
      })
    ));

    this.escaneosSubs = escaneoObs.subscribe(((data: any[]) => {
      this.escaneosUsuarios = [];
      this.escaneosUsuarios = data;
      console.log(this.escaneosUsuarios);

      let userInDB = this.escaneosUsuarios.find(doc => doc.idUsuario == this.idUser);
      if (userInDB != undefined) { this.creditos = userInDB.creditosTotales; }
    }));
  }

  ngOnDestroy(): void {
    this.escaneosSubs.unsubscribe();
    this.codigosSubs.unsubscribe();
  }

  evaluarCarga() {
    let userInDB = this.escaneosUsuarios.find(doc => doc.idUsuario == this.idUser);

    if (userInDB != undefined) {
      let qrCargado = userInDB.codigosEscaneados.includes(this.infoQR);

      if (qrCargado == false) {
        this.cargarCreditos(userInDB);
      } else {
        if (this.perfil == 'admin') {//Si está cargado una vez, cargarlo nuevamente, sino, rebotar solicitud
          //Probar array.reduce. Alternativa usar indexof y lastindex y comparar los resultados
          /*if () {
            this.cargarCreditos(userInDB);
          } else {
            this.alert.sweetAlert('ERROR', 'No puedo volver a escanear este QR', 'error');
          }*/
        } else {
          this.alert.sweetAlert('ERROR', 'No puedo volver a escanear este QR', 'error');
        }
      }
    } else {
      this.altaCreditosUsuario(); 
    }
  }
  //Añadimos a la BD: Subimos idUsuario, codigosEscaneados con el qr, creditosTotales.
  altaCreditosUsuario() {
    let codigo = this.codigosQR.find(qr => qr.id == this.infoQR);

    if (codigo.valor != undefined) {
      let codigosEscaneados: Array<string> = [codigo.id];

      const newId = this.firestore.createId();
      const doc = this.firestore.doc("creditos-usuarios/" + newId);
      doc.set({
        idUsuario: this.idUser,
        codigosEscaneados: codigosEscaneados,
        creditosTotales: codigo.valor
      });

      this.creditos = codigo.valor;
    }
  }
  //Actualizamos la BD: Sumamos el valor del codigo a creditosTotales y añadimos el codigo a codigosEscaneados
  cargarCreditos(usuarioCreditos: any) {
    let codigo = this.codigosQR.find(qr => qr.id == this.infoQR);

    if (codigo.valor != undefined) {
      usuarioCreditos.creditosTotales += codigo.valor;
      usuarioCreditos.codigosEscaneados.push(codigo.id);

      const col = this.firestore.doc('creditos-usuarios/' + usuarioCreditos.id);
      col.update({
        creditosTotales: usuarioCreditos.creditosTotales,
        codigosEscaneados: usuarioCreditos.codigosEscaneados
      });
    }
  }

  vaciarCreditos() {
    let userInDB = this.escaneosUsuarios.find(doc => doc.idUsuario == this.idUser);

    if (userInDB != undefined) {
      this.creditos = 0;

      const col = this.firestore.doc('creditos-usuarios/' + userInDB.id);
      col.update({
        creditosTotales: 0,
        codigosEscaneados: []
      });
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
    return camera;
  }
}
