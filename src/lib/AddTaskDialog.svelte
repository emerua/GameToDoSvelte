
<Dialog
    bind:open
    scrimClickAction=""
    escapeKeyAction=""
    aria-labelledby="large-scroll-title"
    aria-describedby="large-scroll-content"
    surface$style="width: 850px; max-width: calc(100vw - 32px);"
    on:SMUIDialog:opening={init}
    >
    <Title id="large-scroll-title">{dialogTitle}</Title>
    <Content id="large-scroll-content">
        <form use:form name="newTask">
            <LayoutGrid>
                <Cell span={12}>
                    <Textfield name="title" label="タスク名" />
                    <ErrorReporter name="title" />
                </Cell>
                <Cell span={3}>
                    <Textfield name="currentVal" type="number" label="現在値" />
                    <ErrorReporter name="currentVal" />
                    <ErrorReporter name="maxVal" />
                </Cell>
                <Cell span={3}>
                    <Textfield name="maxVal" type="number" label="最大値" />
                </Cell>
                <Cell span={6} />
                <Cell span={3}>
                    <Textfield name="consumeVal" type="number" label="1回当たりの消費量" />
                    <ErrorReporter name="consumeVal" />
                    <ErrorReporter name="recoveryVal" />
                </Cell>
                <Cell span={3}>
                    <Textfield name="recoveryVal" type="number" label="1回当たりの回復量" />
                </Cell>
                <Cell span={6} />
                <Cell span={12}>
                    <Radio name="recoveryCategory" radioOptions={recoveryCategoryOptions} label="回復種別" />
                </Cell>
                <Cell span={12}>
                    <Radio name="timeSetting" radioOptions={timeSettingOptions} label="設定方式" />
                </Cell>
                {#if $data.timeSetting === timeSettingOptions[0]}
                <Cell span={2}>
                    <Textfield name="recoveryInterval" type="number" label="回復間隔" />
                    <ErrorReporter name="recoveryInterval" />
                </Cell>
                <Cell span={12}>
                    <Textfield name="nextRecoveryDateTime" type="datetime-local" step="1" label="次回回復日時" />
                    <ErrorReporter name="nextRecoveryDateTime" />
                </Cell>
                {:else}
                <Cell span={2}>
                    <Textfield name="cronMinute" label="分" />
                    <ErrorReporter name="cronMinute" />
                    <ErrorReporter name="cronHour" />
                    <ErrorReporter name="cronDay" />
                    <ErrorReporter name="cronMonth" />
                    <ErrorReporter name="cronWeek" />
                </Cell>
                <Cell span={2}>
                    <Textfield name="cronHour" label="時" />
                </Cell>
                <Cell span={2}>
                    <Textfield name="cronDay" label="日" />
                </Cell>
                <Cell span={2}>
                    <Textfield name="cronMonth" label="月" />
                </Cell>
                <Cell span={2}>
                    <Textfield name="cronWeek" label="週" />
                </Cell>
                <Cell span={12}>
                    <span class="mdc-typography--caption">今後10回の回復予定時刻</span>
                    <ul style="list-style:none">
                        {#each schedules as schedule}
                            <li>
                                {schedule}
                            </li>
                        {/each}
                    </ul>
                </Cell>
                {/if}
            </LayoutGrid>
        </form>
    </Content>
    <Actions>
        <Button action="" value="submit" on:click={submit} disabled={!$isValid}>
            <Label>{submitText}</Label>
        </Button>
        <Button action="deny" value="cancel" color="secondary">
            <Label>キャンセル</Label>
        </Button>
    </Actions>
</Dialog>

<script lang="ts">
    import { format, parseISO } from 'date-fns';
    import * as parser from 'cron-parser';

    import Dialog, { Title, Content, Actions, InitialFocus } from '@smui/dialog';
    import Button, { Label } from '@smui/button';
    import LayoutGrid, { Cell } from '@smui/layout-grid';
    import Textfield from './Textfield.svelte';
    import Radio from './Radio.svelte';
    import ErrorReporter from './ErrorReporter.svelte';

    import { createEventDispatcher, onMount } from 'svelte';

    import { createForm } from 'felte';
    import reporterDom from '@felte/reporter-dom';
    import { validator } from '@felte/validator-yup';
    import * as yup from 'yup';
    import { suggestive } from 'yup-locale-ja';

    import { type TaskForm, recoveryCategoryOptions, timeSettingOptions } from './Task';

    export let id: number;
    export let task: TaskForm;
    export let open: boolean;

    let schedules:Array<string> = ["-"];

    $: dialogTitle = (id >= 0) ? "タスク編集" : "新規タスク作成";
    $: submitText = (id >= 0) ? "更新" : "作成";

    yup.setLocale(suggestive);
    const schema = yup.object({
        title: yup.string().required(),
        currentVal: yup.number().required().integer().min(0, '現在値には0以上を指定してください'),
        maxVal: yup.number().required().integer().min(0, '最大値には0以上を指定してください'),
        consumeVal: yup.number().required().integer().min(0, '消費量には0以上を指定してください'),
        recoveryVal: yup.number().required().integer().min(0, '回復量には0以上を指定してください'),
        recoveryCategory: yup.string().required(),
        timeSetting: yup.string().required(),
        recoveryInterval: yup.number().when('timeSetting', {
            is: timeSettingOptions[0],
            then: (schema) => schema.required().integer().min(1, '回復間隔には1以上を指定してください')
        }),
        nextRecoveryDateTime: yup.string().when('timeSetting', {
            is: timeSettingOptions[0],
            then: (schema) => schema.required()
        }),
        cronMinute: yup.string().when('timeSetting', {
            is: timeSettingOptions[1],
            then: (schema) => schema.required()
        }),
        cronHour: yup.string().when('timeSetting', {
            is: timeSettingOptions[1],
            then: (schema) => schema.required()
        }),
        cronDay: yup.string().when('timeSetting', {
            is: timeSettingOptions[1],
            then: (schema) => schema.required()
        }),
        cronMonth: yup.string().when('timeSetting', {
            is: timeSettingOptions[1],
            then: (schema) => schema.required()
        }),
        cronWeek: yup.string().when('timeSetting', {
            is: timeSettingOptions[1],
            then: (schema) => schema.required()
        }),
    }).test('cron', (value) => {
        if (value.timeSetting === timeSettingOptions[0]) {
            return true;
        }

        schedules = [];
        let cronExpr = `${value.cronMinute} ${value.cronHour} ${value.cronDay} ${value.cronMonth} ${value.cronWeek}`;
        try {
            const interval = parser.parseExpression(cronExpr);
            for(let i = 0; i < 5; i++) {
                schedules.push(format(interval.next().toDate(), 'yyyy-MM-dd HH:mm:ss'));
            }
        }
        catch {
            schedules.push("有効なcron式が指定されていません。");
            throw new yup.ValidationError("有効なcron式を指定してください");
        }

        return true;
    });

    const dispatch = createEventDispatcher();
    const { form, createSubmitHandler, setInitialValues, isValid, data, reset } = createForm<yup.InferType<typeof schema>>({
        onSubmit: (values) => {
            task = {
                ...values,
                recoveryInterval:     values.recoveryInterval     || 0,
                nextRecoveryDateTime: values.nextRecoveryDateTime || "",
                cronMinute:           values.cronMinute           || "",
                cronHour:             values.cronHour             || "",
                cronDay:              values.cronDay              || "",
                cronMonth:            values.cronMonth            || "",
                cronWeek:             values.cronWeek             || ""
            };

            dispatch('put');

            open = false;
        },
        extend: [
            reporterDom(),
            validator({ schema })
        ]
    });

    const submit = createSubmitHandler();

    async function init() {
        setInitialValues({ ...task });
        reset();
        schedules = ["-"];
    }
</script>