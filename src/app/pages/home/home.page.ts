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
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {

  public barcodes: Barcode[] = [];
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
    private auth: AuthService, private firestore: AngularFirestore, private router: Router) {}
 
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
      console.log("Muestro creditos: " + this.creditos);
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
        if (this.perfil == 'admin') {
          let result = this.isElementRepeated(userInDB.codigosEscaneados, this.infoQR);
          
          if (result) {
            this.alert.sweetAlert('ERROR', 'No puede escanear este QR más de dos veces', 'error');
          } else {
            this.cargarCreditos(userInDB);
          }
        } else {
          this.alert.sweetAlert('ERROR', 'No puede volver a escanear este QR', 'error');
        }
      }
    } else {
      this.altaCreditosUsuario(); 
    }
  }

  isElementRepeated(array: Array<any>, element: any) : boolean {
    const count = array.filter(item => item === element).length;
    return count > 1;
  }

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
      Swal.fire({
        heightAuto: false,
        title: '¿Desea vaciar sus créditos?',
        text: 'Todos los créditos acumulados se perderán, pero podrá volver a cargarlos escaneando los QR correspondientes',
        icon: 'warning',
        showCancelButton: true,
        cancelButtonColor: '#3085d6',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Vaciar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.creditos = 0;

          const col = this.firestore.doc('creditos-usuarios/' + userInDB.id);
          col.update({
            creditosTotales: 0,
            codigosEscaneados: []
          });
        }
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

  cerraSesion() {
    Swal.fire({
      heightAuto: false,
      title: '¿Cerrar Sesión?',
      icon: 'warning',
      showCancelButton: true,
      cancelButtonColor: '#3085d6',
      confirmButtonColor: '#d33',
      confirmButtonText: 'Cerrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.auth.logOut().then(() => this.router.navigateByUrl('/login'));
      }
    });
  }
}
