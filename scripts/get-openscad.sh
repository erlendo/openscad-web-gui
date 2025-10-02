#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
DIST_DIR="$SCRIPT_DIR/../dist"
VENDOR_DIR="$SCRIPT_DIR/../src/vendor/openscad-wasm"
OPENSCAD_WASM_VERSION="${OPENSCAD_WASM_VERSION:-2022.03.20}"
BASE_URL="https://github.com/openscad/openscad-wasm/releases/download/$OPENSCAD_WASM_VERSION"

mkdir -p "$VENDOR_DIR"
mkdir -p "$DIST_DIR"

download() {
	local url="$1"
	local out="$2"
	if command -v curl >/dev/null 2>&1; then
		curl -fsSL "$url" -o "$out"
	elif command -v wget >/dev/null 2>&1; then
		wget -q "$url" -O "$out"
	else
		echo "Error: Neither curl nor wget is installed. Please install one of them and re-run this script." >&2
		exit 1
	fi
}

echo "Fetching OpenSCAD WASM assets ($OPENSCAD_WASM_VERSION)…"

# Hopp over nedlasting hvis filene allerede finnes
if [ -f "$VENDOR_DIR/openscad.js" ] && [ -f "$VENDOR_DIR/openscad.wasm" ]; then
	echo "OpenSCAD WASM assets already present, skipping download."
else
	download "$BASE_URL/openscad.js" "$VENDOR_DIR/openscad.js"
	download "$BASE_URL/openscad.wasm" "$VENDOR_DIR/openscad.wasm"
fi

# Optional companion files if present in the release
if curl -fsI "$BASE_URL/openscad.wasm.js" >/dev/null 2>&1; then
	download "$BASE_URL/openscad.wasm.js" "$VENDOR_DIR/openscad.wasm.js" || true
fi
if curl -fsI "$BASE_URL/openscad.fonts.js" >/dev/null 2>&1; then
	download "$BASE_URL/openscad.fonts.js" "$VENDOR_DIR/openscad.fonts.js" || true
fi

echo "Downloaded to $VENDOR_DIR"
