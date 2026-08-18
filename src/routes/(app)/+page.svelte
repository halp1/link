<script lang="ts">
  import { Plus, Trash2, Copy, Check, BarChart2, ExternalLink } from "@lucide/svelte";
  import { PUBLIC_BASE_URL } from "$env/static/public";
  import { getLinks, createLink, deleteLink } from "$lib/api/links.remote";
  import { formatExpiry, truncateUrl } from "$lib/utils";
  import { notifications } from "$lib/notifications.svelte";
  import Toggle from "$lib/components/Toggle.svelte";

  const linksResult = getLinks();

  let showNewLink = $state(false);
  let creatingLink = $state(false);
  let destinationUrl = $state("");
  let redirectMode = $state<"direct" | "page">("direct");
  let statusCode = $state<301 | 302 | 307>(302);
  let expiryPreset = $state<"never" | "1" | "24" | "168" | "720" | "custom">("never");
  let customExpiryHours = $state(48);
  let showIp = $state(false);
  let copiedCode = $state("");
  let newLinkCode = $state("");

  const baseUrl =
    PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");

  const expiryHours = $derived.by(() => {
    if (expiryPreset === "never") return null;
    if (expiryPreset === "custom") return customExpiryHours;
    return Number(expiryPreset);
  });

  const submitLink = async () => {
    if (!destinationUrl.trim()) return;
    creatingLink = true;
    try {
      const result = await createLink({
        destination_url: destinationUrl.trim(),
        redirect_mode: redirectMode,
        status_code: redirectMode === "direct" ? statusCode : 302,
        expires_in_hours: expiryHours,
        show_ip: showIp,
      });
      newLinkCode = result.code;
      destinationUrl = "";
      redirectMode = "direct";
      statusCode = 302;
      expiryPreset = "never";
      showIp = false;
      showNewLink = false;
      notifications.success("Link created");
    } catch {
      notifications.error("Failed to create link");
    } finally {
      creatingLink = false;
    }
  };

  const copyUrl = async (code: string) => {
    const url = `${baseUrl}/${code}`;
    await navigator.clipboard.writeText(url);
    copiedCode = code;
    notifications.success("Link copied");
    setTimeout(() => {
      copiedCode = "";
    }, 2000);
  };

  const removeLink = async (id: number) => {
    try {
      await deleteLink({ id });
      notifications.success("Link deleted");
    } catch {
      notifications.error("Failed to delete link");
    }
  };
</script>

<svelte:head>
  <title>HALP/LINK | Dashboard</title>
</svelte:head>

