<script setup lang="ts">
import { useToast } from '../composables/useToast';

const { toasts, dismiss } = useToast();
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="toast.type === 'success' ? 'toast-success' : 'toast-error'"
        role="status"
      >
        <span
          class="toast-icon"
          :class="toast.type === 'success' ? 'toast-icon--success' : 'toast-icon--error'"
        >
          <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
            stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </span>

        <div style="flex: 1">
          <p class="toast-title">{{ toast.title }}</p>
          <p v-if="toast.message" class="toast-message">{{ toast.message }}</p>
        </div>

        <button class="toast-close" type="button" aria-label="Tutup notifikasi" @click="dismiss(toast.id)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
            stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-icon {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 1px;
}

.toast-icon--success {
  background: var(--success-soft);
  color: var(--success);
}

.toast-icon--error {
  background: var(--danger-soft);
  color: var(--danger);
}

.toast-close {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--text-subtle);
  border-radius: 5px;
  flex-shrink: 0;
}

.toast-close:hover {
  background: var(--surface-2);
  color: var(--text);
}
</style>
