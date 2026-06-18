import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304";

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const loginForm = document.getElementById("loginForm");
const usuarioInput = document.getElementById("usuario");
const claveInput = document.getElementById("clave");
const loginMensaje = document.getElementById("loginMensaje");
const usuarioActivo = document.getElementById("usuarioActivo");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");

// Credenciales simples para prototipo escolar.
// Puedes cambiar estos datos por los que desees.
const USUARIO_VALIDO = "admin";
const CLAVE_VALIDA = "admin123";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const texto = document.getElementById("texto");
const confianza = document.getElementById("confianza");
const estado = document.getElementById("estado");
const btnIniciar = document.getElementById("btnIniciar");
const btnRepetir = document.getElementById("btnRepetir");
const btnSilencio = document.getElementById("btnSilencio");
const nombreSena = document.getElementById("nombreSena");
const btnCapturar = document.getElementById("btnCapturar");
const btnDescargarDataset = document.getElementById("btnDescargarDataset");
const btnLimpiarDataset = document.getElementById("btnLimpiarDataset");
const contadorMuestras = document.getElementById("contadorMuestras");
const previewMuestras = document.getElementById("previewMuestras");

let recognizer;
let running = false;
let ultimaFrase = "";
let ultimoAudio = 0;
let vozActiva = true;
let muestras = [];

const frases = {
  "Open_Palm": "Hola",
  "Closed_Fist": "Necesito ayuda",
  "Thumb_Up": "Estoy bien",
  "Thumb_Down": "No estoy bien",
  "Pointing_Up": "Tengo una pregunta",
  "Victory": "Gracias",
  "ILoveYou": "Te quiero"
};

async function cargarModelo() {
  estado.textContent = "Cargando inteligencia artificial...";
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
  );

  recognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1
  });
}

async function iniciarCamara() {
  try {
    if (!recognizer) await cargarModelo();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.style.display = "block";
    video.style.display = "none";

    running = true;
    estado.textContent = "Cámara activa. Haz una seña.";
    detectar();
  } catch (error) {
    estado.textContent = "No se pudo activar la cámara. Revisa permisos o usa HTTPS.";
    console.error(error);
  }
}


function mostrarApp(usuario) {
  loginScreen.classList.add("oculto");
  appScreen.classList.remove("oculto");
  usuarioActivo.textContent = usuario;
}

function mostrarLogin() {
  appScreen.classList.add("oculto");
  loginScreen.classList.remove("oculto");
}

function validarSesionGuardada() {
  const sesion = localStorage.getItem("mqh_sesion_activa");
  const usuario = localStorage.getItem("mqh_usuario");
  if (sesion === "true" && usuario) {
    mostrarApp(usuario);
  } else {
    mostrarLogin();
  }
}

function iniciarSesion(evento) {
  evento.preventDefault();
  const usuario = usuarioInput.value.trim();
  const clave = claveInput.value.trim();

  if (usuario === USUARIO_VALIDO && clave === CLAVE_VALIDA) {
    localStorage.setItem("mqh_sesion_activa", "true");
    localStorage.setItem("mqh_usuario", usuario);
    loginMensaje.textContent = "";
    loginForm.reset();
    mostrarApp(usuario);
  } else {
    loginMensaje.textContent = "Usuario o contraseña incorrectos.";
  }
}

function cerrarSesion() {
  localStorage.removeItem("mqh_sesion_activa");
  localStorage.removeItem("mqh_usuario");
  speechSynthesis.cancel();

  if (video.srcObject) {
    const pistas = video.srcObject.getTracks();
    pistas.forEach(pista => pista.stop());
    video.srcObject = null;
  }

  running = false;
  mostrarLogin();
}

