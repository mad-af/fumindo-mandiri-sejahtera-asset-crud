<script setup lang="ts">
import type { TableSchema } from '../../types/database';

defineProps<{
  schema: TableSchema;
}>();

/** Peta kode constraint PostgreSQL ke nama yang mudah dibaca. */
const CONSTRAINT_LABELS: Record<string, string> = {
  p: 'PRIMARY KEY',
  f: 'FOREIGN KEY',
  u: 'UNIQUE',
  c: 'CHECK',
  x: 'EXCLUDE',
  t: 'TRIGGER',
};
</script>

<template>
  <div class="schema">
    <!-- Kolom -->
    <section class="schema-block">
      <h3 class="schema-title">
        Kolom
        <span class="count-pill">{{ schema.columns.length }}</span>
      </h3>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th style="width: 44px">#</th>
              <th>Nama Kolom</th>
              <th style="width: 170px">Tipe Data</th>
              <th style="width: 90px">Nullable</th>
              <th style="width: 210px">Default</th>
              <th style="width: 130px">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="column in schema.columns" :key="column.column_name">
              <td class="num muted">{{ column.position }}</td>
              <td>
                <span class="col-name">{{ column.column_name }}</span>
              </td>
              <td>
                <code class="type">{{ column.data_type }}</code>
                <span v-if="column.character_maximum_length" class="muted">
                  ({{ column.character_maximum_length }})
                </span>
              </td>
              <td>
                <span :class="column.is_nullable === 'NO' ? 'not-null' : 'muted'">
                  {{ column.is_nullable === 'NO' ? 'NOT NULL' : 'NULL' }}
                </span>
              </td>
              <td class="default-cell">
                <code v-if="column.column_default" class="default">{{ column.column_default }}</code>
                <span v-else class="muted">&mdash;</span>
              </td>
              <td>
                <span v-if="column.is_primary_key" class="tag tag-pk">PK</span>
                <span v-if="column.is_enum" class="tag tag-enum">ENUM</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Constraint -->
    <section v-if="schema.constraints.length > 0" class="schema-block">
      <h3 class="schema-title">
        Constraint
        <span class="count-pill">{{ schema.constraints.length }}</span>
      </h3>

      <ul class="def-list">
        <li v-for="constraint in schema.constraints" :key="constraint.name">
          <span class="tag tag-constraint">
            {{ CONSTRAINT_LABELS[constraint.type] ?? constraint.type }}
          </span>
          <code class="definition">{{ constraint.definition }}</code>
        </li>
      </ul>
    </section>

    <!-- Index -->
    <section v-if="schema.indexes.length > 0" class="schema-block">
      <h3 class="schema-title">
        Index
        <span class="count-pill">{{ schema.indexes.length }}</span>
      </h3>

      <ul class="def-list">
        <li v-for="index in schema.indexes" :key="index.name">
          <code class="definition">{{ index.definition }}</code>
        </li>
      </ul>
    </section>

    <!-- Enum -->
    <section v-if="schema.enums.length > 0" class="schema-block">
      <h3 class="schema-title">
        Tipe Enum
        <span class="count-pill">{{ schema.enums.length }}</span>
      </h3>

      <ul class="def-list">
        <li v-for="enumType in schema.enums" :key="enumType.type_name">
          <code class="definition">{{ enumType.type_name }}</code>
          <span class="enum-labels">
            <span v-for="label in enumType.labels" :key="label" class="badge badge-consumable">
              {{ label }}
            </span>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.schema {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.schema-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schema-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.count-pill {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
}

.col-name {
  font-weight: 500;
}

code.type,
code.default {
  font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px;
  color: #7c3aed;
}

code.default {
  color: var(--text-muted);
  word-break: break-all;
}

.muted {
  color: var(--text-subtle);
}

.not-null {
  color: var(--warning);
  font-weight: 500;
}

.default-cell {
  max-width: 220px;
}

.tag {
  display: inline-block;
  height: 19px;
  padding: 0 7px;
  border-radius: 5px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  margin-right: 4px;
  line-height: 19px;
}

.tag-pk {
  background: var(--primary-soft);
  color: var(--primary-hover);
  border: 1px solid #bfdbfe;
}

.tag-enum {
  background: var(--success-soft);
  color: var(--success);
  border: 1px solid #a7f3d0;
}

.tag-constraint {
  background: var(--surface-2);
  color: var(--text-muted);
  border: 1px solid var(--border);
  margin-right: 8px;
}

.def-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.def-list li {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 9px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

code.definition {
  font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--text-muted);
  word-break: break-word;
  line-height: 1.6;
}

.enum-labels {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-left: auto;
}
</style>
