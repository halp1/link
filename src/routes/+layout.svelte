<script lang="ts">
  import "./layout.css";
  import Toast from "$lib/components/Toast.svelte";

  let { children } = $props();
</script>

{@render children()}
<Toast />
