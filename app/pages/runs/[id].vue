<script setup lang="ts">
import type { Run, Character, Item, CharacterItem, Merchant, Quest, Poi, Npc, EquipmentSlot } from '~~/generated/prisma/client'

type ItemWithSources = Item & {
    merchant?: Merchant | null
    quest?: Quest | null
    poi?: Poi | null
    npc?: Npc | null
}

type CharacterWithItems = Pick<Character, 'id' | 'name' | 'classe' | 'subclass' | 'image' | 'createdAt' | 'updatedAt'> & {
    items: Array<CharacterItem & { item: ItemWithSources, slotId: number }>
}

type RunWithDetails = Run & {
    runCharacters: Array<{
        character: CharacterWithItems
    }>
}

type RoadmapItem = {
    item: ItemWithSources
    character: Pick<Character, 'id' | 'name' | 'image'>
    sourceType: 'merchant' | 'quest' | 'poi' | 'npc' | 'unknown'
    sourceName: string
    sourceAct: number
}

const route = useRoute()
const runId = route.params.id as string

// Fetch run data with characters
const { data: runData, refresh: refreshRun } = await useFetch<RunWithDetails>(`/api/runs/${runId}`)

const run = computed(() => runData.value)

// Fetch all available characters
const { data: allCharactersData, refresh: refreshCharacters } = await useFetch<{ characters: Character[], total: number }>('/api/characters', {
    query: {
        page: 1,
        itemsPerPage: 100
    }
})

const allCharacters = computed(() => allCharactersData.value?.characters || [])

const showCharacterSelector = ref(false)
const showItemCreator = ref(false)
const assignedCharacterIds = computed(() => run.value?.runCharacters.map(rc => rc.character.id) || [])
const availableCharacters = computed(() => allCharacters.value.filter(c => !assignedCharacterIds.value.includes(c.id)))

const toast = useToast()

const assignCharacter = async (character: Pick<Character, 'id' | 'name' | 'classe' | 'subclass' | 'image' | 'createdAt' | 'updatedAt'>) => {
    try {
        await $fetch(`/api/runs/${runId}/characters`, {
            method: 'POST',
            body: {
                characterId: character.id
            }
        })

        showCharacterSelector.value = false
        await refreshRun()
    } catch (error: any) {
        toast.add({
            title: 'Erreur',
            description: error.data?.statusMessage || 'Impossible d\'ajouter le personnage',
            color: 'error'
        })
    }
}

const removeCharacter = async (characterId: number) => {
    try {
        await $fetch(`/api/runs/${runId}/characters/${characterId}`, {
            method: 'DELETE'
        })

        await refreshRun()
    } catch (error: any) {
        toast.add({
            title: 'Erreur',
            description: error.data?.statusMessage || 'Impossible de retirer le personnage',
            color: 'error'
        })
    }
}

// Fetch all available items
const searchQuery = ref('')
const debouncedSearchQuery = computed(() => searchQuery.value)

// Watch for search changes with debounce
let debounceTimer: NodeJS.Timeout | null = null
watch(searchQuery, () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        refreshItems()
    }, 300)
})

const { data: itemsData, refresh: refreshItems } = await useFetch<{ items: Item[], total: number }>('/api/items', {
    query: computed(() => ({
        page: 1,
        itemsPerPage: 100,
        search: searchQuery.value || undefined
    })),
    watch: false
})

// Computed partagé pour les items assignés
const assignedItemIds = computed(() => {
    if (!run.value) return new Set<number>()
    const ids = new Set<number>()
    run.value.runCharacters.forEach(rc => {
        rc.character.items?.forEach(ci => {
            ids.add(ci.item.id)
        })
    })
    return ids
})

const removeItemFromCharacter = async (itemId: number) => {
    try {
        await $fetch(`/api/runs/${runId}/characters/0/items/${itemId}`, {
            method: 'DELETE'
        })

        await refreshRun()
    } catch (error: any) {
        toast.add({
            title: 'Erreur',
            description: error.data?.statusMessage || 'Impossible de retirer l\'item',
            color: 'error'
        })
    }
}

