<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import TaskList from '$lib/TaskList.svelte';

  import Button, { Label } from '@smui/button';
  import IconButton, { Icon } from '@smui/icon-button';

  import { liveQuery } from "dexie";

  import { db } from "$lib/db";
  import type { TaskGroup } from '$lib/Task';

  let width: number;
  let currentDatetime: Date = new Date();

  let taskGroups = liveQuery(
    () => db.taskGroups.toCollection().sortBy('sortOrder')
  );

  async function addGroup() {
    let group: TaskGroup = {
      title: "新規グループ",
      sortOrder: Number.MAX_SAFE_INTEGER
    };
    await db.taskGroups.put(group);
  };

  async function delGroup(event: CustomEvent) {
    let id = event.detail.id;
    await db.taskGroups.delete(id);
  };

  function getId(group: TaskGroup) {
    return group.id!;
  }

  onMount(() => {
    async function getCurrentDatetime() {
        currentDatetime = new Date();
    }

    const interval = setInterval(getCurrentDatetime, 100);
    getCurrentDatetime();

    return () => clearInterval(interval);
  });
</script>

<main bind:clientWidth={width} class="rect">
  {#if $taskGroups}
    {#each $taskGroups as group}
      <div class="tasks">
        <TaskList {currentDatetime} {group} on:delete={delGroup} />
      </div>
    {/each}
  {/if}
  <div class="tasks newGroup">
    <Button variant="raised" color="secondary" on:click={addGroup}>
      <Label><Icon class="material-icons">add</Icon>新しいグループ</Label>
    </Button>
  </div>
</main>

<style>
  main {
    display: flex;
  }

  .tasks {
    flex-grow: 1;
    flex-shrink: 0;
    min-width: 400px;
    max-width: 25vw;
    width: 25vw;
  }

  .newGroup {
    display: grid;
    padding: 50px;
    box-sizing: border-box;
    height: 100%;
    border: 5px gray dashed;
    border-radius: 30px;
    align-items: center;
    text-align: center;
  }
</style>