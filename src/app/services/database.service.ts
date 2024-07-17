import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../classes/user';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  usuariosBD: Array<User> = [];

  constructor(private firestore: AngularFirestore) { }

  cargarUsuarios()
  {
    console.log("Utilizo servicio Database");
    this.getCollectionObservable("usuarios").subscribe((next : any) => 
    {
      let result : Array<any>  = next;
      this.usuariosBD = [];
      
      result.forEach((obj : any) => {
        this.usuariosBD.push(new User(obj.id, obj.correo, obj.clave, obj.perfil, obj.sexo, obj.nombre));
      });
    });
    console.log("Finalizo inicializacion");
  }

  traerUnDocumento(coleccion: string, id: string)
  {
    return this.firestore.firestore.doc(coleccion + '/' + id).get();
  }

  traerDocumentoObservable(coleccion: string, id: string)
  {
    return this.firestore.doc(coleccion + '/' + id).get();
  }

  getCollectionObservable(coleccion : string)
  {
    return this.firestore.collection(coleccion).valueChanges();
  }

  getCollectionPromise(coleccion : string)
  {
    return this.firestore.firestore.collection(coleccion).get();
  }
}
