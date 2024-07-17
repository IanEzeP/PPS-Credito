export class User {
    id: number = 0;
    correo: string = '';
    clave: number = 0;
    perfil: string = '';
    sexo: string = '';
    nombre: string = '';

    constructor(id: number, correo: string, clave: number, perfil: string, sexo: string, nombre: string)
    {
        this.id = id;
        this.correo = correo;
        this.clave = clave;
        this.perfil = perfil;
        this.sexo = sexo;
        this.nombre = nombre;
    }

    static initialize() : User
    {
        return new User(0,'',0,'','', '');
    }
}
