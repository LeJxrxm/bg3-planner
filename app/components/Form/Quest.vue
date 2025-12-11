<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const props = defineProps<{
    initialData?: {
        name: string
        act: number
        npcId?: number | null
        phase?: string | null
        wikiLink?: string | null
        image?: string | null
    }
}>()

const emit = defineEmits(['submit'])

const { data: npcs } = await useFetch('/api/npcs')

const acts = [
    { label: 'Act 1', value: 1 },
    { label: 'Act 2', value: 2 },
    { label: 'Act 3', value: 3 }
]

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const MIN_DIMENSIONS = { width: 200, height: 200 }
const MAX_DIMENSIONS = { width: 4096, height: 4096 }
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const schema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    act: z.number().int().min(1).max(3),
    npcId: z.number().int().optional().nullable(),
    phase: z.string().optional().nullable(),
    wikiLink: z.string().optional().nullable(),
    image: z.union([
        z.string(),
        z.instanceof(File, { message: 'Please select an image file.' })
            .refine((file) => file.size <= MAX_FILE_SIZE, {
                message: `The image is too large. Please choose an image smaller than ${formatBytes(MAX_FILE_SIZE)}.`
            })
            .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
                message: 'Please upload a valid image file (JPEG, PNG, or WebP).'
            })
            .refine(
                (file) =>
                    new Promise((resolve) => {
                        const reader = new FileReader()
                        reader.onload = (e) => {
                            const img = new Image()
                            img.onload = () => {
                                const meetsDimensions =
                                    img.width >= MIN_DIMENSIONS.width &&
                                    img.height >= MIN_DIMENSIONS.height &&
                                    img.width <= MAX_DIMENSIONS.width &&
                                    img.height <= MAX_DIMENSIONS.height
                                resolve(meetsDimensions)
                            }
                            img.src = e.target?.result as string
                        }
                        reader.readAsDataURL(file)
                    }),
                {
                    message: `The image dimensions are invalid. Please upload an image between ${MIN_DIMENSIONS.width}x${MIN_DIMENSIONS.height} and ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height} pixels.`
                }
            )
    ]).optional().nullable()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    name: props.initialData?.name || '',
    act: props.initialData?.act || 1,
    npcId: props.initialData?.npcId || undefined,
    phase: props.initialData?.phase || undefined,
    wikiLink: props.initialData?.wikiLink || undefined,
    image: undefined
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const data = { ...event.data }

    if (state.image instanceof File) {
        const formData = new FormData()
        formData.append('file', state.image)

        try {
            const uploadResponse = await $fetch<{ url: string }>('/api/upload', {
                method: 'POST',
                body: formData
            })
            data.image = uploadResponse.url
        } catch (e: any) {
            useToast().add({
                title: 'Oops',
                description: e.data.message || 'Une erreur est survenue lors du téléchargement de l\'image',
                color: 'error'
            })
            return
        }
    }

    emit('submit', data)
}
</script>

<template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nom" name="name" required>
            <UInput class="w-full" v-model="state.name" placeholder="Nom de la quête" />
        </UFormField>

        <UFormField label="Acte" name="act" required>
            <USelect class="w-full" v-model="state.act" :items="acts" option-attribute="label"
                value-attribute="value" />
        </UFormField>

        <UFormField label="NPC lié" name="npcId">
            <USelect class="w-full" v-model="state.npcId" :items="npcs || []" option-attribute="name"
                value-attribute="id" placeholder="Sélectionner un NPC" />
        </UFormField>

        <UFormField label="Phase / Étape" name="phase">
            <UInput class="w-full" v-model="state.phase" placeholder="Ex: Acte 1 - Sous-sol" />
        </UFormField>

        <UFormField label="Lien Wiki" name="wikiLink">
            <UInput class="w-full" v-model="state.wikiLink" placeholder="https://bg3.wiki/..." />
        </UFormField>

        <UFormField label="Image" name="image" description="JPG, GIF or PNG. 2MB Max.">
            <UFileUpload v-model="state.image" accept="image/*" class="w-full" />
        </UFormField>

        <div class="flex justify-end">
            <UButton type="submit" color="primary">
                {{ initialData ? 'Modifier' : 'Ajouter' }}
            </UButton>
        </div>
    </UForm>
</template>
