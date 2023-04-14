<div draggable="true" on:dragstart={dragstart_handler} data-task-id={task.id}>
  <Card style="margin: 10px" class="draggable">
    <Content class="taskContent" --color="{contentColor}">
      <div class="mdc-typography--headline5 flex-left">{task.title}</div>
      <div class="mdc-typography--subtitle2 flex-right"><Icon class="material-icons">favorite</Icon>&nbsp;{`${task.currentVal} (+${task.recoveryVal}) / ${task.maxVal}`}</div>
      <div class="mdc-typography--subtitle2 flex-right"><Icon class="material-icons">calendar_month</Icon>&nbsp;{remainTime} / {remainAllTime}</div>
    </Content>
    <Actions>
      <ActionButtons>
        <Button variant="raised" on:click={consume}>
          <Label><Icon class="material-icons">task_alt</Icon>完了(-{task.consumeVal})</Label>
        </Button>
        <Button color="secondary" variant="outlined" on:click={undo}>
          <Label><Icon class="material-icons">undo</Icon>取消(+{task.consumeVal})</Label>
        </Button>
      </ActionButtons>
      <ActionIcons>
        <IconButton
          class="material-icons"
          title="Edit" on:click={editTask}>edit</IconButton
        >
        <IconButton
          class="material-icons"
          title="Delete" on:click={delTask}>delete</IconButton
        >
      </ActionIcons>
    </Actions>
  </Card>
</div>

<script lang="ts">
  import { addMinutes } from 'date-fns';
  
  import { createEventDispatcher } from 'svelte';
  import Card, { Content, Actions, ActionButtons, ActionIcons } from '@smui/card';
  import Button, { Label } from '@smui/button';
  import IconButton, { Icon } from '@smui/icon-button';

  import { getRemainTime, getRemainAllTime, formatRemainTime, setNextScheduleTime, type Task, recoveryCategoryOptions } from './Task';

  export let task: Task;
  export let currentDatetime: Date;

  let duration = 0;
  let remainTime = "";
  let remainAllTime = "";

  let contentColor: string = "#e0e0e0";

  $: {
    duration = getRemainTime(task, currentDatetime);
    while (duration < 0) {
      // 現在値の処理
      task.currentVal = Math.min(task.currentVal + task.recoveryVal, task.maxVal);

      // 次の回復予定時刻の計算
      setNextScheduleTime(task, task.nextRecoveryDateTime);
      duration = getRemainTime(task, currentDatetime);
    }

    // 次の回復予定時刻の表示
    remainTime = formatRemainTime(duration);

    // 最終回復予定時刻の計算
    duration = getRemainAllTime(task, currentDatetime);

    // 最終回復予定時刻の表示
    remainAllTime = formatRemainTime(duration);

    if (duration < 24 * 60 * 60 * 1000) {
      contentColor = "#ffcccc";
    } else {
      contentColor = "#e0e0e0";
    }
  }

  async function consume() {
    // 回復時にタイマーを停止する場合
    if(task.recoveryCategory === recoveryCategoryOptions[1] && task.currentVal === task.maxVal) {
      setNextScheduleTime(task, currentDatetime);
    }
    task.currentVal = Math.max(task.currentVal - task.consumeVal, 0);
  }
  
  async function undo() {
    task.currentVal = Math.min(task.currentVal + task.consumeVal, task.maxVal);
  }
  
  const dispatch = createEventDispatcher();
  async function editTask() {
    dispatch('edit', {
			task: task
		});
  }
  async function delTask() {
    dispatch('delete', {
			id: task.id
		});
  }

  function dragstart_handler(ev: DragEvent) {
    if(ev.dataTransfer != undefined){
      const target = ev.target as HTMLElement;
      ev.dataTransfer.setData("text", target.dataset.taskId!);
      ev.dataTransfer.effectAllowed = "move";
    }
  }
</script>

<style>
  :global(.taskContent) {
    background-color: var(--color, #e0e0e0)
  }

  .flex-left {
    align-items: center;
    display: flex;
    justify-content: left;
  }

  .flex-right {
    align-items: center;
    display: flex;
    justify-content: right;
  }
</style>