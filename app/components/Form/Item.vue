<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const props = defineProps<{
    initialData?: {
        name: string
        type: string
        act: number
        sourceType: 'MERCHANT' | 'QUEST' | 'POI'
        merchantId?: number | null
        questId?: number | null
        poiId?: number | null
        npcId?: number | null
        image?: string | null
        description?: string | null
        rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'VERY_RARE' | 'LEGENDARY' | 'STORY' | null
        wikiLink?: string | null
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

const itemTypes = [
    { label: 'Arme', value: 'WEAPON' },
    { label: 'Armure', value: 'ARMOR' },
    { label: 'Anneau', value: 'RING' },
    { label: 'Amulette', value: 'AMULET' },
    { label: 'Bottes', value: 'BOOTS' },
    { label: 'Gants', value: 'GLOVES' },
    { label: 'Casque', value: 'HELMET' },
    { label: 'Cape', value: 'CLOAK' },
    { label: 'Main gauche', value: 'OFFHAND' },
    { label: 'Arme à distance', value: 'RANGED_WEAPON' },
    { label: 'Instrument', value: 'INSTRUMENT' }
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
    type: z.enum(['WEAPON', 'ARMOR', 'RING', 'AMULET', 'BOOTS', 'GLOVES', 'HELMET', 'CLOAK', 'OFFHAND', 'RANGED_WEAPON', 'INSTRUMENT']),
    act: z.number().int().min(1).max(3),
    sourceType: z.enum(['MERCHANT', 'QUEST', 'POI']),
    merchantId: z.number().optional().nullable(),
    questId: z.number().optional().nullable(),
    poiId: z.number().optional().nullable(),
    npcId: z.number().optional().nullable(),
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
    rarity: z.enum(['COMMON', 'UNCOMMON', 'RARE', 'VERY_RARE', 'LEGENDARY', 'STORY']).optional(),
    wikiLink: z.string().url('Le lien doit être une URL valide').optional().or(z.literal('')).nullable()
})

type Schema = z.output<typeof schema>

const fileState = ref<File | null>(null)

const state = reactive<Partial<Schema>>({
    name: props.initialData?.name || '',
    type: props.initialData?.type as any || undefined,
    act: props.initialData?.act || 1,
    sourceType: props.initialData?.sourceType || 'MERCHANT',
    merchantId: props.initialData?.merchantId ?? null,
    questId: props.initialData?.questId ?? null,
    poiId: props.initialData?.poiId ?? null,
    npcId: props.initialData?.npcId ?? null,
    image: undefined,
    description: props.initialData?.description || undefined,
    rarity: props.initialData?.rarity || undefined,
    wikiLink: props.initialData?.wikiLink || undefined
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const data = { ...event.data }

    if (fileState.value instanceof File) {
        const formData = new FormData()
        formData.append('file', fileState.value)

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

// Fetch entities for associations
const { data: merchantsData } = await useFetch<{ merchants: Array<{ id: number, name: string }>, total: number }>('/api/merchants', {
    query: { page: 1, itemsPerPage: 100 }
})

const { data: questsData } = await useFetch<{ quests: Array<{ id: number, name: string }>, total: number }>('/api/quests', {
    query: { page: 1, itemsPerPage: 100 }
})

const { data: poisData } = await useFetch<{ pois: Array<{ id: number, name: string }>, total: number }>('/api/pois', {
    query: { page: 1, itemsPerPage: 100 }
})

const { data: npcsData } = await useFetch<{ npcs: Array<{ id: number, name: string }>, total: number }>('/api/npcs', {
    query: { page: 1, itemsPerPage: 100 }
})




const quests = computed(() => {
    if (!questsData.value) return []

    const base = { value: null, label: 'Laisser vide' };
    return [base, ...questsData.value.quests.map(quest => ({ value: quest.id, label: quest.name }))];
})

const merchants = computed(() => {
    if (!merchantsData.value) return []
    const base = { value: null, label: 'Laisser vide' };
    return [base, ...merchantsData.value.merchants.map(merchant => ({ value: merchant.id, label: merchant.name }))];
})

const pois = computed(() => {
    if (!poisData.value) return []
    const base = { value: null, label: 'Laisser vide' };
    return [base, ...poisData.value.pois.map(poi => ({ value: poi.id, label: poi.name }))];
})


const npcs = computed(() => {
    if (!npcsData.value) return []
    const base = { value: null, label: 'Laisser vide' };
    return [base, ...npcsData.value.npcs.map(npc => ({ value: npc.id, label: npc.name }))];
})

</script>

<template>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nom" name="name" required>
            <UInput class="w-full" v-model="state.name" placeholder="Nom de l'item" />
        </UFormField>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Type" name="type" required>
                <USelect class="w-full" v-model="state.type" :items="itemTypes" option-attribute="label"
                    value-attribute="value" placeholder="Sélectionner un type" />
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

        <!-- Source Associations -->
        <div class="border border-hypr-border rounded-lg p-4 space-y-4">
            <h3 class="text-sm font-semibold text-hypr-text">Associations optionnelles</h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <UFormField label="Marchand" name="merchantId">
                    <USelect class="w-full" v-model="state.merchantId" :items="merchants" option-attribute="name"
                        value-attribute="id" placeholder="Sélectionner un marchand" />
                </UFormField>

                <UFormField label="Quête" name="questId">
                    <USelect class="w-full" v-model="state.questId" :items="quests" option-attribute="name"
                        value-attribute="id" placeholder="Sélectionner une quête" />
                </UFormField>

                <UFormField label="Point d'intérêt" name="poiId">
                    <USelect class="w-full" v-model="state.poiId" :items="pois" option-attribute="name"
                        value-attribute="id" placeholder="Sélectionner un POI" />
                </UFormField>

                <UFormField label="PNJ" name="npcId">
                    <USelect class="w-full" v-model="state.npcId" :items="npcs" option-attribute="name"
                        value-attribute="id" placeholder="Sélectionner un PNJ" />
                </UFormField>
            </div>
        </div>

        <UFormField label="Image" name="image" description="JPG, GIF or PNG. 2MB Max.">
            <UFileUpload v-model="fileState" accept="image/*" class="w-full" />
        </UFormField>

        <UFormField label="Lien Wiki" name="wikiLink" description="Lien vers la page wiki de l'item">
            <UInput v-model="state.wikiLink" class="w-full" type="url" placeholder="https://bg3.wiki/..." />
        </UFormField>

        <UFormField label="Description" name="description">
            <UTextarea v-model="state.description" class="w-full" :rows="7" placeholder="Description de l'item..." />
        </UFormField>

        <div class="flex justify-end">
            <UButton type="submit" color="primary">
                {{ initialData ? 'Modifier' : 'Ajouter' }}
            </UButton>
        </div>
    </UForm>
</template>