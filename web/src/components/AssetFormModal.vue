<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue';
import type { Asset, AssetCategory, CreateAssetPayload } from '../types/asset';

const props = defineProps<{
  open: boolean;
  asset: Asset | null;
  submitting: boolean;
  serverError: string | null;
}>();

const emit = defineEmits<{
  close: [];
  submit: [payload: CreateAssetPayload];
}>();

const CATEGORY_OPTIONS: Array<{
  value: AssetCategory;
  label: string;
  description: string;
}> = [
  {
    value: 'Consumable',
    label: 'Consumable',
    description: 'Barang habis dipakai (kertas, tinta, kabel)',
  },
  {
    value: 'Non-Consumable',
    label: 'Non-Consumable',
    description: 'Barang yang dipakai berulang (peralatan, elektronik)',
  },
];

const form = reactive({
  asset_name: '',
  stock_quantity: 0,
  category: 'Consumable' as AssetCategory,
});

const errors = reactive<{
  asset_name?: string;
  stock_quantity?: string;
}>({});

const nameInput = ref<HTMLInputElement | null>(null);

const isEdit = () => props.asset !== null;

function resetForm() {
  form.asset_name = props.asset?.asset_name ?? '';
  form.stock_quantity = props.asset?.stock_quantity ?? 0;
  form.category = props.asset?.category ?? 'Consumable';
  errors.asset_name = undefined;
  errors.stock_quantity = undefined;
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }

    resetForm();
    await nextTick();
    nameInput.value?.focus();
  },
);

function validate(): boolean {
  errors.asset_name = undefined;
  errors.stock_quantity = undefined;

  const name = form.asset_name.trim();
  if (!name) {
    errors.asset_name = 'Nama asset wajib diisi.';
  } else if (name.length > 150) {
    errors.asset_name = 'Nama asset maksimal 150 karakter.';
  }

  const quantity = Number(form.stock_quantity);
  if (!Number.isInteger(quantity)) {
    errors.stock_quantity = 'Stok harus berupa bilangan bulat.';
  } else if (quantity < 0) {
    errors.stock_quantity = 'Stok tidak boleh bernilai negatif.';
  }

  return !errors.asset_name && !errors.stock_quantity;
}

function handleSubmit() {
  if (!validate()) {
    return;
  }

  emit('submit', {
    asset_name: form.asset_name.trim(),
    stock_quantity: Number(form.stock_quantity),
    category: form.category,
  });
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @click.self="!submitting && emit('close')">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <header class="modal-header">
          <h2 id="form-title" class="modal-title">
            {{ isEdit() ? 'Edit Asset' : 'Tambah Asset' }}
          </h2>
          <p class="modal-subtitle">
            {{
              isEdit()
                ? 'Perbarui data asset yang sudah ada.'
                : 'Isi data asset baru untuk ditambahkan ke inventaris.'
            }}
          </p>
        </header>

        <form class="modal-body" novalidate @submit.prevent="handleSubmit">
          <div v-if="serverError" class="alert alert-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" width="16" height="16"
              style="flex-shrink: 0; margin-top: 1px">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" />
            </svg>
            <span>{{ serverError }}</span>
          </div>

          <div class="field">
            <label class="label" for="asset-name">
              Nama Asset<span class="required">*</span>
            </label>
            <input
              id="asset-name"
              ref="nameInput"
              v-model="form.asset_name"
              class="input"
              :class="{ 'has-error': errors.asset_name }"
              type="text"
              maxlength="150"
              placeholder="Contoh: Kabel HDMI 2.1"
              :disabled="submitting"
            />
            <span v-if="errors.asset_name" class="error-text">{{ errors.asset_name }}</span>
            <span v-else class="hint">Maksimal 150 karakter.</span>
          </div>

          <div class="field">
            <label class="label" for="stock-quantity">
              Stok<span class="required">*</span>
            </label>
            <input
              id="stock-quantity"
              v-model.number="form.stock_quantity"
              class="input"
              :class="{ 'has-error': errors.stock_quantity }"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              :disabled="submitting"
            />
            <span v-if="errors.stock_quantity" class="error-text">
              {{ errors.stock_quantity }}
            </span>
            <span v-else class="hint">Jumlah unit barang yang tersedia.</span>
          </div>

          <div class="field">
            <span class="label">Kategori<span class="required">*</span></span>
            <div class="category-options">
              <label
                v-for="option in CATEGORY_OPTIONS"
                :key="option.value"
                class="category-option"
                :class="{ 'is-active': form.category === option.value }"
              >
                <input
                  v-model="form.category"
                  type="radio"
                  name="category"
                  :value="option.value"
                  :disabled="submitting"
                />
                <span class="category-option-body">
                  <span class="category-option-title">{{ option.label }}</span>
                  <span class="category-option-desc">{{ option.description }}</span>
                </span>
              </label>
            </div>
          </div>
        </form>

        <footer class="modal-footer">
          <button class="btn btn-secondary" type="button" :disabled="submitting" @click="emit('close')">
            Batal
          </button>
          <button class="btn btn-primary" type="button" :disabled="submitting" @click="handleSubmit">
            <span v-if="submitting" class="spinner" />
            {{ submitting ? 'Menyimpan...' : isEdit() ? 'Simpan Perubahan' : 'Simpan Asset' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.category-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 13px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.category-option:hover {
  background: var(--surface-2);
}

.category-option.is-active {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.category-option input {
  margin: 2px 0 0;
  accent-color: var(--primary);
  cursor: pointer;
}

.category-option-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.category-option-title {
  font-size: 13.5px;
  font-weight: 600;
}

.category-option-desc {
  font-size: 12.5px;
  color: var(--text-muted);
}
</style>
