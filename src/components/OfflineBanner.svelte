<script lang="ts">
  let isOnline = $state(true);

  $effect(() => {
    isOnline = navigator.onLine;

    const goOnline = () => isOnline = true;
    const goOffline = () => isOnline = false;

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  });
</script>

{#if !isOnline}
  <div
    class="fixed top-0 left-0 right-0 z-50 bg-sage-600 text-white text-center text-sm py-2 px-4"
    style="padding-top: calc(var(--safe-top, 0px) + 0.5rem);"
    role="status"
    aria-live="polite"
  >
    You're offline — all content is available.
  </div>
{/if}
