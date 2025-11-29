class Categoria {
  constructor({ id, usuario_documento, nombre, tipo }) {
    this.id = id;
    this.usuario_documento = usuario_documento;
    this.nombre = nombre;
    this.tipo = tipo; // 'ingreso' o 'gasto'
  }
}

export default Categoria;
