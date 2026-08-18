<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  interface Props {
    data: PageData;
    form: ActionData;
  }
  let { data, form }: Props = $props();

  let mode = $state<"login" | "register">("login");
  $effect(() => {
    if (data.isFirstUser) mode = "register";
  });
</script>

<svelte:head>
  <title>HALP/LINK | {mode === "login" ? "Login" : "Register"}</title>
</svelte:head>

<div
  class="relative z-1 flex min-h-[100dvh] items-center justify-center p-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] md:p-6"
>
  <div
    class="card relative w-full max-w-95 animate-[fadeUp_0.5s_ease_both] border border-border bg-surface px-6 py-9 md:px-10 md:py-12"
  >
    <p class="mb-5 text-xs tracking-[0.18em] text-accent uppercase">
      {mode === "login" ? "Welcome back" : "Create account"}
    </p>
    <h1 class="font-heading mb-9 text-4xl leading-[1.1] text-text md:text-5xl">
      {mode === "login" ? "Sign in." : "Register."}
    </h1>

    {#if form && !form.success}
      <p
        class="mb-5 border border-[rgba(255,80,80,0.3)] bg-[rgba(255,80,80,0.1)] px-3 py-2.5 text-sm text-[#ff8080]"
      >
        {form.message}
      </p>
    {/if}

    <form method="POST" action="?/{mode}">
      <div class="mb-5">
        <label
          class="mb-2 block text-xs tracking-[0.14em] text-muted uppercase"
          for="username">Username</label
        >
        <input
          class="w-full appearance-none rounded-none border border-border bg-input-bg px-3.5 py-3 font-mono text-lg text-text transition-[border-color] outline-none placeholder:text-[#333] focus:border-accent"
          id="username"
          name="username"
          type="text"
          value={form?.username ?? ""}
          autocomplete="username"
          placeholder="your_username"
          required
        />
      </div>
      <div class="mb-5">
        <label
          class="mb-2 block text-xs tracking-[0.14em] text-muted uppercase"
          for="password">Password</label
        >
        <input
          class="w-full appearance-none rounded-none border border-border bg-input-bg px-3.5 py-3 font-mono text-lg text-text transition-[border-color] outline-none placeholder:text-[#333] focus:border-accent"
          id="password"
          name="password"
          type="password"
          autocomplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="••••••••"
          required
        />
      </div>
      {#if mode === "register"}
        <div class="mb-5">
          <label
            class="mb-2 block text-xs tracking-[0.14em] text-muted uppercase"
            for="confirmPassword">Confirm password</label
          >
          <input
            class="w-full appearance-none rounded-none border border-border bg-input-bg px-3.5 py-3 font-mono text-lg text-text transition-[border-color] outline-none placeholder:text-[#333] focus:border-accent"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autocomplete="new-password"
            placeholder="••••••••"
            required
          />
        </div>
      {/if}
      <button
        type="submit"
        class="mt-2 w-full cursor-pointer border-none bg-accent py-3.5 font-mono text-sm font-medium tracking-[0.12em] text-bg uppercase transition-[opacity,transform] hover:opacity-[0.88] active:scale-[0.99]"
        >{mode === "login" ? "Log in" : "Create account"}</button
      >
    </form>

    {#if !data.isFirstUser}
      <div class="divider my-7 flex items-center gap-3 text-sm text-border">or</div>
      <p class="text-center text-sm text-muted">
        {#if mode === "login"}
          No account? <button
            type="button"
            class="cursor-pointer border-0 border-b border-border bg-transparent p-0 font-mono text-sm text-text transition-[color,border-color] hover:border-accent hover:text-accent"
            onclick={() => (mode = "register")}>Register</button
          >
        {:else}
          Have an account? <button
            type="button"
            class="cursor-pointer border-0 border-b border-border bg-transparent p-0 font-mono text-sm text-text transition-[color,border-color] hover:border-accent hover:text-accent"
            onclick={() => (mode = "login")}>Sign in</button
          >
        {/if}
      </p>
    {/if}
  </div>
</div>

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

  .divider::before,
  .divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }
</style>
