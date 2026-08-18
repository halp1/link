<script lang="ts">
  import { LogOut } from "@lucide/svelte";

  interface Props {
    username: string;
  }

  let { username }: Props = $props();
</script>

<header
  class="titlebar app-chrome relative z-10 shrink-0 border-b border-border bg-surface pt-(--safe-top)"
>
  <div class="titlebar-row flex h-13 items-center gap-0 px-2 md:h-10 md:px-3">
    <div class="flex min-w-0 flex-1 items-center gap-3">
      <span class="shrink-0 [font-family:var(--font-heading)] text-lg tracking-[0.08em] text-accent"
        >HALP/LINK</span
      >
      <span class="hidden font-mono text-xs text-muted md:inline">{username}</span>
    </div>

    <form method="POST" action="/logout">
      <button
        type="submit"
        class="flex h-10 w-10 cursor-pointer items-center justify-center border-none bg-transparent text-muted transition-colors hover:bg-white/4 hover:text-text"
        title="Sign out — {username}"
        aria-label="Sign out"
      >
        <LogOut size={16} />
      </button>
    </form>
  </div>
</header>
