# 📚 Documentación Técnica (AsciiDoc)

Esta carpeta contiene la documentación técnica avanzada del proyecto HealthCore (Requerimientos y Diseño), estructurada mediante un sistema de archivos modulares en **AsciiDoc**.

## 🏗️ Estructura de archivos
- **`index.adoc`**: El archivo principal (entry point). Consolida las secciones del documento.
- **`requirements.adoc`**: Definición formal de usuarios, casos de uso y requerimientos.
- **`design.adoc`**: Documentación visual y técnica (arquitectura, lógica, bases de datos).
- **`theme.yml`**: Configuración de estilos para la generación de PDF (Asciidoctor-PDF).

## 🛠️ Cómo contribuir
1. Edita los archivos `.adoc` correspondientes.
2. Sube tus cambios al repositorio y el **GitHub Action** (`publish-docs.yml`) generará automáticamente las versiones HTML y PDF.

## 🚀 Construcción Local (Prerrequisitos)
Para construir la versión final en tu máquina, necesitas instalar las gemas de Ruby:

```bash
gem install asciidoctor asciidoctor-pdf
```

### Generar HTML
```bash
asciidoctor index.adoc
```

### Generar PDF
```bash
asciidoctor-pdf -a pdf-theme=theme.yml index.adoc
```

---
*Nota: Se recomienda usar la extensión de **AsciiDoc** en VS Code para previsualizar los cambios en tiempo real.*