<main class="flex flex-1 flex-col p-4 pt-6 pb-[calc(1.5rem+var(--safe-bottom))] md:p-6">
  <div class="mx-auto w-full max-w-3xl">
    <p class="mb-2 text-xs tracking-[0.18em] text-accent uppercase">Short links</p>
    <h1 class="font-heading mb-8 text-3xl leading-[1.1] text-text md:text-4xl">
      Dashboard.
    </h1>

    {#if newLinkCode}
      <div
        class="card relative mb-6 animate-[fadeUp_0.2s_ease_both] border border-accent/30 bg-surface px-4 py-4 md:px-5"
      >
        <p class="mb-2 text-xs tracking-[0.14em] text-muted uppercase">New short link</p>
        <code class="block font-mono text-lg text-accent">{baseUrl}/{newLinkCode}</code>
        <button
          type="button"
          class="mt-3 cursor-pointer border border-border bg-transparent px-3 py-1.5 font-mono text-xs tracking-[0.08em] text-muted uppercase transition-all hover:border-accent hover:text-accent"
          onclick={() => (newLinkCode = "")}>Dismiss</button
        >
      </div>
    {/if}

    <div class="border border-border bg-surface p-4 md:p-5">
      <button
        class="mb-1 flex w-full cursor-pointer items-center justify-center gap-1.5 border border-border bg-transparent px-2.5 py-1.5 font-mono text-xs tracking-[0.08em] text-muted uppercase transition-all hover:border-accent hover:text-accent"
        onclick={() => (showNewLink = !showNewLink)}
      >
        <Plus size={12} />
        New link
      </button>

      {#if showNewLink}
        <div
          class="mb-4 flex animate-[fadeUp_0.15s_ease_both] flex-col gap-2.5 border border-border bg-bg p-3"
        >
          <div>
            <label
              class="mb-1.5 block text-xs tracking-[0.12em] text-muted uppercase"
              for="dest">Destination URL</label
            >
            <input
              id="dest"
              class="w-full rounded-none border border-border bg-input-bg px-3 py-2 font-mono text-sm text-text outline-none focus:border-accent"
              type="url"
              placeholder="https://example.com/page"
              bind:value={destinationUrl}
            />
          </div>

          <div class="grid gap-2.5 md:grid-cols-2">
            <div>
              <label
                class="mb-1.5 block text-xs tracking-[0.12em] text-muted uppercase"
                for="mode">Redirect mode</label
              >
              <select
                id="mode"
                class="w-full rounded-none border border-border bg-input-bg px-3 py-2 font-mono text-sm text-text outline-none focus:border-accent"
                bind:value={redirectMode}
              >
                <option value="direct">Direct (30X)</option>
                <option value="page">Page load</option>
              </select>
            </div>

            {#if redirectMode === "direct"}
              <div>
                <label
                  class="mb-1.5 block text-xs tracking-[0.12em] text-muted uppercase"
                  for="status">Status code</label
                >
                <select
                  id="status"
                  class="w-full rounded-none border border-border bg-input-bg px-3 py-2 font-mono text-sm text-text outline-none focus:border-accent"
                  bind:value={statusCode}
                >
                  <option value={301}>301 Permanent</option>
                  <option value={302}>302 Temporary</option>
                  <option value={307}>307 Temporary</option>
                </select>
              </div>
            {/if}

            <div>
              <label
                class="mb-1.5 block text-xs tracking-[0.12em] text-muted uppercase"
                for="expiry">Expires in</label
              >
              <select
                id="expiry"
                class="w-full rounded-none border border-border bg-input-bg px-3 py-2 font-mono text-sm text-text outline-none focus:border-accent"
                bind:value={expiryPreset}
              >
                <option value="never">Never</option>
                <option value="1">1 hour</option>
                <option value="24">24 hours</option>
                <option value="168">7 days</option>
                <option value="720">30 days</option>
                <option value="custom">Custom hours</option>
              </select>
            </div>

            {#if expiryPreset === "custom"}
              <div>
                <label
                  class="mb-1.5 block text-xs tracking-[0.12em] text-muted uppercase"
                  for="custom">Custom hours</label
                >
                <input
                  id="custom"
                  class="w-full rounded-none border border-border bg-input-bg px-3 py-2 font-mono text-sm text-text outline-none focus:border-accent"
                  type="number"
                  min="1"
                  bind:value={customExpiryHours}
                />
              </div>
            {/if}
          </div>

          <div>
            <p class="mb-1.5 text-xs tracking-[0.12em] text-muted uppercase">
              IP visibility
            </p>
            <Toggle bind:checked={showIp} label="Show in stats" />
          </div>

          <button
            type="button"
            class="cursor-pointer border-none bg-accent py-2.5 font-mono text-xs tracking-[0.1em] text-bg uppercase transition-opacity hover:opacity-[0.88] disabled:opacity-50"
            disabled={creatingLink || !destinationUrl.trim()}
            onclick={submitLink}
          >
            {creatingLink ? "Creating…" : "Create link"}
          </button>
        </div>
      {/if}

      {#await linksResult then { links }}
        {#if links.length === 0}
          <p class="py-8 text-center font-mono text-sm text-muted">No links yet.</p>
        {:else}
          <div class="flex flex-col gap-2">
            {#each links as link (link.id)}
              <div
                class="flex animate-[fadeUp_0.2s_ease_both] flex-col gap-2 border border-border bg-bg px-3 py-2.5"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <code class="font-mono text-sm text-accent">{link.code}</code>
                    <p
                      class="mt-1 truncate font-mono text-xs text-muted"
                      title={link.destination_url}
                    >
                      {truncateUrl(link.destination_url, 56)}
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-0.5">
                    <a
                      href="/links/{link.id}"
                      class="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-accent"
                      title="View hits"
                      aria-label="View hits"
                    >
                      <BarChart2 size={14} />
                    </a>
                    <a
                      href="/{link.code}"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-accent"
                      title="Open link"
                      aria-label="Open link"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      type="button"
                      class="flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent text-muted transition-colors hover:text-accent"
                      onclick={() => copyUrl(link.code)}
                      title="Copy short URL"
                      aria-label="Copy short URL"
                    >
                      {#if copiedCode === link.code}
                        <Check size={14} />
                      {:else}
                        <Copy size={14} />
                      {/if}
                    </button>
                    <button
                      type="button"
                      class="flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent text-muted transition-colors hover:text-[#ff8080]"
                      onclick={() => removeLink(link.id)}
                      title="Delete link"
                      aria-label="Delete link"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-1">
                  <span
                    class="border border-border px-1.25 py-px text-xs tracking-widest text-muted uppercase"
                  >
                    {link.hit_count} hits
                  </span>
                  <span
                    class="border border-accent/30 px-1.25 py-px text-xs tracking-widest text-accent uppercase"
                  >
                    {formatExpiry(link.expires_at)}
                  </span>
                  <span
                    class="border border-border px-1.25 py-px text-xs tracking-widest text-muted uppercase"
                  >
                    {link.redirect_mode === "direct" ? `${link.status_code}` : "page"}
                  </span>
                  {#if link.show_ip}
                    <span
                      class="border border-border px-1.25 py-px text-xs tracking-widest text-muted uppercase"
                    >
                      ip visible
                    </span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {:catch}
        <p class="py-8 text-center font-mono text-sm text-[#ff8080]">
          Failed to load links.
        </p>
      {/await}
    </div>
  </div>
</main>

<style>
  .card::before {
    content: "";
    position: absolute;
    top: -1px;
    right: -1px;
    width: 32px;
    height: 32px;
    border-top: 2px solid var(--color-accent);
    border-right: 2px solid var(--color-accent);
  }
</style>