const createItem = async (data: any) => {
    try {
        const newItem = await $fetch('/api/items', {
            method: 'POST',
            body: data
        })

        showItemCreator.value = false

        // Rafraîchir la liste des items disponibles
        await refreshNuxtData()

        toast.add({
            title: 'Succès',
            description: 'Item créé avec succès',
            color: 'success'
        })
    } catch (error: any) {
        toast.add({
            title: 'Erreur',
            description: error.data?.statusMessage || 'Impossible de créer l\'item',
            color: 'error'
        })
    }
}

const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
        COMMON: 'text-common',
        UNCOMMON: 'text-uncommon',
        RARE: 'text-rare',
        VERY_RARE: 'text-very-rare',
        LEGENDARY: 'text-legendary',
        STORY: 'text-story'
    }
    return colors[rarity] || 'text-gray-400'
}

const tabs = [
    { slot: 'setup', label: 'Setup', icon: 'i-lucide-users' },
    { slot: 'roadmap', label: 'Roadmap', icon: 'i-lucide-map' }
]

// Equipment slots from DB
const { data: equipmentSlots } = await useFetch<EquipmentSlot[]>('/api/equipment-slots')

// Modal state for slot selection
const showSlotModal = ref(false)
const selectedSlot = ref<EquipmentSlot | null>(null)
const selectedSlotCharacter = ref<CharacterWithItems | null>(null)

// Filter items by slot type
const slotFilteredItems = computed(() => {
    if (!selectedSlot.value || !itemsData.value?.items) return []
    
    const slotType = selectedSlot.value.itemType
    const assigned = assignedItemIds.value
    
    // Filter by slot type and not assigned
    return itemsData.value.items.filter(item => 
        item.type === slotType && !assigned.has(item.id)
    )
})

const openSlotModal = (slot: EquipmentSlot, character: CharacterWithItems) => {
    selectedSlot.value = slot
    selectedSlotCharacter.value = character
    searchQuery.value = ''
    showSlotModal.value = true
}

const assignItemToSlot = async (item: Item) => {
    if (!selectedSlotCharacter.value || !selectedSlot.value) return
    
    try {
        await $fetch(`/api/runs/${runId}/assign-item`, {
            method: 'POST',
            body: {
                characterId: selectedSlotCharacter.value.id,
                itemId: item.id,
                slotId: selectedSlot.value.id
            }
        })
        
        showSlotModal.value = false
        await refreshRun()
    } catch (error: any) {
        toast.add({
            title: 'Erreur',
            description: error.data?.statusMessage || 'Impossible d\'ajouter l\'item',
            color: 'error'
        })
    }
}

// Optimized with Map for O(1) lookups
const getItemForSlot = (character: CharacterWithItems, slotId: number) => {
    const itemMap = new Map(character.items?.map(ci => [ci.slotId, ci.item]) || [])
    return itemMap.get(slotId) || null
}

// Roadmap computation
const roadmapByAct = computed(() => {
    if (!run.value) return { 1: [], 2: [], 3: [] }

    const roadmapItems: RoadmapItem[] = []

    // Parcourir tous les personnages de la run
    run.value.runCharacters.forEach(rc => {
        rc.character.items?.forEach(ci => {
            const item = ci.item
            let sourceType: 'merchant' | 'quest' | 'poi' | 'npc' | 'unknown' = 'unknown'
            let sourceName = 'Source inconnue'
            let sourceAct = item.act || 1

            // Déterminer la source et son acte
            if (item.merchant) {
                sourceType = 'merchant'
                sourceName = item.merchant.name
                sourceAct = item.merchant.act
            } else if (item.quest) {
                sourceType = 'quest'
                sourceName = item.quest.name
                sourceAct = item.quest.act
            } else if (item.poi) {
                sourceType = 'poi'
                sourceName = item.poi.name
                sourceAct = item.poi.act
            } else if (item.npc) {
                sourceType = 'npc'
                sourceName = item.npc.name
                sourceAct = item.npc.act
            }

            roadmapItems.push({
                item,
                character: {
                    id: rc.character.id,
                    name: rc.character.name,
                    image: rc.character.image
                },
                sourceType,
                sourceName,
                sourceAct
            })
        })
    })

    // Grouper par acte
    const byAct: Record<number, RoadmapItem[]> = { 1: [], 2: [], 3: [] }
    roadmapItems.forEach(ri => {
        const act = Math.min(Math.max(ri.sourceAct, 1), 3) // Clamp entre 1 et 3
        if (byAct[act]) {
            byAct[act].push(ri)
        }
    })

    return byAct
})

