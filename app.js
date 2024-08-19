// Variables globales
let listaActual = [];
let IVA = 0;
let supermercadoActual = '';
let listasGuardadas = [];

// Funciones principales
function iniciarLista(e) {
    e.preventDefault();
    supermercadoActual = document.getElementById('supermercado').value;
    IVA = parseFloat(document.getElementById('iva-porcentaje').value) / 100;
    document.getElementById('supermercado-titulo').textContent = supermercadoActual;
    document.getElementById('iva-info').textContent = `IVA: ${(IVA * 100).toFixed(1)}%`;
    document.getElementById('inicializacion-form').style.display = 'none';
    document.getElementById('producto-form').style.display = 'grid';
}

function agregarProducto(e) {
    e.preventDefault();
    const producto = document.getElementById('producto').value;
    const cantidad = parseFloat(document.getElementById('cantidad').value);
    const unidad = document.getElementById('unidad').value;
    const precio = parseFloat(document.getElementById('precio').value);
    const precioConIVA = precio * (1 + IVA);
    const ivaProducto = precio * IVA;

    listaActual.push({ producto, cantidad, unidad, precio, precioConIVA, ivaProducto });
    actualizarLista();
    calcularTotales();
    
    // Limpiar formulario
    e.target.reset();
}

function actualizarLista() {
    const lista = document.getElementById('lista-productos');
    lista.innerHTML = '';
    listaActual.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.producto}: ${item.cantidad} ${item.unidad} x $${item.precio.toFixed(2)} 
            (IVA: $${item.ivaProducto.toFixed(2)}) = $${(item.cantidad * item.precioConIVA).toFixed(2)}</span>
            <button onclick="eliminarProducto(${index})">Eliminar</button>
        `;
        lista.appendChild(li);
    });
}

function eliminarProducto(index) {
    listaActual.splice(index, 1);
    actualizarLista();
    calcularTotales();
}

function calcularTotales() {
    const subtotal = listaActual.reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
    const ivaTotal = listaActual.reduce((sum, item) => sum + (item.cantidad * item.ivaProducto), 0);
    const total = subtotal + ivaTotal;

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('iva-total').textContent = ivaTotal.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

async function guardarLista() {
    if (listaActual.length === 0) {
        alert('La lista está vacía');
        return;
    }

    const listaParaGuardar = {
        supermercado: supermercadoActual,
        fecha: new Date().toISOString(),
        iva: IVA,
        productos: listaActual,
        total: document.getElementById('total').textContent
    };

    listasGuardadas.push(listaParaGuardar);

    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: 'listas_compras.json',
            types: [{
                description: 'JSON File',
                accept: {'application/json': ['.json']},
            }],
        });
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(listasGuardadas, null, 2));
        await writable.close();
        alert('Lista guardada con éxito');
    } catch (error) {
        console.error('Error al guardar la lista:', error);
        alert('Error al guardar la lista');
    }
}

function compartirPorWhatsApp() {
    if (listaActual.length === 0) {
        alert('La lista está vacía');
        return;
    }
    let mensaje = `Lista de compras de ${supermercadoActual} (IVA: ${(IVA * 100).toFixed(1)}%):\n\n`;
    listaActual.forEach(item => {
        mensaje += `${item.producto}: ${item.cantidad} ${item.unidad} x $${item.precio.toFixed(2)} `;
        mensaje += `(IVA: $${item.ivaProducto.toFixed(2)}) = $${(item.cantidad * item.precioConIVA).toFixed(2)}\n`;
    });
    mensaje += `\nSubtotal: $${document.getElementById('subtotal').textContent}`;
    mensaje += `\nIVA Total: $${document.getElementById('iva-total').textContent}`;
    mensaje += `\nTotal: $${document.getElementById('total').textContent}`;
    
    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(urlWhatsApp, '_blank');
}

async function cargarListasGuardadas() {
    try {
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'JSON File',
                accept: {'application/json': ['.json']},
            }],
        });
        const file = await fileHandle.getFile();
        const contents = await file.text();
        listasGuardadas = JSON.parse(contents);
        mostrarListasGuardadas();
    } catch (error) {
        console.error('Error al cargar las listas:', error);
        alert('Error al cargar las listas guardadas');
    }
}

function mostrarListasGuardadas() {
    const listaGuardadas = document.getElementById('lista-guardadas');
    listaGuardadas.innerHTML = '';
    listasGuardadas.forEach((lista, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${lista.supermercado} - ${new Date(lista.fecha).toLocaleString()} - IVA: ${(lista.iva * 100).toFixed(1)}% - Total: $${lista.total}</span>
            <button onclick="cargarListaGuardada(${index})">Cargar</button>
        `;
        listaGuardadas.appendChild(li);
    });
    document.getElementById('listas-guardadas').style.display = 'block';
}

function cargarListaGuardada(index) {
    const listaSeleccionada = listasGuardadas[index];
    supermercadoActual = listaSeleccionada.supermercado;
    IVA = listaSeleccionada.iva;
    listaActual = listaSeleccionada.productos;
    document.getElementById('supermercado-titulo').textContent = supermercadoActual;
    document.getElementById('iva-info').textContent = `IVA: ${(IVA * 100).toFixed(1)}%`;
    document.getElementById('inicializacion-form').style.display = 'none';
    document.getElementById('producto-form').style.display = 'grid';
    actualizarLista();
    calcularTotales();
    document.getElementById('listas-guardadas').style.display = 'none';
}

// Añade esta nueva función después de las funciones existentes

async function exportarYCompartirJSON() {
    if (listasGuardadas.length === 0) {
        alert('No hay listas guardadas para exportar');
        return;
    }

    try {
        // Crear un Blob con el contenido JSON
        const jsonContent = JSON.stringify(listasGuardadas, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });

        // Crear una URL para el Blob
        const url = URL.createObjectURL(blob);

        // Crear un enlace temporal para descargar el archivo
        const a = document.createElement('a');
        a.href = url;
        a.download = 'lista_compras.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Liberar la URL del objeto
        URL.revokeObjectURL(url);

        // Preguntar al usuario si desea compartir por WhatsApp
        if (confirm('¿Deseas compartir este archivo por WhatsApp?')) {
            // Crear mensaje para WhatsApp
            const mensaje = 'Aquí está mi archivo de listas de compras. Por favor, descárgalo y ábrelo en la aplicación.';
            
            // Abrir WhatsApp Web con el mensaje
            window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
        }
    } catch (error) {
        console.error('Error al exportar y compartir el archivo:', error);
        alert('Error al exportar y compartir el archivo');
    }
}

// Añade este event listener al final del archivo, junto con los demás

document.getElementById('exportar').addEventListener('click', exportarYCompartirJSON);

// Event Listeners
document.getElementById('inicializacion-form').addEventListener('submit', iniciarLista);
document.getElementById('producto-form').addEventListener('submit', agregarProducto);
document.getElementById('guardar').addEventListener('click', guardarLista);
document.getElementById('compartir').addEventListener('click', compartirPorWhatsApp);
document.getElementById('cargar').addEventListener('click', cargarListasGuardadas);