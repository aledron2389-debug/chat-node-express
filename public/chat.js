// io() sin URL se conecta solo al mismo servidor (sirve en localhost y en AWS)
var socket = io();

var persona = document.getElementById('persona'),
    appChat = document.getElementById('app-chat'),
    panelBienvenida = document.getElementById('panel-bienvenida'),
    usuario = document.getElementById('usuario'),
    mensaje = document.getElementById('mensaje'),
    botonEnviar = document.getElementById('enviar'),
    inputArchivo = document.getElementById('archivo'),
    botonArchivo = document.getElementById('enviar-archivo'),
    escribiendoMensaje = document.getElementById('escribiendo-mensaje'),
    output = document.getElementById('output'),
    ventana = document.getElementById('ventana-mensajes');

// ---------- Sonido (sin archivos, generado con Web Audio) ----------
var audioCtx;
function sonido() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
}


// Evita que alguien inyecte HTML en el chat
function escapar(texto) {
  var div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// ---------- Enviar mensaje ----------
botonEnviar.addEventListener('click', function () {
  if (mensaje.value) {
    socket.emit('chat', {
      mensaje: mensaje.value,
      usuario: usuario.value
    });
  }
  mensaje.value = '';
});

mensaje.addEventListener('keyup', function (e) {
  if (e.key === 'Enter') { botonEnviar.click(); return; }
  if (persona.value) {
    socket.emit('typing', {
      nombre: usuario.value,
      texto: mensaje.value
    });
  }
});

// ---------- Enviar archivo ----------
botonArchivo.addEventListener('click', function () {
  var file = inputArchivo.files[0];

  if (!file) { alert('Selecciona un archivo primero'); return; }
  if (file.size > 20 * 1024 * 1024) { alert('El archivo supera 20 MB'); return; }

  var lector = new FileReader();
  lector.onload = function () {
    socket.emit('archivo', {
      usuario: usuario.value,
      nombre: file.name,
      tipo: file.type || 'application/octet-stream',
      datos: lector.result // ArrayBuffer
    });
    inputArchivo.value = '';
  };
  lector.readAsArrayBuffer(file);
});

// ---------- Recibir ----------
socket.on('chat', function (data) {
  escribiendoMensaje.innerHTML = '';
  output.innerHTML += '<p><strong>' + escapar(data.usuario) + ': </strong>' + escapar(data.mensaje) + '</p>';
  ventana.scrollTop = ventana.scrollHeight;
  sonido();
});

socket.on('archivo', function (data) {
  escribiendoMensaje.innerHTML = '';
  var blob = new Blob([data.datos], { type: data.tipo });
  var url = URL.createObjectURL(blob);
  var contenido;

  if (data.tipo.startsWith('image/')) {
    contenido = '<br><img src="' + url + '" style="max-width:100%;border-radius:4px;">';

  } else if (data.tipo.startsWith('video/')) {
    contenido = '<br><video src="' + url + '" controls style="max-width:100%;"></video>';
  } else if (data.tipo.startsWith('audio/')) {
    contenido = '<br><audio src="' + url + '" controls></audio>';
  } else {
    contenido = '<a href="' + url + '" download="' + escapar(data.nombre) + '">📎 ' + escapar(data.nombre) + '</a>';
  }

  output.innerHTML += '<p><strong>' + escapar(data.usuario) + ': </strong>' + contenido + '</p>';
  ventana.scrollTop = ventana.scrollHeight;
  sonido();
});

socket.on('typing', function (data) {
  if (data.texto) {
    escribiendoMensaje.innerHTML = '<p><em>' + escapar(data.nombre) + ' está escribiendo un mensaje...</em></p>';
  } else {
    escribiendoMensaje.innerHTML = '';
  }
});

// ---------- Entrar al chat ----------
function ingresarAlChat() {
  if (persona.value) {
    panelBienvenida.style.display = 'none';
    appChat.style.display = 'block';
    usuario.value = persona.value;
    usuario.readOnly = true;
    sonido(); // "desbloquea" el audio del navegador
  }
}