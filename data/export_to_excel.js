/**
 * FocusGuard AI — PostgreSQL → Excel / CSV Exporter
 * Queries the database and exports to data/user_activity_export.xlsx + .csv
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "focusguard_db",
  password: "Yashu@524230",
  port: 5432,
});

const OUTPUT_DIR = path.resolve(__dirname, "../data");

async function run() {
  try {
    // 1. List all tables in public schema
    const tablesRes = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    const tables = tablesRes.rows.map((r) => r.table_name);
    console.log("📋 Tables found in public schema:", tables.join(", "));

    // 2. Try user_activity first, then fall back to all known tables
    let targetTable = null;
    if (tables.includes("user_activity")) {
      targetTable = "user_activity";
    } else {
      // Export all monitoring-related tables
      console.log(
        '⚠️  Table "user_activity" not found. Exporting all available tables instead.'
      );
    }

    if (targetTable) {
      await exportTable(targetTable);
    } else {
      // Export every table found
      for (const tbl of tables) {
        await exportTable(tbl);
      }
    }

    console.log("\n✅ Export complete. Files saved to:", OUTPUT_DIR);
  } catch (err) {
    console.error("❌ Export failed:", err.message);
  } finally {
    await pool.end();
  }
}

async function exportTable(tableName) {
  console.log(`\n🔄 Exporting table: ${tableName}`);

  const res = await pool.query(
    `SELECT * FROM public."${tableName}" ORDER BY id ASC`
  );
  const rows = res.rows;

  if (rows.length === 0) {
    console.log(`  ℹ️  No data in ${tableName} — skipping.`);
    return;
  }

  console.log(`  ✓  ${rows.length} rows retrieved`);

  const columns = Object.keys(rows[0]);

  // ── CSV Export ────────────────────────────────────────────────────────────
  const csvLines = [
    columns.map(escapeCSV).join(","),
    ...rows.map((row) =>
      columns.map((col) => escapeCSV(row[col])).join(",")
    ),
  ];
  const csvPath = path.join(OUTPUT_DIR, `${tableName}_export.csv`);
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf8");
  console.log(`  📄 CSV  → ${csvPath}`);

  // ── Excel XLSX Export (manual XML-based .xlsx) ────────────────────────────
  const xlsxPath = path.join(OUTPUT_DIR, `${tableName}_export.xlsx`);
  writeXlsx(xlsxPath, tableName, columns, rows);
  console.log(`  📊 XLSX → ${xlsxPath}`);
}

function escapeCSV(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ── Minimal XLSX writer (no external dependencies) ────────────────────────────
// Generates a valid Office Open XML .xlsx file using zip/xml construction.
function writeXlsx(filePath, sheetName, columns, rows) {
  // Build shared strings
  const strings = [];
  const strIndex = {};
  function addStr(val) {
    const s = val === null || val === undefined ? "" : String(val);
    if (strIndex[s] === undefined) {
      strIndex[s] = strings.length;
      strings.push(s);
    }
    return strIndex[s];
  }

  // Header row + data rows
  const allRows = [columns, ...rows.map((r) => columns.map((c) => r[c]))];

  // Build worksheet XML
  let wsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>`;

  allRows.forEach((row, rIdx) => {
    wsXml += `\n    <row r="${rIdx + 1}">`;
    row.forEach((cell, cIdx) => {
      const colLetter = colToLetter(cIdx + 1);
      const cellAddr = `${colLetter}${rIdx + 1}`;
      const val = cell === null || cell === undefined ? "" : cell;
      const isNumeric =
        rIdx > 0 && typeof val === "number" && !isNaN(val);
      const isDate = rIdx > 0 && val instanceof Date;

      if (isDate) {
        // Store date as ISO string in shared strings
        const si = addStr(val.toISOString());
        wsXml += `<c r="${cellAddr}" t="s"><v>${si}</v></c>`;
      } else if (isNumeric) {
        wsXml += `<c r="${cellAddr}"><v>${val}</v></c>`;
      } else {
        const si = addStr(String(val));
        wsXml += `<c r="${cellAddr}" t="s"><v>${si}</v></c>`;
      }
    });
    wsXml += `</row>`;
  });

  wsXml += `\n  </sheetData>\n</worksheet>`;

  // Build shared strings XML
  let sstXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">`;
  strings.forEach((s) => {
    sstXml += `<si><t xml:space="preserve">${escapeXml(s)}</t></si>`;
  });
  sstXml += `</sst>`;

  // Workbook XML
  const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${sheetName.substring(0, 31)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  // Relationships
  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`;

  const topRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`;

  // Pack as ZIP (xlsx = zip)
  const zip = buildZip({
    "[Content_Types].xml": contentTypes,
    "_rels/.rels": topRels,
    "xl/workbook.xml": wbXml,
    "xl/_rels/workbook.xml.rels": wbRels,
    "xl/worksheets/sheet1.xml": wsXml,
    "xl/sharedStrings.xml": sstXml,
  });

  fs.writeFileSync(filePath, zip);
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function colToLetter(n) {
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// ── Minimal ZIP builder (no external deps) ────────────────────────────────────
function buildZip(files) {
  const entries = [];
  const centralDir = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = Buffer.from(name, "utf8");
    const dataBytes = Buffer.from(content, "utf8");
    const crc = crc32(dataBytes);
    const dosDate = getDosDate(new Date());

    // Local file header
    const localHeader = Buffer.alloc(30 + nameBytes.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4);          // version needed
    localHeader.writeUInt16LE(0, 6);           // flags
    localHeader.writeUInt16LE(0, 8);           // compression (store)
    localHeader.writeUInt16LE(dosDate.time, 10);
    localHeader.writeUInt16LE(dosDate.date, 12);
    localHeader.writeUInt32LE(crc >>> 0, 14);
    localHeader.writeUInt32LE(dataBytes.length, 18);
    localHeader.writeUInt32LE(dataBytes.length, 22);
    localHeader.writeUInt16LE(nameBytes.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBytes.copy(localHeader, 30);

    entries.push(localHeader, dataBytes);

    // Central directory entry
    const cdEntry = Buffer.alloc(46 + nameBytes.length);
    cdEntry.writeUInt32LE(0x02014b50, 0);  // signature
    cdEntry.writeUInt16LE(20, 4);           // version made by
    cdEntry.writeUInt16LE(20, 6);           // version needed
    cdEntry.writeUInt16LE(0, 8);            // flags
    cdEntry.writeUInt16LE(0, 10);           // compression
    cdEntry.writeUInt16LE(dosDate.time, 12);
    cdEntry.writeUInt16LE(dosDate.date, 14);
    cdEntry.writeUInt32LE(crc >>> 0, 16);
    cdEntry.writeUInt32LE(dataBytes.length, 20);
    cdEntry.writeUInt32LE(dataBytes.length, 24);
    cdEntry.writeUInt16LE(nameBytes.length, 28);
    cdEntry.writeUInt16LE(0, 30);           // extra
    cdEntry.writeUInt16LE(0, 32);           // comment
    cdEntry.writeUInt16LE(0, 34);           // disk start
    cdEntry.writeUInt16LE(0, 36);           // internal attr
    cdEntry.writeUInt32LE(0, 38);           // external attr
    cdEntry.writeUInt32LE(offset, 42);      // local header offset
    nameBytes.copy(cdEntry, 46);
    centralDir.push(cdEntry);

    offset += localHeader.length + dataBytes.length;
  }

  const cdBuf = Buffer.concat(centralDir);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);   // signature
  eocd.writeUInt16LE(0, 4);             // disk number
  eocd.writeUInt16LE(0, 6);             // cd disk
  eocd.writeUInt16LE(centralDir.length, 8);
  eocd.writeUInt16LE(centralDir.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...entries, cdBuf, eocd]);
}

function getDosDate(date) {
  const time =
    ((date.getHours() & 0x1f) << 11) |
    ((date.getMinutes() & 0x3f) << 5) |
    ((Math.floor(date.getSeconds() / 2)) & 0x1f);
  const d =
    (((date.getFullYear() - 1980) & 0x7f) << 9) |
    (((date.getMonth() + 1) & 0x0f) << 5) |
    (date.getDate() & 0x1f);
  return { time, date: d };
}

function crc32(buf) {
  let crc = 0xffffffff;
  const table = crc32.table || (crc32.table = buildCRCTable());
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function buildCRCTable() {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c;
  }
  return t;
}

run();
