# Proyectos de Programacion — Eduardo Maytorena

[![CI API](https://github.com/eduardo-mr1/proyectos-de-programacion/actions/workflows/ci-api.yml/badge.svg)](https://github.com/eduardo-mr1/proyectos-de-programacion/actions/workflows/ci-api.yml)
[![CI Frontend](https://github.com/eduardo-mr1/proyectos-de-programacion/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/eduardo-mr1/proyectos-de-programacion/actions/workflows/ci-frontend.yml)
[![CI Motor de Busqueda](https://github.com/eduardo-mr1/proyectos-de-programacion/actions/workflows/ci-motor-busqueda.yml/badge.svg)](https://github.com/eduardo-mr1/proyectos-de-programacion/actions/workflows/ci-motor-busqueda.yml)

Tres proyectos de desarrollo: una API REST con autenticacion, su cliente web, y
un motor de busqueda de texto completo escrito desde cero.

Vengo de aseguramiento de calidad, y eso se nota en como estan construidos:
**56 pruebas automatizadas**, CI en cada push, y decisiones de diseno
documentadas con sus limitaciones.

## Proyectos

### [API Gestor de Tareas](api-gestor-tareas) · Node.js + Express + SQLite
API REST con autenticacion JWT, CRUD de tareas aislado por usuario y validacion
de entrada con Zod.

**23 pruebas de integracion** que levantan la aplicacion completa en memoria y
pegan por HTTP real, sin mocks. Doce de ellas son pruebas de regresion: cada una
cubre un defecto encontrado en el
[reporte de bugs](https://github.com/eduardo-mr1/proyectos-de-qa/tree/main/reporte-de-bugs)
y falla si vuelve a aparecer.

Incluye limitador de intentos de login, contrasenas contrastadas contra las mas
filtradas, y paginacion con tope.

### [Frontend Gestor de Tareas](frontend-gestor-tareas) · React + Vite
Cliente web que consume la API: registro, login, CRUD de tareas, sesion que
sobrevive al refresh y se cierra sola cuando expira el token.

Sin librerias de estado ni de data fetching: con una pantalla y una lista,
`useState` y `fetch` alcanzan. Actualizacion optimista en el checkbox, con
reversion si la peticion falla.

### [Motor de Busqueda](motor-de-busqueda) · Sin dependencias
Buscador de texto completo con **indice invertido** y ranking **BM25**, escrito
solo con la libreria estandar de Node.

**33 pruebas** y un benchmark contra busqueda lineal que implementa el mismo
ranking:

| Documentos | Consulta | Lineal | Con indice | Mejora |
|---|---|---|---|---|
| 20.000 | termino comun | 330 ms | 23 ms | 14x |
| 20.000 | termino selectivo | 296 ms | 1,3 ms | **234x** |

La diferencia entre las dos filas es lo interesante: el costo de una consulta
indexada depende de cuantos documentos coinciden, **no** de cuantos existen.

El README del proyecto documenta como la primera version del benchmark daba una
mejora constante de 15x y por que la causa no era el indice sino el corpus
sintetico.

## Como esta construido

**Dependencias solo cuando pagan su costo.** El motor de busqueda no tiene
ninguna. Las pruebas usan el runner nativo de Node en vez de Jest. CORS es un
middleware propio de diez lineas en vez de un paquete.

**Cada pieza no trivial deja una prueba que la cubre.** Las 56 corren en CI en
cada push.

**Las limitaciones estan escritas.** Cada README tiene su seccion de
limitaciones conocidas: el indice vive en memoria, no hay stemming, el
limitador de login no sobrevive a varias instancias. Saber donde estan los
bordes es parte de conocer el sistema.

## Relacion con el repositorio de QA

La aplicacion de este repositorio es la que se prueba en
**[proyectos-de-qa](https://github.com/eduardo-mr1/proyectos-de-qa)**: suite E2E
con Playwright, coleccion de Postman y el reporte de defectos que motivo las
pruebas de regresion de aqui.

## Stack

Node.js 22 · Express 5 · SQLite · JWT · Zod · React 18 · Vite 5 · GitHub Actions
