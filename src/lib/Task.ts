import { parseISO, format, differenceInMilliseconds, addMinutes } from 'date-fns';
import { db } from "./db";
import * as parser from 'cron-parser';

export type TaskGroup = {
    id?: number;
    title: string;
    sortOrder: number;
}

export type Task = {
    id?: number;
    title: string;
    currentVal: number;
    maxVal: number;
    consumeVal: number;
    recoveryVal: number;
    recoveryCategory: string;
    timeSetting: string;
    recoveryInterval?: number;
    nextRecoveryDateTime: Date;
    cronSchedule?: string;
    sortOrder: number;
    groupId: number;
}

export type TaskForm = {
    title: string;
    currentVal: number;
    maxVal: number;
    consumeVal: number;
    recoveryVal: number;
    recoveryCategory: string;
    timeSetting: string;
    recoveryInterval: number;
    nextRecoveryDateTime: string;
    cronMinute: string; 
    cronHour: string; 
    cronDay: string; 
    cronMonth: string; 
    cronWeek: string; 
}

export const recoveryCategoryOptions = ["最大値時にタイマーを継続する", "最大値時にタイマーを停止する"];
export const timeSettingOptions = ['回復間隔', 'Cron式'];

export function newTask(groupId: number) {
    let task: Task = {
        title: "",
        currentVal: 0,
        maxVal: 0,
        consumeVal: 0,
        recoveryVal: 0,
        recoveryCategory: "",
        timeSetting: "",
        nextRecoveryDateTime: new Date(),
        sortOrder: Number.MAX_SAFE_INTEGER,
        groupId: groupId
    };

    return task;
}

export function newTaskForm() {
    let task: TaskForm = {
        title: "新規タスク",
        currentVal: 0,
        maxVal: 0,
        consumeVal: 0,
        recoveryVal: 0,
        recoveryCategory: recoveryCategoryOptions[0],
        timeSetting: timeSettingOptions[0],
        recoveryInterval: 1,
        nextRecoveryDateTime: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        cronMinute: "*",
        cronHour: "*",
        cronDay: "*",
        cronMonth: "*",
        cronWeek: "*",
    };

    return task;
}


export function applyTaskForm(task: Task, taskForm: TaskForm) {
    task.title = taskForm.title;
    task.currentVal = taskForm.currentVal;
    task.maxVal = taskForm.maxVal;
    task.consumeVal = taskForm.consumeVal;
    task.recoveryVal = taskForm.recoveryVal;

    task.recoveryCategory = taskForm.recoveryCategory;
    task.timeSetting = taskForm.timeSetting;
    
    if (taskForm.timeSetting === timeSettingOptions[0]) {
        task.recoveryInterval = taskForm.recoveryInterval;
        task.nextRecoveryDateTime = parseISO(taskForm.nextRecoveryDateTime);
    }
    else {
        task.cronSchedule = `${taskForm.cronMinute} ${taskForm.cronHour} ${taskForm.cronDay} ${taskForm.cronMonth} ${taskForm.cronWeek}`;
        task.nextRecoveryDateTime = new Date();
        setNextScheduleTime(task);
    }

    return task;
}

export function applyTask(taskForm: TaskForm, task: Task) {
    taskForm.title = task.title;
    taskForm.currentVal = task.currentVal;
    taskForm.maxVal = task.maxVal;
    taskForm.consumeVal = task.consumeVal;
    taskForm.recoveryVal = task.recoveryVal;

    taskForm.recoveryCategory = task.recoveryCategory;
    taskForm.timeSetting = task.timeSetting;
    
    if (task.timeSetting === timeSettingOptions[0]) {
        taskForm.recoveryInterval = task.recoveryInterval!;
        taskForm.nextRecoveryDateTime = format(task.nextRecoveryDateTime, 'yyyy-MM-dd HH:mm:ss');
    }
    else {
        [taskForm.cronMinute, taskForm.cronHour, taskForm.cronDay, taskForm.cronMonth, taskForm.cronWeek] = task.cronSchedule!.split(" ");
    }

    return taskForm;
}

async function updateTask(task: Task) {
    return await db.tasks.update(task.id, task);
}

export function proxied(task: Task) {
    return new Proxy(task, {
        set(task, name, value, receiver) {
            if (task.id) {
                updateTask(task);
            }
            return Reflect.set(task, name, value, receiver);
        }
    });
}

export function getRemainTime(task: Task, currentDatetime: Date) {
    if(task.recoveryCategory === recoveryCategoryOptions[1] && task.currentVal === task.maxVal) {
        return 0;
    }

    return differenceInMilliseconds(task.nextRecoveryDateTime, currentDatetime);
}

export function getRemainAllTime(task: Task, currentDatetime: Date) {
    if(task.recoveryCategory === recoveryCategoryOptions[1] && task.currentVal === task.maxVal) {
        return 0;
    }

    const nextVal = Math.min(task.currentVal + task.recoveryVal, task.maxVal);
    const recoveryTimes = Math.ceil((task.maxVal - nextVal) / task.recoveryVal | 0);

    if(task.timeSetting === timeSettingOptions[1]) {
        try {
            const cronExpr = parser.parseExpression(task.cronSchedule!);
            cronExpr.reset(task.nextRecoveryDateTime);

            let nextDate = cronExpr.iterate(recoveryTimes).pop()?.toDate();
            if(typeof nextDate === "undefined") {
                nextDate = task.nextRecoveryDateTime;
            }
            
            return differenceInMilliseconds(nextDate, currentDatetime);
        }
        catch {
            throw new Error("cronShedule was broken");
        }
    } else {
        let duration = getRemainTime(task, currentDatetime);

        const offsetTime = recoveryTimes * task.recoveryInterval!;
        duration += (offsetTime * 60000);
        return duration;
    }
}

export function formatRemainTime(duration: number) {
    duration = Math.floor(duration / 1000);
    const hour = Math.floor(duration / 3600);
    const minute = Math.floor((duration - 3600 * hour) / 60);
    const second = duration % 60;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`;
}

export function setNextScheduleTime(task: Task) {
    if(task.timeSetting === timeSettingOptions[1]) {
        try {
            const cronExpr = parser.parseExpression(task.cronSchedule!);
            cronExpr.reset(task.nextRecoveryDateTime);
            task.nextRecoveryDateTime = cronExpr.next().toDate();
        }
        catch {
            throw new Error("cronShedule was broken");
        }
    } else {
        task.nextRecoveryDateTime = addMinutes(task.nextRecoveryDateTime, task.recoveryInterval!);
    }


}

