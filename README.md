# PDF Merger - Unir Archivos PDF

Script en Python para unir múltiples archivos PDF en uno solo de manera sencilla.

## Características

- ✅ Une múltiples archivos PDF en uno solo
- ✅ Puede unir archivos específicos o todos los PDFs de un directorio
- ✅ Soporta búsqueda recursiva en subdirectorios
- ✅ Manejo de errores robusto
- ✅ Fácil de usar desde la línea de comandos

## Requisitos

- Python 3.6 o superior
- Biblioteca `pypdf`

## Instalación

1. Clona o descarga este repositorio

2. Instala las dependencias:
```bash
pip install -r requirements.txt
```

O instala directamente:
```bash
pip install pypdf
```

## Uso

### Opción 1: Unir archivos PDF específicos

```bash
python pdf_merger.py archivo1.pdf archivo2.pdf archivo3.pdf -o resultado.pdf
```

### Opción 2: Unir todos los PDFs de un directorio

```bash
python pdf_merger.py -d /ruta/al/directorio -o resultado.pdf
```

### Opción 3: Unir PDFs de un directorio incluyendo subdirectorios

```bash
python pdf_merger.py -d /ruta/al/directorio -o resultado.pdf -r
```

## Parámetros

| Parámetro | Descripción |
|-----------|-------------|
| `-o, --output` | **(Requerido)** Nombre del archivo PDF de salida |
| `-d, --dir` | Directorio del cual unir todos los archivos PDF |
| `-r, --recursive` | Buscar PDFs en subdirectorios (usar con `-d`) |
| `-h, --help` | Mostrar ayuda |

## Ejemplos

### Ejemplo 1: Unir tres documentos específicos
```bash
python pdf_merger.py capitulo1.pdf capitulo2.pdf capitulo3.pdf -o libro_completo.pdf
```

### Ejemplo 2: Unir todos los PDFs de la carpeta "documentos"
```bash
python pdf_merger.py -d ./documentos -o todos_los_documentos.pdf
```

### Ejemplo 3: Unir PDFs de una carpeta y sus subcarpetas
```bash
python pdf_merger.py -d ./proyectos -o proyecto_completo.pdf -r
```

### Ejemplo 4: Hacer el script ejecutable (Linux/Mac)
```bash
chmod +x pdf_merger.py
./pdf_merger.py doc1.pdf doc2.pdf -o salida.pdf
```

## Notas

- Los archivos se unirán en el orden especificado (o en orden alfabético si se usa el modo directorio)
- El script omitirá automáticamente archivos que no sean PDF o que no existan
- Si un archivo tiene errores, se mostrará una advertencia y continuará con los demás

## Solución de problemas

### Error: "La biblioteca 'pypdf' no está instalada"
```bash
pip install pypdf
```

### Error: "Permission denied"
En Linux/Mac, da permisos de ejecución:
```bash
chmod +x pdf_merger.py
```

## Licencia

Este script es de uso libre.
