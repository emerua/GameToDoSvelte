<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';

  import TopAppBar, { Row, Section, Title } from '@smui/top-app-bar';
  import Button, { Label } from '@smui/button';
  import IconButton, { Icon } from '@smui/icon-button';
  import TaskCard from './TaskCard.svelte';
  import AddTaskDialog from './AddTaskDialog.svelte';
  import EditTaskGroupDialog from './EditTaskGroupDialog.svelte';

  import Dexie, { liveQuery } from "dexie";

  import { proxied, getRemainAllTime, applyTask, applyTaskForm, newTask, newTaskForm, type Task, type TaskForm, type TaskGroup } from './Task';
  import { db } from "./db";

  export let currentDatetime: Date;
  export let group: TaskGroup;
  
  let width = 0;
  let openEditTaskGroupDialog:boolean = false;

  async function showEditTaskGroupDialog() {
    openEditTaskGroupDialog = true;
  };
  
  async function putGroup(event: CustomEvent) {
    const title = event.detail.title;
    group.title = title;
    let g = await db.taskGroups.put(group);
  };

  /************************************************/

  let openAddTaskDialog:boolean = false;
  let taskId = -1;
  let taskForm: TaskForm = newTaskForm();

  let tasks = liveQuery(
    () => db.tasks.where("groupId").equals(group.id!).sortBy('sortOrder')
  );

  async function showAddTaskDialog() {
    taskId = -1;
    taskForm = newTaskForm();
    openAddTaskDialog = true;
  };
  
  async function showEditTaskDialog(event: CustomEvent) {
    taskId = event.detail.task.id;
    taskForm = applyTask(newTaskForm(), event.detail.task);
    openAddTaskDialog = true;
  };
  
  async function sortTasks(event: CustomEvent) {
    await setSortOrders();
  };

  async function putTask(event: CustomEvent) {
    let task: Task = applyTaskForm(newTask(group.id!), taskForm, currentDatetime);
    if (taskId >= 0) {
      task.id = taskId;
    }
    let t = await db.tasks.put(task);
    await setSortOrders();
  };

  async function delTask(event: CustomEvent) {
    await db.tasks.delete(event.detail.id);
  };

  async function setSortOrders() {
    let sortOrders = [];
    const sorted = Array.from($tasks).sort((a, b) => {return getRemainAllTime(a, currentDatetime) - getRemainAllTime(b, currentDatetime)})
    for(let i = 0; i < sorted.length; i++) {
      sortOrders.push({
        key: sorted[i].id!,
        changes: {
          "sortOrder": i
        }
      });
    }

    await db.tasks.bulkUpdate(sortOrders);
  }

  const dispatch = createEventDispatcher();
  async function delGroup() {
    dispatch('delete', {
			id: group.id!
		});
  }

  function dragover_handler(ev: DragEvent) {
    ev.preventDefault();
    if(ev.dataTransfer != undefined){
      ev.dataTransfer.dropEffect = "move";
    }
  }

  async function drop_handler(ev: DragEvent) {
    ev.preventDefault();
    const taskId = ev.dataTransfer?.getData("text");

    if(!taskId) {
      return;
    }
    
    await db.tasks.where("id").equals(Number(taskId)).modify({groupId: group.id!});
    await setSortOrders();
  }

  onMount(async() => {
    async function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    let res = await new Promise(async(resolve) => {
      while (!$tasks) { await sleep(100) }
      resolve(null);
    });

    setSortOrders();
  });
</script>

<EditTaskGroupDialog bind:open={openEditTaskGroupDialog} title={group.title} on:put={putGroup} />
<AddTaskDialog bind:open={openAddTaskDialog} bind:task={taskForm} id={taskId} on:put={putTask} />

<div class="flexy">
  <div class="top-app-bar-container flexor" bind:clientWidth={width}>
    <TopAppBar variant="static" color="secondary" dense>
      <Row>
        <Section>
          <Title>{group.title}</Title>
          <IconButton class="material-icons" title="Edit" on:click={showEditTaskGroupDialog}>edit</IconButton>
        </Section>
      </Row>
      <Row>
         <Section align="end">
          {#if width > 360}
            <Button variant="outlined" on:click={showAddTaskDialog}>
              <Label><Icon class="material-icons">add_task</Icon>新規</Label>
            </Button>
            <Button variant="outlined"  on:click={sortTasks}>
              <Label><Icon class="material-icons">sort</Icon>並び替え</Label>
            </Button>
            <Button variant="outlined" on:click={delGroup}>
              <Label><Icon class="material-icons">delete</Icon>削除</Label>
            </Button>
          {:else}
            <IconButton class="material-icons" title="新規" on:click={showAddTaskDialog}>add_task</IconButton>
            <IconButton class="material-icons" title="並び替え">sort</IconButton>
            <IconButton class="material-icons" title="削除">delete</IconButton>
          {/if}
        </Section>
      </Row>
    </TopAppBar>
    <div class="flexor-content" on:drop={drop_handler} on:dragover={dragover_handler}>
      {#if $tasks}
        {#each $tasks.map(t => proxied(t)) as task}
          <TaskCard {task} {currentDatetime} on:edit={showEditTaskDialog} on:delete={delTask} />
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .top-app-bar-container {
    width: 100%;
    border: 1px solid
      var(--mdc-theme-text-hint-on-background, rgba(0, 0, 0, 0.1));
    margin: 0;
    background-color: var(--mdc-theme-background, #fff);
 
    overflow: auto;
    display: inline-block;
  }
 
  @media (max-width: 480px) {
    .top-app-bar-container {
      margin-right: 0;
    }
  }
 
  .flexy {
    height: 100%;
    display: flex;
    flex-wrap: wrap;
  }
 
  .flexor {
    height: 100%;
    display: inline-flex;
    flex-direction: column;
  }
 
  .flexor-content {
    flex-basis: auto;
    flex-grow: 1;
    overflow-y: scroll;
  }
</style>