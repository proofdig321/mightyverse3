#!/usr/bin/env bash
set -euo pipefail

# Robust duplicate-content scanner for agent folders.
# Excludes build artifacts by default (.next, node_modules) and writes a simple report.

ROOT="${1:-.}"
OUT="${2:-./agent-dup-report.txt}"

echo "Scanning for duplicate agent files under ${ROOT}..."

# Find relevant files, exclude build artifacts
mapfile -t FILES < <(find "$ROOT" -type f \( -path "*/agents/*" -o -path "*/.github/agents/*" \) \( -iname "*.js" -o -iname "*.ts" -o -iname "*.py" -o -iname "*.json" -o -iname "*.jsx" -o -iname "*.tsx" \) -not -path "*/.next/*" -not -path "*/node_modules/*")

if [ ${#FILES[@]} -eq 0 ]; then
  echo "No agent files found to scan." > "$OUT"
  echo "No files found."
  exit 0
fi

tmpfile=$(mktemp)

# Compute md5s and sort
printf "%s\n" "${FILES[@]}" | xargs md5sum | sort > "$tmpfile"

# Find duplicate hashes
awk '{count[$1]++; files[$1]=files[$1] " " $2} END {for (h in count) if (count[h]>1) print h ":::" files[h]}' "$tmpfile" > /tmp/dup-lines.txt || true

if [ ! -s /tmp/dup-lines.txt ]; then
  echo "No duplicate-content files detected." > "$OUT"
  echo "No duplicates found."
  rm -f "$tmpfile" /tmp/dup-lines.txt
  exit 0
fi

echo "Duplicate file content hashes found. Generating report..." > "$OUT"
while IFS= read -r line; do
  hash=${line%%:::*}
  files=${line#*:::}
  echo "=== HASH: $hash ===" >> "$OUT"
  for f in $files; do
    echo "$f" >> "$OUT"
  done
  echo "" >> "$OUT"
done < /tmp/dup-lines.txt

echo "Report saved to $OUT"
rm -f "$tmpfile" /tmp/dup-lines.txt
#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
OUT="${2:-./agent-dup-report.txt}"
echo "Scanning for duplicate agent files under ${ROOT}..."
find "$ROOT" -type f \( -path "*/agents/*" -o -path "*/.github/agents/*" \) \( -iname "*.js" -o -iname "*.ts" -o -iname "*.json" \) -print0 \
  | xargs -0 md5sum | sort | awk '{print $1}' | uniq -d > /tmp/dup-md5.txt || true

if [ ! -s /tmp/dup-md5.txt ]; then
  echo "No duplicate-content files detected." > "$OUT"
  echo "No duplicates found."
  exit 0
fi

echo "Duplicate file content hashes found. Generating report..." > "$OUT"
while read -r hash; do
  echo "=== HASH: $hash ===" >> "$OUT"
  find "$ROOT" -type f \( -path "*/agents/*" -o -path "*/.github/agents/*" \) \( -iname "*.js" -o -iname "*.ts" -o -iname "*.json" \) -exec md5sum {} + | grep "^$hash" | awk '{print $2}' >> "$OUT"
done < /tmp/dup-md5.txt

echo "Report saved to $OUT"
#!/bin/bash

# Agent Duplicate Scanner
# Scans for duplicate content in agents folder to prevent redundancy

SCAN_DIR="${1:-.}"
OUTPUT_FILE="${2:-./agent-dup-report.txt}"

echo "🔍 Scanning for agent duplicates in: $SCAN_DIR"
echo "📄 Output file: $OUTPUT_FILE"

# Create output file
cat > "$OUTPUT_FILE" << EOF
# Agent Duplicate Scan Report
# Generated: $(date)
# Scan Directory: $SCAN_DIR

## Summary
EOF

# Find all agent-related files
AGENT_FILES=$(find "$SCAN_DIR" -type f \( -name "*.py" -o -name "*.ts" -o -name "*.js" \) | grep -E "(agent|Agent)" | sort)

if [ -z "$AGENT_FILES" ]; then
    echo "No agent files found." >> "$OUTPUT_FILE"
    echo "✅ No agent files found to scan."
    exit 0
fi

echo "Found $(echo "$AGENT_FILES" | wc -l) agent files to scan..." >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to calculate file hash
get_file_hash() {
    if command -v sha256sum &> /dev/null; then
        sha256sum "$1" | cut -d' ' -f1
    elif command -v shasum &> /dev/null; then
        shasum -a 256 "$1" | cut -d' ' -f1
    else
        # Fallback to basic checksum
        cksum "$1" | cut -d' ' -f1
    fi
}

# Function to get function signatures from file
get_function_signatures() {
    local file="$1"
    if [[ "$file" == *.py ]]; then
        grep -n "^def \|^class \|^async def " "$file" 2>/dev/null || true
    elif [[ "$file" == *.ts ]] || [[ "$file" == *.js ]]; then
        grep -n "function \|class \|export \|const.*=.*=>" "$file" 2>/dev/null || true
    fi
}

# Scan for exact duplicates
echo "## Exact File Duplicates" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

declare -A file_hashes
duplicate_found=false

while IFS= read -r file; do
    if [ -f "$file" ]; then
        hash=$(get_file_hash "$file")
        if [ -n "${file_hashes[$hash]}" ]; then
            echo "🔴 DUPLICATE: $file" >> "$OUTPUT_FILE"
            echo "   Original: ${file_hashes[$hash]}" >> "$OUTPUT_FILE"
            echo "" >> "$OUTPUT_FILE"
            duplicate_found=true
        else
            file_hashes[$hash]="$file"
        fi
    fi
done <<< "$AGENT_FILES"

if [ "$duplicate_found" = false ]; then
    echo "✅ No exact file duplicates found." >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"

# Scan for similar function signatures
echo "## Similar Function Signatures" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

declare -A function_signatures
similar_found=false

while IFS= read -r file; do
    if [ -f "$file" ]; then
        signatures=$(get_function_signatures "$file")
        if [ -n "$signatures" ]; then
            while IFS= read -r signature; do
                if [ -n "$signature" ]; then
                    # Extract just the function name for comparison
                    func_name=$(echo "$signature" | sed -E 's/.*[[:space:]](def|function|class|const)[[:space:]]+([a-zA-Z_][a-zA-Z0-9_]*).*/\2/' | tr -d ':')
                    if [ -n "$func_name" ] && [ "$func_name" != "$signature" ]; then
                        if [ -n "${function_signatures[$func_name]}" ] && [ "${function_signatures[$func_name]}" != "$file" ]; then
                            echo "⚠️  SIMILAR: Function '$func_name' found in:" >> "$OUTPUT_FILE"
                            echo "   File 1: ${function_signatures[$func_name]}" >> "$OUTPUT_FILE"
                            echo "   File 2: $file" >> "$OUTPUT_FILE"
                            echo "" >> "$OUTPUT_FILE"
                            similar_found=true
                        else
                            function_signatures[$func_name]="$file"
                        fi
                    fi
                fi
            done <<< "$signatures"
        fi
    fi
done <<< "$AGENT_FILES"

if [ "$similar_found" = false ]; then
    echo "✅ No similar function signatures found." >> "$OUTPUT_FILE"
fi

echo "" >> "$OUTPUT_FILE"

# Scan for common patterns
echo "## Common Patterns Analysis" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Count common imports/patterns
echo "### Most Common Imports:" >> "$OUTPUT_FILE"
find "$SCAN_DIR" -name "*.py" -exec grep -h "^import \|^from " {} \; 2>/dev/null | sort | uniq -c | sort -nr | head -10 >> "$OUTPUT_FILE" 2>/dev/null || echo "No Python imports found" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "### Most Common TypeScript/JavaScript Imports:" >> "$OUTPUT_FILE"
find "$SCAN_DIR" -name "*.ts" -o -name "*.js" -exec grep -h "^import \|^const.*require" {} \; 2>/dev/null | sort | uniq -c | sort -nr | head -10 >> "$OUTPUT_FILE" 2>/dev/null || echo "No TS/JS imports found" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"

# File size analysis
echo "## File Size Analysis" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

while IFS= read -r file; do
    if [ -f "$file" ]; then
        size=$(wc -l < "$file" 2>/dev/null || echo "0")
        echo "$size $file"
    fi
done <<< "$AGENT_FILES" | sort -nr | head -10 | while read -r size file; do
    echo "📏 $file: $size lines" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"

# Recommendations
echo "## Recommendations" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

if [ "$duplicate_found" = true ]; then
    echo "🔴 **URGENT**: Exact duplicates found. Consider:" >> "$OUTPUT_FILE"
    echo "   - Removing duplicate files" >> "$OUTPUT_FILE"
    echo "   - Creating shared utility modules" >> "$OUTPUT_FILE"
    echo "   - Implementing proper inheritance" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

if [ "$similar_found" = true ]; then
    echo "⚠️  **WARNING**: Similar functions found. Consider:" >> "$OUTPUT_FILE"
    echo "   - Extracting common functionality to base classes" >> "$OUTPUT_FILE"
    echo "   - Creating shared utility functions" >> "$OUTPUT_FILE"
    echo "   - Implementing proper abstraction layers" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

echo "✅ **GENERAL**: Best practices:" >> "$OUTPUT_FILE"
echo "   - Use the Agent SDK base classes" >> "$OUTPUT_FILE"
echo "   - Follow DRY (Don't Repeat Yourself) principles" >> "$OUTPUT_FILE"
echo "   - Implement proper error handling" >> "$OUTPUT_FILE"
echo "   - Add comprehensive tests" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "---" >> "$OUTPUT_FILE"
echo "Scan completed: $(date)" >> "$OUTPUT_FILE"

echo "✅ Agent duplicate scan completed!"
echo "📄 Report saved to: $OUTPUT_FILE"

# Display summary
if [ "$duplicate_found" = true ]; then
    echo "🔴 DUPLICATES FOUND - Review required!"
    exit 1
elif [ "$similar_found" = true ]; then
    echo "⚠️  Similar patterns found - Consider refactoring"
    exit 0
else
    echo "✅ No major issues found"
    exit 0
fi