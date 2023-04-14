
<Dialog
    bind:open
    scrimClickAction=""
    escapeKeyAction=""
    aria-labelledby="large-scroll-title"
    aria-describedby="large-scroll-content"
    surface$style="width: 850px; max-width: calc(100vw - 32px);"
    on:SMUIDialog:opening={init}
    >
    <Title id="large-scroll-title">グループ名編集</Title>
    <Content id="large-scroll-content">
        <form use:form name="editGroup">
            <LayoutGrid>
                <Cell span={12}>
                    <Textfield name="title" label="グループ名" />
                    <ErrorReporter name="title" />
                </Cell>
            </LayoutGrid>
        </form>
    </Content>
    <Actions>
        <Button action="" value="submit" on:click={submit} disabled={!$isValid}>
            <Label>更新</Label>
        </Button>
        <Button action="deny" value="cancel" color="secondary">
            <Label>キャンセル</Label>
        </Button>
    </Actions>
</Dialog>

<script lang="ts">
    import Dialog, { Title, Content, Actions, InitialFocus } from '@smui/dialog';
    import Button, { Label } from '@smui/button';
    import LayoutGrid, { Cell } from '@smui/layout-grid';
    import Textfield from './Textfield.svelte';
    import ErrorReporter from './ErrorReporter.svelte';

    import { createEventDispatcher, onMount } from 'svelte';

    import { createForm } from 'felte';
    import reporterDom from '@felte/reporter-dom';
    import { validator } from '@felte/validator-yup';
    import * as yup from 'yup';
    import { suggestive } from 'yup-locale-ja';

    export let title: string;
    export let open: boolean;

    yup.setLocale(suggestive);
    const schema = yup.object({
        title: yup.string().required()
    });

    const dispatch = createEventDispatcher();
    const { form, createSubmitHandler, setInitialValues, isValid, reset } = createForm<yup.InferType<typeof schema>>({
        onSubmit: (values) => {
            dispatch('put', { title: values.title });
            open = false;
        },
        extend: [
            reporterDom(),
            validator({ schema })
        ]
    });

    const submit = createSubmitHandler();

    async function init() {
        setInitialValues({ title });
        reset();
    }
</script>