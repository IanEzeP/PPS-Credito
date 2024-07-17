import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  constructor() { }

  /**
   * Alerta básica y personalizable para mostrar información, adaptada a vistas de dispositivo móvil.
   * @param titulo El título que muestra la alerta
   * @param mensaje Un mensaje para añadir información en la alerta
   * @param icono El icono que se desea mostrar
   * @returns 
   */
  public sweetAlert(titulo: string, mensaje: string, 
    icono: 'warning'|'success'|'error'|'info'|'question')
  {
    return Swal.fire(
      {
        heightAuto: false,
        title: titulo,
        text: mensaje,
        icon: icono,
      });
  }

  /**
   * Alerta que muestra un spinner, con un titulo y mensaje.
   * El usuario no puede cerrar la alerta, debe ser cerrada dentro del programa.
   * @param titulo El titulo que muestra la alerta de espera
   * @param mensaje Un mensaje para añadir información en la alerta de espera
   * @returns 
   */
  public waitAlert(titulo: string, mensaje: string)
  {
    return Swal.fire(
      {
        heightAuto: false,
        title: titulo,
        text: mensaje,
        showConfirmButton: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
  }

  /*
  public successAlert(mensaje: string) : void
  {
    Swal.fire(
      {
        heightAuto: false,
        icon: 'success',
        title: mensaje,
      });
  }

  public failureAlert(titulo: string, mensaje: string) : void
  {
    Swal.fire(
      {
        heightAuto: false,
        icon: 'error',
        title: mensaje,
        text: mensaje,
      });
  }
  */
  
  /**
   * Un toast para indicar un proceso finalizado de forma satisfactoria
   * @param mensaje Mensaje a mostrar en el toast
   */
  public successToast(mensaje: string) : void
  {
    Swal.fire(
      {
        icon: 'success',
        title: mensaje,
        toast: true,
        position: 'bottom',
        timer: 2400,
        timerProgressBar: false,
        showCloseButton: true,
        showConfirmButton: false
      });
  }

  /**
   * Un toast para dar información al finalizar un proceso
   * @param mensaje Mensaje a mostrar en el toast
   */
  public infoToast(mensaje: string) : void
  {
    Swal.fire(
      {
        icon: 'info',
        title: mensaje,
        toast: true,
        position: 'bottom-right',
        timer: 3000,
        timerProgressBar: true,
        showCloseButton: true,
        showConfirmButton: false,
      });
  }
}
