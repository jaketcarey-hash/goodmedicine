<script lang="ts">
  import { getRecentCheckIns, type CheckInEntry } from '../lib/wellness-store';

  let entries = $state<CheckInEntry[]>([]);

  $effect(() => {
    entries = getRecentCheckIns(7).reverse();
  });

  const feelingLabels = ['', 'Stressed', 'Uneasy', 'Steady', 'Good', 'Strong'];
  const feelingColors = ['', 'bg-berry-400', 'bg-clay-400', 'bg-stone-400', 'bg-water-400', 'bg-sage-400'];

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
  }
</script>

{#if entries.length > 0}
  <div>
    <h3 class="text-xs font-semibold text-stone-400 tracking-widest uppercase mb-3">Recent check-ins</h3>

    <div class="space-y-2">
      {#each entries as entry}
        <div class="flex items-center gap-3 rounded-xl bg-surface-card border border-stone-200 p-3.5">
          <!-- Feeling indicator -->
          <div class="flex flex-col items-center gap-1 w-10 flex-shrink-0">
            <div class="w-3 h-3 rounded-full {feelingColors[entry.feeling]}"></div>
            <span class="text-[10px] text-text-muted">{feelingLabels[entry.feeling]}</span>
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">{formatDate(entry.timestamp)}</p>
            {#if entry.areas.length > 0}
              <p class="text-xs text-text-muted truncate">{entry.areas.join(', ')}</p>
            {/if}
          </div>

          <!-- Feeling bar visualization -->
          <div class="flex gap-0.5 flex-shrink-0">
            {#each [1, 2, 3, 4, 5] as level}
              <div
                class="w-1.5 rounded-full transition-all {level <= entry.feeling ? feelingColors[entry.feeling] : 'bg-stone-100'}"
                style="height: {8 + level * 3}px"
              ></div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
