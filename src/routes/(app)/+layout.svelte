<script lang="ts">
  import type { LayoutData } from "./$types";
  import Header from "$lib/components/Header.svelte";

  interface Props {
    data: LayoutData;
    children: import("svelte").Snippet;
  }

  let { data, children }: Props = $props();
</script>

<div class="relative z-1 flex min-h-[100dvh] flex-col">
  <Header username={data.user?.username ?? ""} />
  {@render children()}
</div>
