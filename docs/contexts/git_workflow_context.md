# 🔀 HealthCore: Flujo de Trabajo (Git Workflow) y CI/CD

## 1. Filosofía de Colaboración
En HealthCore somos un equipo distribuido. Para evitar pisarnos los talones, proteger la estabilidad del sistema y asegurar la calidad académica exigida, trabajamos bajo un modelo basado en **Trunk-Based Development / GitHub Flow** con validación automatizada.

**Regla de Oro:** NADIE, bajo ninguna circunstancia, hace *commits* directos a la rama `main` o `develop`. Todo código nuevo debe pasar por un Pull Request (PR) y ser aprobado.

## 2. Estrategia de Ramas (Branching Model)
El repositorio de HealthCore consta de las siguientes ramas:

* **`main`:** Es el código de "Producción". Lo que está aquí funciona perfectamente y está listo para ser evaluado por los profesores.
* **`develop`:** Es nuestra rama de "Integración". Aquí unimos el trabajo de todos (Eugenio, Arturo y Tú). Debe ser siempre estable.
* **Ramas Efímeras (`feature/`, `fix/`, `docs/`):** Aquí es donde ocurre el trabajo real. Cada vez que tomes una tarea, debes crear una rama nueva a partir de `develop`.

### Nomenclatura Estándar para Ramas:
* `feat/nombre-en-ingles` -> Para nuevas funcionalidades. (Ej. `feat/agenda-optimistic-locking`)
* `fix/nombre-del-bug` -> Para arreglar errores. (Ej. `fix/cors-gateway-issue`)
* `docs/nombre-doc` -> Para documentación. (Ej. `docs/api-contracts`)

## 3. Estándar de Commits (Conventional Commits)
Para mantener un historial limpio y profesional, utilizamos la convención de la industria para los mensajes de commit. Esto nos permite leer el historial como si fuera un libro.

**Estructura:** `tipo(microservicio): descripción en imperativo`

**Tipos permitidos:**
* `feat:` (Nueva funcionalidad)
* `fix:` (Solución a un bug)
* `refactor:` (Mejora de código sin cambiar funcionalidad)
* `test:` (Añadir o corregir pruebas)
* `chore:` (Actualización de dependencias o configuraciones)

**Ejemplos Correctos:**
✅ `feat(identity): implement JWT generation on login`
✅ `fix(tracking): resolve null pointer exception in macro calculation`
✅ `test(agenda): add unit tests for double booking scenario`

❌ *Ejemplos Incorrectos (Prohibidos):* "arregle un bug", "subiendo mis cambios", "wip", "ahora sí funciona".

## 4. El Ciclo de Vida de una Tarea (Paso a Paso)

Cuando Arturo (o cualquier dev) tome una tarea este fin de semana, este es su flujo exacto:

1. **Actualizar local:** `git checkout develop` -> `git pull origin develop`
2. **Crear rama:** `git checkout -b feat/mi-nueva-tarea`
3. **Escribir Código y Pruebas:** Asegurar el 70% de cobertura.
4. **Hacer Commits:** Frecuentes y atómicos usando *Conventional Commits*.
5. **Subir rama:** `git push origin feat/mi-nueva-tarea`
6. **Crear Pull Request (PR):** Ir a GitHub y abrir un PR hacia la rama `develop`.
7. **Revisión de Código (Code Review):** Al menos 1 compañero debe revisar y aprobar los cambios (Approve).
8. **Merge:** Una vez aprobado y con el CI en verde, se hace *Squash and Merge* para limpiar el historial.

## 5. Integración Continua (CI con GitHub Actions)
Para garantizar que nadie rompa el código sin darse cuenta, hemos configurado un "Guardián Robótico" en GitHub. 

Cada vez que alguien abre un Pull Request hacia `develop`, GitHub Actions ejecutará automáticamente un pipeline (`.github/workflows/ci.yml`) que hará lo siguiente en un servidor en la nube:
1. Levanta un entorno con Java 21 y Maven.
2. Ejecuta el comando `mvn clean verify`.
3. Compila todos los microservicios.
4. Corre los 135+ tests unitarios y de integración (levantando Testcontainers si es necesario).
5. Verifica el reporte de JaCoCo.

**El Quality Gate (Puerta de Calidad):**
* Si el código no compila ➔ ❌ Bloquea el Merge.
* Si una sola prueba falla ➔ ❌ Bloquea el Merge.
* Si la cobertura del servicio es menor al 70% ➔ ❌ Bloquea el Merge.
* Si todo está perfecto ➔ ✅ Habilita el botón verde de Merge.

## 6. Despliegue Continuo (CD - Roadmap)
En una fase posterior del proyecto, agregaremos el paso de CD. Cuando un PR sea fusionado a la rama `main`, GitHub Actions tomará nuestros `Dockerfiles`, compilará las imágenes de producción de todos los servicios (`identity-service:latest`, etc.) y las subirá automáticamente a Docker Hub o GitHub Container Registry, listas para que el servidor Linux las descargue (Pull) y reinicie el sistema.