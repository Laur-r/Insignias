class Transaccion {
  constructor({ id, usuario_documento, categoria_id, tipo, monto, descripcion, fecha }) {
    this.id = id;
    this.usuario_documento = usuario_documento;
    this.categoria_id = categoria_id;
    this.tipo = tipo;
    this.monto = monto;
    this.descripcion = descripcion;
    this.fecha = fecha || new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
  }
}

export default Transaccion;
