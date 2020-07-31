<script lang="ts">
  import { unbakeBadge } from "./unbake";
  import { onMount } from "svelte";

  export let src: string;
  let badge = {} // TODO: type for badge

  async function customOnLoad() {
    try {
      badge = await unbakeBadge(src);
      console.log(badge)
    } catch (error) {
      console.error(error);
    }
  }
</script>

<svelte:options tag="badge-displayer" />
<svelte:window on:load={customOnLoad} />
<div>
  <img {src} />
  {#if Object.values(badge).length > 0}
  {JSON.stringify(badge)}
  {/if}
</div>
