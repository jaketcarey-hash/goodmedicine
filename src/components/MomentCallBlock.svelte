<script lang="ts">
  import { markCallTapped } from '../lib/moments-store';

  interface Props {
    momentSlug: string;
    callId: string;
    label: string;
    number?: string;
    numberHref?: string;
    script: string;
  }

  let { momentSlug, callId, label, number, numberHref, script }: Props = $props();

  function onTap() {
    markCallTapped(momentSlug, callId);
  }
</script>

<div class="rounded-xl border border-stone-200 bg-surface-card p-4">
  <div class="flex items-baseline justify-between gap-3 mb-2">
    <p class="font-semibold text-sm">{label}</p>
    {#if number && numberHref}
      <a
        href={numberHref}
        onclick={onTap}
        class="text-sm font-mono text-water-600 hover:text-water-700 hover:underline transition-colors"
      >
        {number}
      </a>
    {:else if number}
      <span class="text-sm font-mono text-text-muted">{number}</span>
    {/if}
  </div>
  <p class="text-sm text-text-secondary leading-relaxed italic">
    “{script}”
  </p>
</div>
