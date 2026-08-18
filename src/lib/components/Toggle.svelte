<script lang="ts">
  interface Props {
    checked?: boolean;
    label: string;
    onchange?: (checked: boolean) => void;
  }

  let { checked = $bindable(false), label, onchange }: Props = $props();

  const toggle = () => {
    checked = !checked;
    onchange?.(checked);
  };
</script>

<button
  type="button"
  role="switch"
  aria-checked={checked}
  aria-label={label}
  class="inline-flex cursor-pointer items-center gap-2 border px-2.5 py-1.5 font-mono text-xs tracking-[0.08em] uppercase transition-all {checked
    ? 'border-accent/40 bg-accent/10 text-accent'
    : 'border-border bg-transparent text-muted hover:border-accent hover:text-accent'}"
  onclick={toggle}
>
  <span
    class="flex h-3 w-3 shrink-0 items-center justify-center border transition-colors {checked
      ? 'border-accent bg-accent'
      : 'border-border bg-input-bg'}"
    aria-hidden="true"
  >
    {#if checked}
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
        <path d="M1.5 4L3.25 5.75L6.5 2.5" stroke="#0e0e0e" stroke-width="1.25" />
      </svg>
    {/if}
  </span>
  {label}
</button>