const getSourceIcon = (sourceType: string) => {
    const icons: Record<string, string> = {
        merchant: 'i-lucide-shopping-bag',
        quest: 'i-lucide-scroll-text',
        poi: 'i-lucide-map-pin',
        npc: 'i-lucide-user',
        unknown: 'i-lucide-help-circle'
    }
    return icons[sourceType] || icons.unknown
}
</script>

<template>
    <div class="min-h-screen bg-hypr-bg p-6">
        <!-- Header -->
        <div class="mb-6">
            <div class="flex items-center gap-4 mb-2">
                <UButton to="/runs" icon="i-lucide-arrow-left" variant="ghost" size="sm" />
                <h1 class="text-3xl font-bold text-hypr-text">{{ run?.name }}</h1>
            </div>
            <p v-if="run?.description" class="text-hypr-muted ml-12">{{ run?.description }}</p>
        </div>

        <!-- Tabs -->
        <UTabs :items="tabs">
            <!-- Setup Tab -->
            <template #setup>
                <div class="mt-10 space-y-6">
                    <!-- Header with Add Character -->
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-2xl font-bold text-hypr-text">Équipement de la Party</h2>
                            <p class="text-sm text-hypr-muted">Cliquez sur un emplacement pour assigner un item</p>
                        </div>
                        <UButton v-if="(run?.runCharacters?.length || 0) < 4" @click="showCharacterSelector = true"
                            icon="i-lucide-user-plus" color="primary">
                            Ajouter un personnage
                        </UButton>
                    </div>

                    <!-- Characters Grid -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                        <div v-for="runChar in run?.runCharacters" :key="runChar.character.id">
                            <UCard class="bg-hypr-surface border-hypr-border h-full">
                                <!-- Character Header -->
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-14 h-14 rounded-full bg-hypr-overlay flex items-center justify-center overflow-hidden">
                                            <NuxtImg v-if="runChar.character.image" :src="runChar.character.image"
                                                :alt="runChar.character.name" class="w-full h-full object-cover" />
                                            <span v-else class="text-xl text-hypr-muted">
                                                {{ runChar.character.name[0] }}
                                            </span>
                                        </div>
                                        <div>
                                            <div class="font-semibold text-hypr-text">{{ runChar.character.name }}</div>
                                            <div v-if="runChar.character.classe" class="text-xs text-hypr-muted">
                                                {{ runChar.character.classe }}
                                            </div>
                                        </div>
                                    </div>
                                    <UButton @click.stop="removeCharacter(runChar.character.id)" icon="i-lucide-x"
                                        size="xs" color="error" variant="ghost" />
                                </div>

                                <!-- Equipment Slots -->
                                <div class="space-y-2">
                                    <div v-for="slot in equipmentSlots" :key="slot.id"
                                        @click="openSlotModal(slot, runChar.character)"
                                        class="group cursor-pointer p-2 rounded-lg bg-hypr-bg hover:bg-hypr-overlay hover:border-hypr-accent border border-hypr-border transition-all">
                                        <div v-if="getItemForSlot(runChar.character, slot.id)" class="flex items-center gap-2">
                                            <div
                                                class="w-10 h-10 rounded bg-hypr-overlay flex items-center justify-center overflow-hidden shrink-0">
                                                <NuxtImg v-if="getItemForSlot(runChar.character, slot.id)?.image"
                                                    :src="getItemForSlot(runChar.character, slot.id)!.image!"
                                                    :alt="getItemForSlot(runChar.character, slot.id)!.name"
                                                    class="w-full h-full object-cover" />
                                                <UIcon v-else :name="slot.icon" class="w-5 h-5 text-hypr-muted" />
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <div class="text-xs text-hypr-muted">{{ slot.label }}</div>
                                                <div class="text-sm font-medium text-hypr-text truncate"
                                                    :class="getRarityColor(getItemForSlot(runChar.character, slot.id)?.rarity || 'COMMON')">
                                                    {{ getItemForSlot(runChar.character, slot.id)!.name }}
                                                </div>
                                            </div>
                                            <UButton @click.stop="removeItemFromCharacter(getItemForSlot(runChar.character, slot.id)!.id)"
                                                icon="i-lucide-x" size="xs" color="error" variant="ghost"
                                                class="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div v-else class="flex items-center gap-2">
                                            <div
                                                class="w-10 h-10 rounded bg-hypr-overlay/50 flex items-center justify-center shrink-0">
                                                <UIcon :name="slot.icon" class="w-5 h-5 text-hypr-muted/50" />
                                            </div>
                                            <div class="flex-1">
                                                <div class="text-xs text-hypr-muted">{{ slot.label }}</div>
                                                <div class="text-sm text-hypr-dim">Vide</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </UCard>
                        </div>

                        <!-- Empty State -->
                        <div v-if="(run?.runCharacters?.length || 0) === 0"
                            class="col-span-full flex items-center justify-center py-20">
                            <div class="text-center text-hypr-muted">
                                <UIcon name="i-lucide-users" class="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p class="mb-4">Aucun personnage dans cette run</p>
                                <UButton @click="showCharacterSelector = true" icon="i-lucide-user-plus" color="primary">
                                    Ajouter un personnage
                                </UButton>
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Roadmap Tab -->
            <template #roadmap>
                <div class="mt-10 space-y-8">
                    <!-- Acts Loop -->
                    <div v-for="act in [1, 2, 3]" :key="act">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 rounded-full bg-hypr-accent flex items-center justify-center">
                                <span class="text-xl font-bold text-white">{{ act }}</span>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-hypr-text">Acte {{ act }}</h3>
                                <p class="text-sm text-hypr-muted">{{ roadmapByAct[act]?.length || 0 }} item(s)</p>
                            </div>
                        </div>
                        <div v-if="(roadmapByAct[act]?.length || 0) === 0"
                            class="text-center py-8 text-hypr-muted bg-hypr-surface/50 rounded-lg border border-hypr-border">
                            <UIcon name="i-lucide-package-open" class="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Aucun item pour cet acte</p>
                        </div>
                        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <UCard v-for="(roadmapItem, idx) in roadmapByAct[act]" :key="idx"
                                class="bg-hypr-surface border-hypr-border hover:border-hypr-accent transition-all">
                                <div class="flex gap-4">
                                    <div
                                        class="w-16 h-16 rounded-lg bg-hypr-overlay flex items-center justify-center overflow-hidden shrink-0">
                                        <NuxtImg v-if="roadmapItem.item.image" :src="roadmapItem.item.image"
                                            :alt="roadmapItem.item.name" class="w-full h-full object-cover" />
                                        <UIcon v-else name="i-lucide-package" class="w-8 h-8 text-hypr-muted" />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div :class="getRarityColor(roadmapItem.item.rarity || 'COMMON')"
                                            class="font-semibold truncate mb-1">{{ roadmapItem.item.name }}</div>
                                        <template v-if="roadmapItem.item.wikiLink">
                                            <NuxtLink :to="roadmapItem.item.wikiLink"
                                                class="text-hypr-accent hover:underline text-xs">Wiki</NuxtLink>
                                        </template>
                                        <div class="flex items-center gap-2 text-xs text-hypr-muted mb-1">
                                            <UIcon :name="getSourceIcon(roadmapItem.sourceType)" class="w-3 h-3" />
                                            <span class="truncate">{{ roadmapItem.sourceName }}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-6 h-6 rounded-full bg-hypr-overlay flex items-center justify-center overflow-hidden">
                                                <NuxtImg v-if="roadmapItem.character.image"
                                                    :src="roadmapItem.character.image" :alt="roadmapItem.character.name"
                                                    class="w-full h-full object-cover" />
                                                <span v-else class="text-xs text-hypr-muted">{{
                                                    roadmapItem.character.name[0] }}</span>
                                            </div>
                                            <span class="text-xs text-hypr-subtext">{{ roadmapItem.character.name }}</span>
                                        </div>
                                    </div>
                                </div>
                            </UCard>
                        </div>
                    </div>
                </div>
            </template>
        </UTabs>


        <!-- Character Selector Modal -->
        <UModal v-model:open="showCharacterSelector">
            <template #content>
                <UCard class="sm:max-w-2xl">
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold">Ajouter un personnage à la run</h3>
                            <UButton @click="showCharacterSelector = false" icon="i-lucide-x" variant="ghost"
                                size="xs" />
                        </div>
                    </template>

                    <div v-if="availableCharacters.length === 0" class="text-center py-8 text-hypr-muted">
                        <UIcon name="i-lucide-users" class="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Tous les personnages sont déjà assignés à cette run</p>
                        <UButton to="/characters/add" class="mt-4" size="sm">
                            Créer un nouveau personnage
                        </UButton>
                    </div>

                    <div v-else class="grid grid-cols-2 gap-3">
                        <UCard v-for="character in availableCharacters" :key="character.id"
                            class="cursor-pointer hover:border-hypr-accent transition-all"
                            @click="assignCharacter(character)">
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-12 h-12 rounded-full bg-hypr-overlay flex items-center justify-center overflow-hidden shrink-0">
                                    <NuxtImg v-if="character.image" :src="character.image" :alt="character.name"
                                        class="w-full h-full object-cover" />
                                    <span v-else class="text-xl text-hypr-muted">
                                        {{ character.name[0] }}
                                    </span>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-medium text-hypr-text truncate">{{ character.name }}</div>
                                    <div class="text-sm text-hypr-muted">{{ character.classe || 'No class' }}</div>
                                </div>
                            </div>
                        </UCard>
                    </div>

                    <template #footer>
                        <div class="flex justify-end">
                            <UButton @click="showCharacterSelector = false" variant="outline">
                                Annuler
                            </UButton>
                        </div>
                    </template>
                </UCard>
            </template>
        </UModal>

        <!-- Item Creator Modal -->
        <!-- Item Creator Modal -->
        <UModal fullscreen class="w-full" v-model:open="showItemCreator">

            <template #header>
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-semibold">Créer un nouvel item</h3>
                </div>
            </template>

            <template #body>
                <FormItem @submit="createItem" />
            </template>

            <template #footer>
                <div class="flex justify-end w-full gap-2">
                    <UButton color="error" @click="showItemCreator = false" variant="outline">
                        Annuler
                    </UButton>
                </div>
            </template>
        </UModal>

        <!-- Slot Item Selector Modal -->
        <UModal v-model:open="showSlotModal" class="w-full max-w-4xl">
            <template #header>
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-semibold text-hypr-text">
                            Sélectionner {{ selectedSlot?.label }}
                        </h3>
                        <p class="text-sm text-hypr-muted">{{ selectedSlotCharacter?.name }}</p>
                    </div>
                </div>
            </template>

            <template #body>
                <div class="space-y-4">
                    <!-- Search and Create -->
                    <div class="flex gap-2">
                        <UInput v-model="searchQuery" placeholder="Rechercher un item..." icon="i-lucide-search"
                            class="flex-1" />
                        <UButton @click="showItemCreator = true; showSlotModal = false" icon="i-lucide-plus"
                            color="primary">
                            Créer un item
                        </UButton>
                    </div>

                    <!-- Items Grid -->
                    <div class="grid grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                        <div v-for="item in slotFilteredItems" :key="item.id" @click="assignItemToSlot(item)"
                            class="cursor-pointer">
                            <Item :item="item" :clickable="true" />
                        </div>
                        <div v-if="slotFilteredItems.length === 0" class="col-span-3 py-12 text-center">
                            <UIcon name="i-lucide-package-open" class="w-12 h-12 mx-auto mb-2 text-hypr-muted opacity-50" />
                            <p class="text-hypr-muted">Aucun item disponible pour cet emplacement</p>
                        </div>
                    </div>
                </div>
            </template>

            <template #footer>
                <div class="flex justify-end w-full">
                    <UButton color="error" @click="showSlotModal = false" variant="outline">
                        Annuler
                    </UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>