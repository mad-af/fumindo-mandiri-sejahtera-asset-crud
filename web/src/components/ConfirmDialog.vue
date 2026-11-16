<script setup lang="ts">
defineProps<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @click.self="!loading && emit('cancel')">
      <div class="modal" style="max-width: 400px" role="alertdialog" aria-modal="true">
        <header class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
        </header>

        <div class="modal-body">
          <p style="font-size: 13.5px; color: var(--text-muted); margin: 0">
            {{ message }}
          </p>
        </div>

        <footer class="modal-footer">
          <button class="btn btn-secondary" type="button" :disabled="loading" @click="emit('cancel')">
            Batal
          </button>
          <button class="btn btn-danger" type="button" :disabled="loading" @click="emit('confirm')">
            <span v-if="loading" class="spinner" />
            {{ loading ? 'Menghapus...' : confirmLabel ?? 'Hapus' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
