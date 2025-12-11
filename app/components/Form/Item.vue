<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const props = defineProps<{
    initialData?: {
        name: string
        type: string
        act: number
        sourceType: 'MERCHANT' | 'QUEST' | 'POI'
        image?: string | null
        description?: string | null
        rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'VERY_RARE' | 'LEGENDARY' | 'STORY' | null
    }
}>()

const emit = defineEmits(['submit'])

const rarities = [
    { label: 'Common', value: 'COMMON' },
    { label: 'Uncommon', value: 'UNCOMMON' },
    { label: 'Rare', value: 'RARE' },
    { label: 'Very Rare', value: 'VERY_RARE' },
    { label: 'Legendary', value: 'LEGENDARY' },
    { label: 'Story', value: 'STORY' }
]

const sourceTypes = [
    { label: 'Merchant', value: 'MERCHANT' },
    { label: 'Quest', value: 'QUEST' },
    { label: 'POI', value: 'POI' }
]

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
    type: z.string().min(1, 'Le type est requis'),
    act: z.number().int().min(1).max(3),
    sourceType: z.enum(['MERCHANT', 'QUEST', 'POI']),
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
    ]).optional().nullable(),
    description: z.string().optional(),
    rarity: z.enum(['COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE', 'LEGENDARY', 'STORY']).optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    name: props.initialData?.name || '',
    type: props.initialData?.type || '',
    act: props.initialData?.act || 1,
    sourceType: props.initialData?.sourceType || 'MERCHANT',
    image: undefined,
    description: props.initialData?.description || undefined,
    rarity: props.initialData?.rarity || undefined
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

function onFileChange(files: FileList | null) {
    if (files && files.length > 0) {
        state.image = files[0]
    }
}

</script>

<template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nom" name="name" required>
            <UInput class="w-full" v-model="state.name" placeholder="Nom de l'item" />
        </UFormField>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Type" name="type" required>
                <UInput class="w-full" v-model="state.type" placeholder="Ex: Arme, Armure, Anneau..." />
            </UFormField>

            <UFormField label="Rareté" name="rarity">
                <USelect class="w-full" v-model="state.rarity" :items="rarities" option-attribute="label"
                    value-attribute="value" placeholder="Sélectionner une rareté" />
            </UFormField>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Acte" name="act" required>
                <USelect class="w-full" v-model="state.act" :items="acts" option-attribute="label"
                    value-attribute="value" />
            </UFormField>

            <UFormField label="Source" name="sourceType" required>
                <USelect class="w-full" v-model="state.sourceType" :items="sourceTypes" option-attribute="label"
                    value-attribute="value" />
            </UFormField>
        </div>

        <UFormField label="Image" name="image" description="JPG, GIF or PNG. 2MB Max.">
            <UFileUpload v-model="state.image" accept="image/*" class="w-full" />
        </UFormField>

        <UFormField label="Description" name="description">
            <UTextarea v-model="state.description" class="w-full" rows="7" placeholder="Description de l'item..." />
        </UFormField>

        <div class="flex justify-end">
            <UButton type="submit" color="primary">
                {{ initialData ? 'Modifier' : 'Ajouter' }}
            </UButton>
        </div>
    </UForm>
</template>