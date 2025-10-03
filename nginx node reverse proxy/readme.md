
- [0) Idea general (en 15 segundos)](#0-idea-general-en-15-segundos)
- [1) Docker Compose: añade el servicio (sin publicar puertos)](#1-docker-compose-añade-el-servicio-sin-publicar-puertos)
- [2) Nginx: upstream + subruta](#2-nginx-upstream--subruta)
  - [2.1 Declara el upstream](#21-declara-el-upstream)
  - [2.2 Elige **subruta** y añade los `location`](#22-elige-subruta-y-añade-los-location)
    - [Opción A – Interfaz/UI (panel web): reescritura automática (recomendada)](#opción-a--interfazui-panel-web-reescritura-automática-recomendada)
    - [Opción B – API (quitar el prefijo /miapp)](#opción-b--api-quitar-el-prefijo-miapp)
    - [WebSockets (si tu app los usa)](#websockets-si-tu-app-los-usa)
- [3) Tarjeta en la landing: `config/apps.json`](#3-tarjeta-en-la-landing-configappsjson)
- [4) Pruebas rápidas (copy/paste)](#4-pruebas-rápidas-copypaste)
- [5) Plantillas para copiar y reutilizar](#5-plantillas-para-copiar-y-reutilizar)
  - [Upstream](#upstream)
  - [Subruta de UI/panel](#subruta-de-uipanel)
  - [Subruta de API (quitando prefijo)](#subruta-de-api-quitando-prefijo)
  - [Entrada en `apps.json`](#entrada-en-appsjson)
- [6) Errores típicos (y solución exprés)](#6-errores-típicos-y-solución-exprés)
- [7) Checklist final (siempre igual)](#7-checklist-final-siempre-igual)

# 0) Idea general (en 15 segundos)

* **Sólo Nginx** expone el puerto (80).
* Cada app nueva:

  1. La añades en **docker-compose** (sin `ports:` → solo `expose`).
  2. Creas un **upstream** y un **location** en **nginx.conf** con una **subruta** (ej. `/miapp/`).
  3. Añades la tarjeta en **`config/apps.json`** (nombre, ruta e icono).

---

# 1) Docker Compose: añade el servicio (sin publicar puertos)

Ejemplo con una app nueva llamada **miapp** que escucha en **8080** dentro del contenedor.

```yaml
services:
  miapp:
    image: vendor/miapp:latest
    expose:
      - "8080"           # PUERTO INTERNO de la app (no publicar al host)
    restart: unless-stopped
    # (opcional) environment, volumes, etc.
```

> Recuerda: el **único** servicio con `ports:` debe ser **nginx** (p.ej. `80:80`).

---

# 2) Nginx: upstream + subruta

Edita tu `nginx.conf`. Los `upstream` van **fuera** del `server {}`.

## 2.1 Declara el upstream

```nginx
upstream miapp_upstream { server miapp:8080; keepalive 16; }
```

## 2.2 Elige **subruta** y añade los `location`

### Opción A – Interfaz/UI (panel web): reescritura automática (recomendada)

Usa **barra final** en `proxy_pass` para que la app “crea” que vive en `/`.

```nginx
# fuerza barra final si el usuario entra sin /
location = /miapp { return 302 /miapp/$is_args$args; }

# prioriza sobre regex de estáticos con ^~
location ^~ /miapp/ {
  proxy_pass http://miapp_upstream/;  # <- OJO: barra final
  proxy_redirect off;
  proxy_buffering off;
  proxy_read_timeout 300s;
}
```

### Opción B – API (quitar el prefijo /miapp)

Si tu API ya sirve en `/` y no entiende subrutas:

```nginx
location ^~ /miapp/ {
  rewrite ^/miapp(/.*)$ $1 break;   # quita /miapp del path
  proxy_pass http://miapp_upstream; # sin barra final
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

### WebSockets (si tu app los usa)

En ese `location`, añade:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade;
proxy_http_version 1.1;
```

(Ya tienes el `map $http_upgrade` arriba en tu conf.)

> Guarda y recarga Nginx:

```bash
docker compose restart nginx
```

---

# 3) Tarjeta en la landing: `config/apps.json`

Edita `config/apps.json` y añade un objeto con **nombre**, **ruta** (termina en `/`) e **imagen** (sirve desde `/static/...`):

```json
[
  { "name": "Code Server", "path": "/code/",     "img": "/static/apps/code.svg" },
  { "name": "Portainer",   "path": "/portainer/", "img": "/static/apps/portainer.svg" },

  { "name": "Mi App",      "path": "/miapp/",     "img": "/static/apps/miapp.svg" }
]
```

* Coloca el icono en `app/public/apps/miapp.svg` (o PNG/JPG).
* **No necesitas reiniciar** la app: la landing lee el JSON en cada petición.
  (Si no ves el icono, refresca con Ctrl+F5.)

---

# 4) Pruebas rápidas (copy/paste)

```bash
# servicio accesible por Nginx:
curl -i http://TU_IP/miapp/

# si es API y definiste /health:
curl -i http://TU_IP/miapp/health

# ver tarjetas que renderiza Node:
curl -s http://TU_IP/api/apps | jq .
```

Si algo falla:

* `docker ps` → ¿corre el contenedor `miapp`?
* `docker logs miapp -f` → ¿escucha en el puerto correcto?
* `docker logs nginx-proxy -f` → errores 502/404 indican upstream/paths mal.

---

# 5) Plantillas para copiar y reutilizar

## Upstream

```nginx
upstream <nombre>_upstream { server <servicio>:<puerto>; keepalive 16; }
```

## Subruta de UI/panel

```nginx
location = /<subruta> { return 302 /<subruta>/$is_args$args; }
location ^~ /<subruta>/ {
  proxy_pass http://<nombre>_upstream/;  # con barra final
  proxy_redirect off;
  proxy_buffering off;
  proxy_read_timeout 300s;
}
```

## Subruta de API (quitando prefijo)

```nginx
location ^~ /<subruta>/ {
  rewrite ^/<subruta>(/.*)$ $1 break;
  proxy_pass http://<nombre>_upstream;   # sin barra final
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Entrada en `apps.json`

```json
{ "name": "Mi App", "path": "/<subruta>/", "img": "/static/apps/<icono>.svg" }
```

---

# 6) Errores típicos (y solución exprés)

* **Pantalla en blanco / assets 404** → En UIs, usa `location ^~ /subruta/` y `proxy_pass .../` **con barra final**. Entra siempre a `/subruta/` (con `/`).
* **502 Bad Gateway** → Nombre del servicio/puerto mal o contenedor caído.
* **WebSockets caídos** → Faltan `Upgrade`/`Connection` y `proxy_http_version 1.1`.
* **CORS en APIs** → Si front y API están en distintas subrutas, suele ir bien; si no, activa CORS en la API.
* **Redirecciones raras a “/”** → La app no soporta base path; usa la plantilla de UI (barra final) o subdominio.

---

# 7) Checklist final (siempre igual)

1. `docker-compose.yml`: servicio con `expose`.
2. `nginx.conf`: `upstream` + `location` de subruta.
3. `config/apps.json`: tarjeta (nombre, ruta con `/`, icono).
4. `docker compose restart nginx`
5. Prueba con `curl` y revisa logs si algo falla.

Listo. Cualquier app nueva la integras en **2–3 minutos** siguiendo esto.
