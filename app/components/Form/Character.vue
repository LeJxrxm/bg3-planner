<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'
import type { Character } from '~~/generated/prisma/client'

const props = defineProps<{
    initialData?: {
        name: string
        classe?: string | null
        subclass?: string | null
        image?: string | null
    }
    characterId?: number
}>()

const toast = useToast()

const { data: runsData } = await useFetch('/api/runs')
const runs = computed(() => runsData.value?.map(r => ({ label: r.name, value: r.id })) || [])

const classes = [
    'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
    'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
]

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

const schema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    classe: z.string().optional().nullable(),
    subclass: z.string().optional().nullable(),
    image: z.union([
        z.string(),
        z.instanceof(File).refine((file) => file.size <= MAX_FILE_SIZE, {
            message: 'Image trop volumineuse (max 2MB)'
        }).refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
            message: 'Format invalide (JPG, PNG, WebP, GIF)'
        })
    ]).optional().nullable(),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
    name: props.initialData?.name || '',
    classe: (props.initialData?.classe || undefined) as string | undefined,
    subclass: props.initialData?.subclass || undefined,
    image: props.initialData?.image || undefined,
})

const fileState = ref<File | null>(null)

watch(fileState, (newFile) => {
    if (newFile) {
        state.image = newFile as any
    }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    try {
        let imageUrl = typeof state.image === 'string' ? state.image : null

        // Upload image if needed
        if (fileState.value) {
            const formData = new FormData()
            formData.append('file', fileState.value)

            const uploadResult = await $fetch<{ url: string }>('/api/upload', {
                method: 'POST',
                body: formData
            })
            imageUrl = uploadResult.url
        }

        const payload = {
            name: event.data.name,
            classe: event.data.classe,
            subclass: event.data.subclass,
            image: imageUrl,
        }

        if (props.characterId) {
            await $fetch<Character>(`/api/characters/${props.characterId}`, {
                method: 'PUT',
                body: payload
            })

            toast.add({
                title: 'Personnage modifié',
                color: 'success'
            })
        } else {
            await $fetch<Character>('/api/characters', {
                method: 'POST',
                body: payload
            })

            toast.add({
                title: 'Personnage créé',
                color: 'success'
            })
        }

        await navigateTo('/characters')
    } catch (e: any) {
        toast.add({
            title: 'Erreur',
            description: e.data?.message || 'Une erreur est survenue',
            color: 'error'
        })
    }
}
</script>

<template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nom du personnage" name="name" required>
            <UInput class="w-full" v-model="state.name" placeholder="Ex: Tav, Karlach, Shadowheart..." />
        </UFormField>

        <UFormField label="Classe" name="classe">
            <USelect class="w-full" v-model="state.classe" :items="classes.map(c => ({ label: c, value: c }))"
                placeholder="Sélectionner une classe" clearable>
            </USelect>
        </UFormField>

        <UFormField label="Sous-classe" name="subclass">
            <UInput class="w-full" v-model="state.subclass" placeholder="Ex: Berserker, Oath of Devotion..." />
        </UFormField>

        <UFormField label="Image" name="image" description="JPG, PNG, WebP ou GIF. 2MB Max.">
            <UFileUpload v-model="fileState" accept="image/*" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-3">
            <UButton type="button" variant="outline" @click="navigateTo('/characters')">
                Annuler
            </UButton>
            <UButton type="submit" trailing-icon="lucide-save">
                {{ characterId ? 'Modifier' : 'Créer' }}
            </UButton>
        </div>
    </UForm>
</template>
