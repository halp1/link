<script lang="ts">
  import { ArrowLeft, Copy, Check } from "@lucide/svelte";
  import { PUBLIC_BASE_URL } from "$env/static/public";
  import { getLinkHits, updateLink } from "$lib/api/links.remote";
  import { formatExpiry, formatTimestamp } from "$lib/utils";
  import { notifications } from "$lib/notifications.svelte";
  import Toggle from "$lib/components/Toggle.svelte";
  import type { PageData } from "./$types";

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const linkId = $derived(data.link.id);
  const hitsResult = $derived(getLinkHits({ link_id: linkId }));
  let copied = $state(false);
  let showIp = $state(false);

  $effect(() => {
    showIp = data.link.show_ip === 1;
  });

  const baseUrl =
    PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const shortUrl = $derived(`${baseUrl}/${data.link.code}`);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shortUrl);
    copied = true;
    notifications.success("Link copied");
    setTimeout(() => {
      copied = false;
    }, 2000);
  };

  const saveShowIp = async (next: boolean) => {
    try {
      await updateLink({ id: data.link.id, show_ip: next });
      await hitsResult.refresh();
      notifications.success(next ? "IP addresses visible" : "IP addresses hidden");
    } catch {
      showIp = !next;
      notifications.error("Failed to update setting");
    }
  };
</script>

<svelte:head>
  <title>HALP/LINK | {data.link.code}</title>
</svelte:head>

<main class="flex flex-1 flex-col p-4 pt-6 pb-[calc(1.5rem+var(--safe-bottom))] md:p-6">
  <div class="mx-auto w-full max-w-3xl">
    <a
      href="/"
      class="mb-6 inline-flex items-center gap-2 font-mono text-xs tracking-[0.1em] text-muted uppercase transition-colors hover:text-accent"
    >
      <ArrowLeft size={14} />
      Back
    </a>

    <p class="mb-2 text-xs tracking-[0.18em] text-accent uppercase">Link stats</p>
    <h1 class="font-heading mb-6 text-3xl leading-[1.1] text-text md:text-4xl">
      {data.link.code}
    </h1>

    <div class="mb-7 flex flex-wrap gap-4 border-b border-border pb-5">
      <span class="flex flex-col gap-0.75">
        <span class="text-xs tracking-[0.16em] text-muted uppercase">Destination</span>
        <a
          href={data.link.destination_url}
          target="_blank"
          rel="noopener noreferrer"
          class="max-w-md truncate font-mono text-sm text-text hover:text-accent"
        >
          {data.link.destination_url}
        </a>
      </span>
      <span class="flex flex-col gap-0.75">
        <span class="text-xs tracking-[0.16em] text-muted uppercase">Short URL</span>
        <span class="flex items-center gap-2">
          <code class="font-mono text-sm text-accent">{shortUrl}</code>
          <button
            type="button"
            class="cursor-pointer border-none bg-transparent text-muted hover:text-accent"
            onclick={copyUrl}
            aria-label="Copy short URL"
          >
            {#if copied}
              <Check size={14} />
            {:else}
              <Copy size={14} />
            {/if}
          </button>
        </span>
      </span>
      <span class="flex flex-col gap-0.75">
        <span class="text-xs tracking-[0.16em] text-muted uppercase">Hits</span>
        <span class="font-mono text-sm text-text">{data.link.hit_count}</span>
      </span>
      <span class="flex flex-col gap-0.75">
        <span class="text-xs tracking-[0.16em] text-muted uppercase">Expires</span>
        <span class="font-mono text-sm text-accent"
          >{formatExpiry(data.link.expires_at)}</span
        >
      </span>
      <span class="flex flex-col gap-0.75">
        <span class="text-xs tracking-[0.16em] text-muted uppercase">Redirect</span>
        <span class="font-mono text-sm text-text">
          {data.link.redirect_mode === "direct"
            ? `Direct ${data.link.status_code}`
            : "Page load"}
        </span>
      </span>
      <span class="flex flex-col gap-0.75">
        <span class="text-xs tracking-[0.16em] text-muted uppercase">Created</span>
        <span class="font-mono text-sm text-text"
          >{formatTimestamp(data.link.created_at)}</span
        >
      </span>
    </div>

    <div class="mb-4 flex items-center justify-between gap-3">
      <h2 class="font-mono text-xs tracking-[0.14em] text-muted uppercase">
        Recent hits
      </h2>
      <Toggle bind:checked={showIp} label="Show IP" onchange={saveShowIp} />
    </div>

    <div class="border border-border bg-surface">
      {#await hitsResult then result}
        {#if result.hits.length === 0}
          <p class="px-4 py-8 text-center font-mono text-sm text-muted">No hits yet.</p>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full min-w-[640px] border-collapse font-mono text-xs">
              <thead>
                <tr class="border-b border-border text-left text-muted">
                  <th class="px-3 py-2.5 font-normal tracking-[0.1em] uppercase">Time</th>
                  <th class="px-3 py-2.5 font-normal tracking-[0.1em] uppercase">IP</th>
                  <th class="px-3 py-2.5 font-normal tracking-[0.1em] uppercase"
                    >Referer</th
                  >
                  <th class="px-3 py-2.5 font-normal tracking-[0.1em] uppercase"
                    >User agent</th
                  >
                </tr>
              </thead>
              <tbody>
                {#each result.hits as hit (hit.id)}
                  <tr class="border-b border-border/60 bg-bg/40">
                    <td class="px-3 py-2.5 whitespace-nowrap text-text"
                      >{formatTimestamp(hit.created_at)}</td
                    >
                    <td class="px-3 py-2.5 whitespace-nowrap text-text"
                      >{hit.ip_address ?? "—"}</td
                    >
                    <td
                      class="max-w-40 truncate px-3 py-2.5 text-muted"
                      title={hit.referer ?? ""}
                    >
                      {hit.referer ?? "—"}
                    </td>
                    <td
                      class="max-w-64 truncate px-3 py-2.5 text-muted"
                      title={hit.user_agent ?? ""}
                    >
                      {hit.user_agent ?? "—"}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          {#if result.total > result.hits.length}
            <p
              class="border-t border-border px-3 py-2 text-center font-mono text-xs text-muted"
            >
              Showing {result.hits.length} of {result.total} hits
            </p>
          {/if}
        {/if}
      {:catch}
        <p class="px-4 py-8 text-center font-mono text-sm text-[#ff8080]">
          Failed to load hits.
        </p>
      {/await}
    </div>
  </div>
</main>
