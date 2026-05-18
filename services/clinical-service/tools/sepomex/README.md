# SEPOMEX Snapshot

Este directorio contiene la herramienta offline para regenerar el snapshot versionado que usa `clinical-service`.

## Uso

```bash
python get_sepomex.py
```

El script descarga el archivo oficial de SEPOMEX, agrupa por codigo postal, deduplica colonias y actualiza:

`services/clinical-service/src/main/resources/reference/sepomex-postal-codes.json`

El servicio Java no depende de Python en runtime; solo consume el snapshot ya generado.
