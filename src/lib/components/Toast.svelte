<script lang="ts">
  import { X } from "@lucide/svelte";
  import { notifications } from "$lib/notifications.svelte";
</script>

<div
  class="pointer-events-none fixed right-3 bottom-[calc(1rem+var(--safe-bottom))] left-3 z-70 flex flex-col items-stretch gap-2 md:right-4 md:bottom-4 md:left-auto md:items-end"
>
  {#each notifications.toasts as toast (toast.id)}
    <div
      class="toast pointer-events-auto flex items-start gap-3 border border-border bg-surface px-3.5 py-3 shadow-lg md:max-w-sm md:min-w-72"
      class:toast--error={toast.type === "error"}
      class:toast--success={toast.type === "success"}
      class:toast--loading={toast.type === "loading"}
    >
      {#if toast.type === "loading"}
        <span class="toast-spinner mt-0.5 shrink-0"></span>
      {/if}
      <span class="min-w-0 flex-1 font-mono text-xs leading-relaxed break-words text-text">
        {toast.message}
      </span>
      <button
        class="-my-1 -mr-1 flex shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-2 text-muted transition-colors hover:text-text md:mt-0.5 md:mr-0 md:mb-0 md:p-0"
        onclick={() => notifications.dismiss(toast.id)}
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  {/each}
</div>

<style>
  .toast {
    animation: slide-in 0.15s ease-out;
    border-left: 3px solid var(--border);
  }

  .toast--error {
    border-left-color: #ff8080;
  }

  .toast--success {
    border-left-color: var(--accent);
  }

  .toast--loading {
    border-left-color: #6ab4f5;
  }

  .toast-spinner {
    width: 12px;
    height: 12px;
    border: 1.5px solid #6ab4f5;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: block;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(1rem);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>
