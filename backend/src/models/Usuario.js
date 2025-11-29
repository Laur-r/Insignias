class Usuario {
  constructor({ 
    documento, 
    email, 
    password_hash, 
    nombre, 
    apellido, 
    telefono, 
    pais, 
    activo 
  }) {
    this.documento = documento;
    this.email = email;
    this.password_hash = password_hash;
    this.nombre = nombre;
    this.apellido = apellido;
    this.telefono = telefono;
    this.pais = pais || 'Colombia';
    this.activo = activo !== undefined ? activo : true;
  }
}

export default Usuario;