function limpiarNombre(nombre) {
  return nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function actualizarContador() {
  contadorMuestras.textContent = `Muestras capturadas: ${muestras.length}`;
}

function capturarMuestra() {
  const etiqueta = limpiarNombre(nombreSena.value);

  if (!etiqueta) {
    alert("Escribe primero el nombre de la seña. Ejemplo: agua, comer, bano");
    return;
  }

  if (!running || !video.videoWidth) {
    alert("Primero presiona Iniciar cámara.");
    return;
  }

  const fotoCanvas = document.createElement("canvas");
  fotoCanvas.width = video.videoWidth;
  fotoCanvas.height = video.videoHeight;
  const fotoCtx = fotoCanvas.getContext("2d");

  // Se guarda la imagen tal como la ve el usuario, tipo espejo.
  fotoCtx.translate(fotoCanvas.width, 0);
  fotoCtx.scale(-1, 1);
  fotoCtx.drawImage(video, 0, 0, fotoCanvas.width, fotoCanvas.height);

  fotoCanvas.toBlob((blob) => {
    const numero = String(muestras.filter(m => m.etiqueta === etiqueta).length + 1).padStart(4, "0");
    const nombreArchivo = `${etiqueta}/${etiqueta}_${numero}.jpg`;
    muestras.push({ etiqueta, nombreArchivo, blob });
    actualizarContador();

    const img = document.createElement("img");
    img.src = URL.createObjectURL(blob);
    img.alt = nombreArchivo;
    img.title = nombreArchivo;
    previewMuestras.prepend(img);

    estado.textContent = `Muestra guardada: ${nombreArchivo}`;
  }, "image/jpeg", 0.9);
}

async function descargarDataset() {
  if (muestras.length === 0) {
    alert("No hay muestras para descargar.");
    return;
  }

  if (!window.JSZip) {
    alert("No se pudo cargar JSZip. Revisa tu conexión a internet.");
    return;
  }

  const zip = new JSZip();
  const resumen = {};

  for (const muestra of muestras) {
    zip.file(muestra.nombreArchivo, muestra.blob);
    resumen[muestra.etiqueta] = (resumen[muestra.etiqueta] || 0) + 1;
  }

  zip.file("README_dataset.txt", generarReadmeDataset(resumen));

  const contenido = await zip.generateAsync({ type: "blob" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(contenido);
  enlace.download = "dataset_senas.zip";
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}

function generarReadmeDataset(resumen) {
  const lineas = [
    "Dataset generado desde la app Manos que Hablan.",
    "",
    "Estructura:",
    "Cada carpeta corresponde a una seña. Ese nombre se usa como etiqueta para entrenar el modelo.",
    "",
    "Muestras por seña:"
  ];

  for (const [etiqueta, cantidad] of Object.entries(resumen)) {
    lineas.push(`- ${etiqueta}: ${cantidad} imágenes`);
  }

  lineas.push("", "Recomendación: captura mínimo 100 imágenes por seña, ideal 200 o más.");
  return lineas.join("\n");
}

function limpiarDataset() {
  if (!confirm("¿Quieres borrar las muestras capturadas en esta sesión?")) return;
  muestras = [];
  previewMuestras.innerHTML = "";
  actualizarContador();
  estado.textContent = "Muestras borradas.";
}

function hablar(frase) {
  if (!vozActiva) return;
  const ahora = Date.now();
  if (frase === ultimaFrase && ahora - ultimoAudio < 3500) return;

  speechSynthesis.cancel();
  const mensaje = new SpeechSynthesisUtterance(frase);
  mensaje.lang = "es-CO";
  mensaje.rate = 0.95;
  speechSynthesis.speak(mensaje);

  ultimaFrase = frase;
  ultimoAudio = ahora;
}

function detectar() {
  if (!running) return;

  const now = performance.now();
  const results = recognizer.recognizeForVideo(video, now);

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (results.landmarks && results.landmarks.length > 0) {
    const drawingUtils = new DrawingUtils(ctx);
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
        color: "#00ff88",
        lineWidth: 4
      });
      drawingUtils.drawLandmarks(landmarks, {
        color: "#ffffff",
        lineWidth: 2
      });
    }
  }

  if (results.gestures && results.gestures.length > 0) {
    const gesto = results.gestures[0][0];
    const nombre = gesto.categoryName;
    const score = Math.round(gesto.score * 100);
    const frase = frases[nombre] || "Seña no registrada";

    texto.textContent = frase;
    confianza.textContent = `Confianza: ${score}%`;
    estado.textContent = `Gesto técnico: ${nombre}`;

    if (score >= 65 && frases[nombre]) hablar(frase);
  } else {
    texto.textContent = "No se detecta seña";
    confianza.textContent = "Confianza: 0%";
    estado.textContent = "Muestra la mano frente a la cámara";
  }

  requestAnimationFrame(detectar);
}

loginForm.addEventListener("submit", iniciarSesion);
btnCerrarSesion.addEventListener("click", cerrarSesion);
validarSesionGuardada();

btnIniciar.addEventListener("click", iniciarCamara);
btnRepetir.addEventListener("click", () => {
  if (texto.textContent && texto.textContent !== "Esperando...") {
    ultimaFrase = "";
    hablar(texto.textContent);
  }
});
btnSilencio.addEventListener("click", () => {
  vozActiva = !vozActiva;
  speechSynthesis.cancel();
  btnSilencio.textContent = vozActiva ? "Pausar voz" : "Activar voz";
});

btnCapturar.addEventListener("click", capturarMuestra);
btnDescargarDataset.addEventListener("click", descargarDataset);
btnLimpiarDataset.addEventListener("click", limpiarDataset);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}
