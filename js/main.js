class Producto {
  constructor(id, nombre, precio, stock, categoria) {
    this.id = id;
    this.nombre = nombre;
    this.precio = precio;
    this.stock = stock;
    this.categoria = categoria;
  }

  vender() {
    if (this.stock > 0) {
      this.stock--;
      return true;
    }
    return false;
  }
}

const productosIniciales = [
  { id: 1, nombre: "Alfajor", precio: 800, stock: 20, categoria: "Golosinas" },
  { id: 2, nombre: "Agua mineral", precio: 1200, stock: 15, categoria: "Bebidas" },
  { id: 3, nombre: "Chocolate", precio: 1500, stock: 10, categoria: "Golosinas" },
  { id: 4, nombre: "Gaseosa", precio: 1800, stock: 0, categoria: "Bebidas" },
  { id: 5, nombre: "Galletitas", precio: 1100, stock: 8, categoria: "Snacks" }
];

// JSON.parse devuelve objetos planos, hay que volver a armarlos como Producto
const cargarProductos = () => {
  const guardados = JSON.parse(localStorage.getItem("productos")) ?? productosIniciales;
  return guardados.map(({ id, nombre, precio, stock, categoria }) => new Producto(id, nombre, precio, stock, categoria));
};

const guardarProductos = () => {
  localStorage.setItem("productos", JSON.stringify(productos));
};

const productos = cargarProductos();
let siguienteId = productos.length ? Math.max(...productos.map(({ id }) => id)) + 1 : 1;
let ultimoAgregadoId = null;
let temporizadorMensaje = null;

const formulario = document.querySelector("#form-producto");
const inputNombre = document.querySelector("#nombre");
const inputPrecio = document.querySelector("#precio");
const inputStock = document.querySelector("#stock");
const selectCategoria = document.querySelector("#categoria");
const contenedorLista = document.querySelector("#lista-productos");
const contenedorMensaje = document.querySelector("#mensaje");
const buscador = document.querySelector("#buscador");
const resumen = document.querySelector("#resumen");

const escaparHtml = (texto) =>
  texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const mostrarMensaje = (texto, tipo) => {
  contenedorMensaje.textContent = texto;
  contenedorMensaje.className = `mensaje ${tipo}`;

  clearTimeout(temporizadorMensaje);
  temporizadorMensaje = setTimeout(() => {
    contenedorMensaje.className = "mensaje oculto";
  }, 3000);
};

const renderizarProductos = (lista) => {
  if (lista.length === 0) {
    contenedorLista.innerHTML = `<p class="vacio">No hay productos para mostrar.</p>`;
    return;
  }

  contenedorLista.innerHTML = lista
    .map(({ id, nombre, precio, stock, categoria }) => `
      <article class="tarjeta ${id === ultimoAgregadoId ? "nuevo" : ""} ${stock === 0 ? "sin-stock" : ""}">
        <span class="etiqueta">${escaparHtml(categoria)}</span>
        <h3>${escaparHtml(nombre)}</h3>
        <p class="precio">$${precio}</p>
        <p class="detalle stock">${stock === 0 ? "Sin stock" : `Stock: ${stock}`}</p>
        <div class="acciones">
          <button class="boton boton-vender" data-accion="vender" data-id="${id}" ${stock === 0 ? "disabled" : ""}>Vender 1</button>
          <button class="boton boton-eliminar" data-accion="eliminar" data-id="${id}">Eliminar</button>
        </div>
      </article>
    `)
    .join("");
};

const actualizarResumen = () => {
  const total = productos.reduce((acc, { precio, stock }) => acc + precio * stock, 0);
  const cantidad = productos.length;
  resumen.textContent = `${cantidad} ${cantidad === 1 ? "producto" : "productos"} · Valor del inventario: $${total}`;
};

const actualizarVista = () => {
  const texto = buscador.value.trim().toLowerCase();
  renderizarProductos(productos.filter(({ nombre }) => nombre.toLowerCase().includes(texto)));
  actualizarResumen();
};

formulario.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = inputNombre.value.trim();
  const precio = parseFloat(inputPrecio.value);
  const stock = parseInt(inputStock.value);
  const categoria = selectCategoria.value;

  if (!nombre || isNaN(precio) || isNaN(stock)) {
    mostrarMensaje("Completá nombre, precio y stock para agregar el producto.", "error");
    return;
  }

  if (precio <= 0 || stock < 0) {
    mostrarMensaje("El precio tiene que ser mayor a 0 y el stock no puede ser negativo.", "error");
    return;
  }

  const nuevo = new Producto(siguienteId++, nombre, precio, stock, categoria);
  productos.push(nuevo);
  guardarProductos();

  ultimoAgregadoId = nuevo.id;
  buscador.value = "";
  actualizarVista();
  ultimoAgregadoId = null;

  formulario.reset();
  inputNombre.focus();
  mostrarMensaje(`Se agregó "${nombre}" al inventario.`, "exito");
});

buscador.addEventListener("keyup", actualizarVista);

contenedorLista.addEventListener("click", (e) => {
  const { accion, id } = e.target.closest("button")?.dataset ?? {};
  if (!accion) return;

  const producto = productos.find((p) => p.id === Number(id));
  if (!producto) return;

  if (accion === "vender") {
    producto.vender();
    const { nombre, stock } = producto;
    mostrarMensaje(
      stock === 0
        ? `Vendiste la última unidad de "${nombre}", se quedó sin stock.`
        : `Vendiste 1 unidad de "${nombre}". Quedan ${stock}.`,
      stock === 0 ? "aviso" : "exito"
    );
  }

  if (accion === "eliminar") {
    productos.splice(productos.indexOf(producto), 1);
    mostrarMensaje(`Se eliminó "${producto.nombre}" del inventario.`, "aviso");
  }

  guardarProductos();
  actualizarVista();
});

actualizarVista();