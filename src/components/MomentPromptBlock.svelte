<script lang="ts">
  import { untrack } from 'svelte';
  import { markPromptCopied } from '../lib/moments-store';

  interface Props {
    momentSlug: string;
    promptId: string;
    title: string;
    body: string;
    why: string;
  }

  let { momentSlug, promptId, title, body, why }: Props = $props();

  let text = $state(untrack(() => body));
  let copied = $state(false);

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      markPromptCopied(momentSlug, promptId);
      setTimeout(() => { copied = false; }, 2500);
    } catch {
      // Fallback: focus the textarea so the user can copy manually
      const el = document.getElementById(`prompt-${promptId}`) as HTMLTextAreaElement | null;
      el?.focus();
      el?.select();
    }
  }

  function openClaude() {
    markPromptCopied(momentSlug, promptId);
    window.open('https://claude.ai/new', '_blank', 'noopener');
  }
</script>

<div class="rounded-xl border border-stone-200 bg-surface-card p-5 space-y-4">
  <div>
    <p class="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-1">
      A question you could ask
    </p>
    <h4 class="text-base font-semibold leading-snug">{title}</h4>
  </div>

  <textarea
    id={`prompt-${promptId}`}
    bind:value={text}
    rows="7"
    class="w-full rounded-lg border border-stone-200 bg-surface-warm p-4 text-sm font-mono leading-relaxed
      resize-y focus:border-clay-300 focus:ring-1 focus:ring-clay-200 focus:outline-none transition-colors"
  ></textarea>

  <p class="text-[13px] text-text-muted italic leading-relaxed">
    {why}
  </p>

  <div class="flex gap-2">
    <button
      onclick={copyPrompt}
      class="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
        {copied
          ? 'bg-sage-500 text-white'
          : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98]'}"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
    <button
      onclick={openClaude}
      class="flex-1 py-3 rounded-xl text-sm font-semibold border border-stone-300 bg-surface-card
        text-text-primary hover:border-stone-400 hover:shadow-sm active:scale-[0.98]
        transition-all duration-200 cursor-pointer"
    >
      Open in Claude
    </button>
  </div>

  <p class="text-[11px] text-text-muted text-center leading-relaxed">
    Edit it to fit your situation before you send — the more specific, the better.
  </p>
</div>
