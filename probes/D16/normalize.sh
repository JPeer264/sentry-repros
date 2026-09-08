#!/bin/bash
# usage: ./normalize.sh <items json> -- blanks trace ids so two phases can be diffed.
sed -E 's/"trace_id": "[0-9a-f]{32}"/"trace_id": "<id>"/g' "$1"
