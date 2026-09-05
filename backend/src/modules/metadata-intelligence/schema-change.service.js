// src/modules/metadata-intelligence/schema-change.service.js
// ============================================================
// Deterministic schema diffing. Pure functions only — no Prisma,
// no I/O — so this can be unit tested directly and reused by both
// the /metadata/schema/compare endpoint and the investigation engine.
// ============================================================

const SEVERITY = { LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH" };

/**
 * Compare two column snapshots and return a list of detected changes.
 * @param {Array<{name:string,dataType:string,isNullable?:boolean}>} oldColumns
 * @param {Array<{name:string,dataType:string,isNullable?:boolean}>} newColumns
 */
export function compareSchemas(oldColumns = [], newColumns = []) {
  const oldByName = new Map(oldColumns.map((c) => [c.name, c]));
  const newByName = new Map(newColumns.map((c) => [c.name, c]));

  const removedNames = [...oldByName.keys()].filter((name) => !newByName.has(name));
  const addedNames = [...newByName.keys()].filter((name) => !oldByName.has(name));

  const changes = [];
  const renamedOld = new Set();
  const renamedNew = new Set();

  // Heuristic rename detection: a removed + added column pair with the
  // same data type is treated as a rename rather than a drop + add.
  for (const oldName of removedNames) {
    const oldCol = oldByName.get(oldName);
    const candidate = addedNames.find(
      (newName) => !renamedNew.has(newName) && newByName.get(newName).dataType === oldCol.dataType && isLikelyRename(oldName, newName)
    );
    if (candidate) {
      renamedOld.add(oldName);
      renamedNew.add(candidate);
      changes.push({
        type: "COLUMN_RENAMED",
        column: candidate,
        previousColumn: oldName,
        severity: SEVERITY.MEDIUM,
      });
    }
  }

  for (const name of removedNames) {
    if (renamedOld.has(name)) continue;
    changes.push({ type: "COLUMN_REMOVED", column: name, severity: SEVERITY.HIGH });
  }

  for (const name of addedNames) {
    if (renamedNew.has(name)) continue;
    changes.push({ type: "COLUMN_ADDED", column: name, severity: SEVERITY.LOW });
  }

  for (const [name, oldCol] of oldByName) {
    const newCol = newByName.get(name);
    if (!newCol) continue;

    if (oldCol.dataType !== newCol.dataType) {
      changes.push({
        type: "TYPE_CHANGED",
        column: name,
        from: oldCol.dataType,
        to: newCol.dataType,
        severity: SEVERITY.HIGH,
      });
    }

    const oldNullable = oldCol.isNullable ?? true;
    const newNullable = newCol.isNullable ?? true;
    if (oldNullable !== newNullable) {
      changes.push({
        type: "NULLABLE_CHANGED",
        column: name,
        from: oldNullable,
        to: newNullable,
        // Nullable -> NOT NULL can break existing rows/writers; the reverse is safe.
        severity: oldNullable && !newNullable ? SEVERITY.HIGH : SEVERITY.LOW,
      });
    }
  }

  return { changes };
}

function isLikelyRename(oldName, newName) {
  const a = oldName.toLowerCase();
  const b = newName.toLowerCase();
  return a.includes(b) || b.includes(a);
}
