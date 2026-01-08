#!/usr/bin/env python3
"""
Script para unir múltiples archivos PDF en uno solo.
"""

import sys
import os
from pathlib import Path
try:
    from pypdf import PdfMerger
except ImportError:
    print("Error: La biblioteca 'pypdf' no está instalada.")
    print("Instálala con: pip install pypdf")
    sys.exit(1)


def merge_pdfs(input_files, output_file):
    """
    Une múltiples archivos PDF en uno solo.

    Args:
        input_files (list): Lista de rutas de archivos PDF a unir
        output_file (str): Ruta del archivo PDF de salida
    """
    merger = PdfMerger()

    print(f"Uniendo {len(input_files)} archivos PDF...")

    for pdf_file in input_files:
        if not os.path.exists(pdf_file):
            print(f"Advertencia: El archivo '{pdf_file}' no existe. Saltando...")
            continue

        if not pdf_file.lower().endswith('.pdf'):
            print(f"Advertencia: '{pdf_file}' no es un archivo PDF. Saltando...")
            continue

        try:
            print(f"  - Agregando: {pdf_file}")
            merger.append(pdf_file)
        except Exception as e:
            print(f"Error al procesar '{pdf_file}': {e}")
            continue

    try:
        print(f"\nGuardando archivo combinado: {output_file}")
        merger.write(output_file)
        merger.close()
        print(f"✓ ¡PDF creado exitosamente! -> {output_file}")
    except Exception as e:
        print(f"Error al guardar el archivo: {e}")
        sys.exit(1)


def merge_pdfs_from_directory(directory, output_file, recursive=False):
    """
    Une todos los archivos PDF encontrados en un directorio.

    Args:
        directory (str): Ruta del directorio
        output_file (str): Ruta del archivo PDF de salida
        recursive (bool): Si es True, busca PDFs en subdirectorios también
    """
    pattern = "**/*.pdf" if recursive else "*.pdf"
    pdf_files = sorted(Path(directory).glob(pattern))

    if not pdf_files:
        print(f"No se encontraron archivos PDF en '{directory}'")
        sys.exit(1)

    pdf_files = [str(f) for f in pdf_files]
    merge_pdfs(pdf_files, output_file)


def print_usage():
    """Muestra las instrucciones de uso del script."""
    usage = """
Uso del script PDF Merger:

1. Unir archivos PDF específicos:
   python pdf_merger.py archivo1.pdf archivo2.pdf archivo3.pdf -o salida.pdf

2. Unir todos los PDFs de un directorio:
   python pdf_merger.py -d /ruta/directorio -o salida.pdf

3. Unir todos los PDFs de un directorio (incluyendo subdirectorios):
   python pdf_merger.py -d /ruta/directorio -o salida.pdf -r

Opciones:
  -o, --output    Nombre del archivo PDF de salida (requerido)
  -d, --dir       Directorio del cual unir todos los PDFs
  -r, --recursive Buscar PDFs en subdirectorios (usar con -d)
  -h, --help      Mostrar esta ayuda

Ejemplos:
  python pdf_merger.py doc1.pdf doc2.pdf doc3.pdf -o resultado.pdf
  python pdf_merger.py -d ./documentos -o todos.pdf
  python pdf_merger.py -d ./documentos -o todos.pdf -r
"""
    print(usage)


def main():
    """Función principal del script."""
    args = sys.argv[1:]

    if not args or '-h' in args or '--help' in args:
        print_usage()
        sys.exit(0)

    # Buscar el archivo de salida
    output_file = None
    if '-o' in args:
        idx = args.index('-o')
        if idx + 1 < len(args):
            output_file = args[idx + 1]
    elif '--output' in args:
        idx = args.index('--output')
        if idx + 1 < len(args):
            output_file = args[idx + 1]

    if not output_file:
        print("Error: Debes especificar un archivo de salida con -o")
        print_usage()
        sys.exit(1)

    # Verificar si se debe procesar un directorio
    directory = None
    if '-d' in args:
        idx = args.index('-d')
        if idx + 1 < len(args):
            directory = args[idx + 1]
    elif '--dir' in args:
        idx = args.index('--dir')
        if idx + 1 < len(args):
            directory = args[idx + 1]

    # Verificar modo recursivo
    recursive = '-r' in args or '--recursive' in args

    if directory:
        # Modo directorio
        if not os.path.isdir(directory):
            print(f"Error: '{directory}' no es un directorio válido")
            sys.exit(1)
        merge_pdfs_from_directory(directory, output_file, recursive)
    else:
        # Modo archivos individuales
        input_files = []
        skip_next = False
        for i, arg in enumerate(args):
            if skip_next:
                skip_next = False
                continue

            if arg in ['-o', '--output', '-d', '--dir']:
                skip_next = True
                continue

            if arg in ['-r', '--recursive']:
                continue

            input_files.append(arg)

        if not input_files:
            print("Error: No se especificaron archivos PDF para unir")
            print_usage()
            sys.exit(1)

        merge_pdfs(input_files, output_file)


if __name__ == "__main__":
    main()
