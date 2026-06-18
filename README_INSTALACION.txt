MANOS QUE HABLAN - VERSIÓN CON LOGIN Y CAPTURA DE FOTOS

1. CONTENIDO DEL PROYECTO

Este sistema incluye:
- Pantalla de login.
- Cámara del celular.
- Reconocimiento de gestos básicos con MediaPipe.
- Texto en pantalla.
- Voz sintetizada en español.
- Captura de fotos para crear dataset de nuevas señas.
- Descarga del dataset en ZIP.
- Instalación como PWA desde GitHub Pages.

2. DATOS DE ACCESO

Usuario de prueba: admin
Contraseña: admin123

Para cambiar el usuario o la contraseña, abre el archivo app.js y modifica estas líneas:

const USUARIO_VALIDO = "admin";
const CLAVE_VALIDA = "admin123";

IMPORTANTE:
Este login es básico y sirve para prototipo escolar. No es un sistema de seguridad profesional con base de datos.

3. CÓMO INSTALAR EN GITHUB PAGES

- Descomprime este ZIP.
- Sube todos los archivos a tu repositorio de GitHub.
- Entra a Settings > Pages.
- Activa GitHub Pages desde la rama main.
- Abre el enlace HTTPS que genera GitHub.

4. CÓMO INSTALAR EN EL CELULAR

- Abre el enlace de GitHub Pages en Chrome.
- Toca los tres puntos.
- Selecciona Agregar a pantalla principal o Instalar app.
- Abre la app desde el ícono creado.

5. CÓMO USAR

- Ingresa con usuario y contraseña.
- Presiona Iniciar cámara.
- Acepta permisos de cámara.
- Realiza un gesto frente a la cámara.
- La app muestra el texto y reproduce la voz.

6. CÓMO CAPTURAR FOTOS PARA ENTRENAR NUEVAS SEÑAS

- Escribe el nombre de la seña: agua, comer, ayuda, bano, etc.
- Realiza la seña frente a la cámara.
- Presiona Capturar muestra muchas veces.
- Repite con diferentes posiciones e iluminación.
- Presiona Descargar dataset.
- Usa dataset_senas.zip para entrenar en Google Colab.
