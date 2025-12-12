<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import type { Run } from '~~/generated/prisma/client'

const props = defineProps<{
    initialData?: {
        name: string
        description?: string | null
    }
    runId?: number
}>()

const toast = useToast()

const schema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    description: z.string().optional().nullable(),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
    name: props.initialData?.name || '',
    description: props.initialData?.description || null,
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    try {
        if (props.runId) {
            // Mode édition
            await $fetch<Run>(`/api/runs/${props.runId}`, {
                method: 'PUT',
                body: event.data,
            })

            toast.add({
                title: 'Run modifiée',
                description: `La run "${event.data.name}" a été modifiée avec succès.`,
                color: 'success',
            })
        } else {
            // Mode création
            await $fetch<Run>('/api/runs', {
                method: 'POST',
                body: event.data,
            })

            toast.add({
                title: 'Run créée',
                description: `La run "${event.data.name}" a été créée avec succès.`,
                color: 'success',
            })
        }

        await navigateTo('/runs')
    } catch (e: any) {
        toast.add({
            title: 'Erreur',
            description: e.data?.message || 'Une erreur est survenue.',
            color: 'error',
        })
    }
}
</script>

<template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nom de la run" name="name" required>
            <UInput class="w-full" v-model="state.name" placeholder="Ex: Honour mode Karlach Oathbreaker" />
        </UFormField>

        <UFormField label="Description" name="description">
            <UTextarea class="w-full" v-model="state.description" :rows="3"
                placeholder="Notes optionnelles sur la run" />
        </UFormField>

        <div class="flex justify-end gap-3">
            <UButton type="submit" trailing-icon="lucide-arrow-right">
                {{ initialData ? 'Modifier' : 'Créer' }}
            </UButton>
        </div>
    </UForm>
</template>
