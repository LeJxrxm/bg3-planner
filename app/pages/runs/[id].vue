<script setup lang="ts">
import type { Run, Character, Item, CharacterItem, Merchant, Quest, Poi, Npc } from '~~/generated/prisma/client'

type ItemWithSources = Item & {
    merchant?: Merchant | null
    quest?: Quest | null
    poi?: Poi | null
    npc?: Npc | null
}

type CharacterWithItems = Pick<Character, 'id' | 'name' | 'classe' | 'subclass' | 'image' | 'createdAt' | 'updatedAt'> & {
    items: Array<CharacterItem & { item: ItemWithSources }>
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
const selectedCharacterId = ref<number | null>(runData.value?.runCharacters[0]?.character.id || null)
const selectedCharacter = computed(() => {
    if (!selectedCharacterId.value || !run.value) return null
    const runChar = run.value.runCharacters.find(rc => rc.character.id === selectedCharacterId.value)
    return runChar?.character || null
})

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

        // Si c'était le personnage sélectionné, sélectionner le premier disponible
        if (selectedCharacterId.value === characterId) {
            selectedCharacterId.value = null
        }

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

const availableItems = computed(() => {
    if (!itemsData.value?.items || !run.value) return []

    // Récupérer tous les IDs d'items déjà assignés dans cette run
    const assignedItemIds = new Set<number>()
    run.value.runCharacters.forEach(rc => {
        rc.character.items?.forEach(ci => {
            assignedItemIds.add(ci.item.id)
        })
    })

    // Filtrer les items pour ne garder que ceux qui ne sont pas assignés
    return itemsData.value.items.filter(item => !assignedItemIds.has(item.id))
})

const assignItemToCharacter = async (item: Item) => {
    if (!selectedCharacter.value) {
        toast.add({
            title: 'Erreur',
            description: 'Veuillez sélectionner un personnage',
            color: 'error'
        })
        return
    }

    try {
        await $fetch(`/api/runs/${runId}/characters/${selectedCharacter.value.id}/items`, {
            method: 'POST',
            body: {
                itemId: item.id,
                status: 'TO_GET'
            }
        })

        await refreshRun()
    } catch (error: any) {
        toast.add({
            title: 'Erreur',
            description: error.data?.statusMessage || 'Impossible d\'ajouter l\'item',
            color: 'error'
        })
    }
}

const removeItemFromCharacter = async (itemId: number) => {
    if (!selectedCharacter.value) return

    try {
        await $fetch(`/api/runs/${runId}/characters/${selectedCharacter.value.id}/items/${itemId}`, {
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
                <div class="flex gap-6 items-start mt-10">
                    <!-- Character Selection Sidebar -->
                    <div class="w-80 shrink-0 space-y-3">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-lg font-semibold text-hypr-text">Party</h2>
                            <UButton v-if="(run?.runCharacters?.length || 0) < 4" @click="showCharacterSelector = true"
                                icon="i-lucide-user-plus" size="xs" variant="outline" />
                        </div>

                        <div v-for="runChar in run?.runCharacters" :key="runChar.character.id"
                            @click="selectedCharacterId = runChar.character.id"
                            class="group cursor-pointer transition-all duration-200" :class="[
                                selectedCharacterId === runChar.character.id
                                    ? 'bg-hypr-accent/20 border-hypr-accent'
                                    : 'bg-hypr-surface border-hypr-border hover:border-hypr-overlay'
                            ]">
                            <UCard>
                                <div class="flex items-center gap-3">
                                    <div class="relative">
                                        <div
                                            class="w-16 h-16 rounded-full bg-hypr-overlay flex items-center justify-center overflow-hidden">
                                            <img v-if="runChar.character.image" :src="runChar.character.image"
                                                :alt="runChar.character.name" class="w-full h-full object-cover">
                                            <span v-else class="text-2xl text-hypr-muted">
                                                {{ runChar.character.name[0] }}
                                            </span>
                                        </div>
                                        <div v-if="selectedCharacterId === runChar.character.id"
                                            class="absolute -bottom-1 -right-1 w-5 h-5 bg-hypr-accent rounded-full flex items-center justify-center">
                                            <UIcon name="i-lucide-check" class="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="font-semibold text-hypr-text truncate">{{ runChar.character.name }}
                                        </div>
                                        <div v-if="runChar.character.classe" class="text-sm text-hypr-muted">{{
                                            runChar.character.classe }}</div>
                                        <div v-if="runChar.character.subclass" class="text-xs text-hypr-dim">{{
                                            runChar.character.subclass }}</div>
                                    </div>
                                    <UButton @click.stop="removeCharacter(runChar.character.id)" icon="i-lucide-x"
                                        size="xs" color="error" variant="ghost"
                                        class="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </UCard>
                        </div>
                    </div>

                    <!-- Main Content Area -->
                    <div class="flex-1 min-w-0">
                        <div v-if="selectedCharacter" class="space-y-6">
                            <!-- Character Header -->
                            <UCard class="bg-linear-to-br from-hypr-surface to-hypr-overlay border-hypr-border">
                                <div class="flex items-center gap-6">
                                    <div
                                        class="w-24 h-24 rounded-lg bg-hypr-bg flex items-center justify-center overflow-hidden">
                                        <img v-if="selectedCharacter.image" :src="selectedCharacter.image"
                                            :alt="selectedCharacter.name" class="w-full h-full object-cover">
                                        <span v-else class="text-4xl text-hypr-muted">
                                            {{ selectedCharacter.name[0] }}
                                        </span>
                                    </div>
                                    <div class="flex-1">
                                        <h2 class="text-2xl font-bold text-hypr-text mb-1">{{ selectedCharacter.name }}
                                        </h2>
                                        <div class="flex items-center gap-3 text-sm">
                                            <span v-if="selectedCharacter.classe"
                                                class="px-3 py-1 bg-hypr-bg rounded-full text-hypr-accent font-medium">
                                                {{ selectedCharacter.classe }}
                                            </span>
                                            <span v-if="selectedCharacter.subclass" class="text-hypr-subtext">
                                                {{ selectedCharacter.subclass }}
                                            </span>
                                        </div>
                                    </div>
                                    <div v-for="item in selectedCharacter.items" :key="item.item.id" class="flex gap-2">
                                        <div class="relative group">
                                            <UAvatar :src="item.item.image || '/images/Birthright_hat.webp'"
                                                :alt="item.item.name" :title="item.item.name" size="lg"
                                                class="border" />

                                            <UButton @click="removeItemFromCharacter(item.item.id)" icon="i-lucide-x"
                                                size="xs" color="error"
                                                class="absolute rounded-full -top-2 -left-2 opacity-0 group-hover:opacity-100 z-50 transition-opacity" />
                                        </div>


                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm text-hypr-muted mb-1">Items équipés</div>
                                        <div class="text-3xl font-bold text-hypr-accent">{{
                                            selectedCharacter.items?.length
                                            || 0
                                            }} / 12</div>
                                    </div>
                                </div>
                            </UCard>

                            <!-- Items Grid -->
                            <div>
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-xl font-semibold text-hypr-text">Items disponibles</h3>
                                    <div class="flex gap-2">
                                        <UInput v-model="searchQuery" placeholder="Rechercher un item..."
                                            icon="i-lucide-search" class="w-64" />
                                        <UButton icon="i-lucide-filter" variant="outline">Filtrer</UButton>
                                        <UButton @click="showItemCreator = true" icon="i-lucide-plus" color="primary">
                                            Créer un item</UButton>
                                    </div>
                                </div>

                                <div class="grid grid-cols-3 gap-4">
                                    <div v-for="item in availableItems" :key="item.id">
                                        <Item :item="item" :clickable="true" @click="assignItemToCharacter" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- No character selected state -->
                        <div v-else class="flex items-center justify-center h-96">
                            <div class="text-center text-hypr-muted">
                                <UIcon name="i-lucide-users" class="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Sélectionnez un personnage pour gérer ses items</p>
                            </div>
                        </div>
                    </div>
                </div>

            </template>

            <!-- Roadmap Tab -->
            <template #roadmap>
                <div class="mt-10 space-y-8">
                    <!-- Act 1 -->
                    <div>
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 rounded-full bg-hypr-accent flex items-center justify-center">
                                <span class="text-xl font-bold text-white">1</span>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-hypr-text">Acte 1</h3>
                                <p class="text-sm text-hypr-muted">{{ roadmapByAct[1]?.length || 0 }} item(s)</p>
                            </div>
                        </div>
                        <div v-if="(roadmapByAct[1]?.length || 0) === 0"
                            class="text-center py-8 text-hypr-muted bg-hypr-surface/50 rounded-lg border border-hypr-border">
                            <UIcon name="i-lucide-package-open" class="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Aucun item pour cet acte</p>
                        </div>
                        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <UCard v-for="(roadmapItem, idx) in roadmapByAct[1]" :key="idx"
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
                                        <div class="flex items-center gap-2 text-xs text-hypr-muted mb-1">
                                            <UIcon :name="getSourceIcon(roadmapItem.sourceType)" class="w-3 h-3" />
                                            <span class="truncate">{{ roadmapItem.sourceName }}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-6 h-6 rounded-full bg-hypr-overlay flex items-center justify-center overflow-hidden">
                                                <img v-if="roadmapItem.character.image"
                                                    :src="roadmapItem.character.image" :alt="roadmapItem.character.name"
                                                    class="w-full h-full object-cover">
                                                <span v-else class="text-xs text-hypr-muted">{{
                                                    roadmapItem.character.name[0] }}</span>
                                            </div>
                                            <span class="text-xs text-hypr-subtext">{{ roadmapItem.character.name
                                                }}</span>
                                        </div>
                                    </div>
                                </div>
                            </UCard>
                        </div>
                    </div>

                    <!-- Act 2 -->
                    <div>
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 rounded-full bg-hypr-accent flex items-center justify-center">
                                <span class="text-xl font-bold text-white">2</span>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-hypr-text">Acte 2</h3>
                                <p class="text-sm text-hypr-muted">{{ roadmapByAct[2]?.length || 0 }} item(s)</p>
                            </div>
                        </div>
                        <div v-if="(roadmapByAct[2]?.length || 0) === 0"
                            class="text-center py-8 text-hypr-muted bg-hypr-surface/50 rounded-lg border border-hypr-border">
                            <UIcon name="i-lucide-package-open" class="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Aucun item pour cet acte</p>
                        </div>
                        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <UCard v-for="(roadmapItem, idx) in roadmapByAct[2]" :key="idx"
                                class="bg-hypr-surface border-hypr-border hover:border-hypr-accent transition-all">
                                <div class="flex gap-4">
                                    <div
                                        class="w-16 h-16 rounded-lg bg-hypr-overlay flex items-center justify-center overflow-hidden shrink-0">
                                        <img v-if="roadmapItem.item.image" :src="roadmapItem.item.image"
                                            :alt="roadmapItem.item.name" class="w-full h-full object-cover">
                                        <UIcon v-else name="i-lucide-package" class="w-8 h-8 text-hypr-muted" />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div :class="getRarityColor(roadmapItem.item.rarity || 'COMMON')"
                                            class="font-semibold truncate mb-1">{{ roadmapItem.item.name }}</div>
                                        <div class="flex items-center gap-2 text-xs text-hypr-muted mb-1">
                                            <UIcon :name="getSourceIcon(roadmapItem.sourceType)" class="w-3 h-3" />
                                            <span class="truncate">{{ roadmapItem.sourceName }}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-6 h-6 rounded-full bg-hypr-overlay flex items-center justify-center overflow-hidden">
                                                <img v-if="roadmapItem.character.image"
                                                    :src="roadmapItem.character.image" :alt="roadmapItem.character.name"
                                                    class="w-full h-full object-cover">
                                                <span v-else class="text-xs text-hypr-muted">{{
                                                    roadmapItem.character.name[0] }}</span>
                                            </div>
                                            <span class="text-xs text-hypr-subtext">{{ roadmapItem.character.name
                                                }}</span>
                                        </div>
                                    </div>
                                </div>
                            </UCard>
                        </div>
                    </div>

                    <!-- Act 3 -->
                    <div>
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 rounded-full bg-hypr-accent flex items-center justify-center">
                                <span class="text-xl font-bold text-white">3</span>
                            </div>
                            <div>
                                <h3 class="text-2xl font-bold text-hypr-text">Acte 3</h3>
                                <p class="text-sm text-hypr-muted">{{ roadmapByAct[3]?.length || 0 }} item(s)</p>
                            </div>
                        </div>
                        <div v-if="(roadmapByAct[3]?.length || 0) === 0"
                            class="text-center py-8 text-hypr-muted bg-hypr-surface/50 rounded-lg border border-hypr-border">
                            <UIcon name="i-lucide-package-open" class="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Aucun item pour cet acte</p>
                        </div>
                        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <UCard v-for="(roadmapItem, idx) in roadmapByAct[3]" :key="idx"
                                class="bg-hypr-surface border-hypr-border hover:border-hypr-accent transition-all">
                                <div class="flex gap-4">
                                    <div
                                        class="w-16 h-16 rounded-lg bg-hypr-overlay flex items-center justify-center overflow-hidden shrink-0">
                                        <img v-if="roadmapItem.item.image" :src="roadmapItem.item.image"
                                            :alt="roadmapItem.item.name" class="w-full h-full object-cover">
                                        <UIcon v-else name="i-lucide-package" class="w-8 h-8 text-hypr-muted" />
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div :class="getRarityColor(roadmapItem.item.rarity || 'COMMON')"
                                            class="font-semibold truncate mb-1">{{ roadmapItem.item.name }}</div>
                                        <div class="flex items-center gap-2 text-xs text-hypr-muted mb-1">
                                            <UIcon :name="getSourceIcon(roadmapItem.sourceType)" class="w-3 h-3" />
                                            <span class="truncate">{{ roadmapItem.sourceName }}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <div
                                                class="w-6 h-6 rounded-full bg-hypr-overlay flex items-center justify-center overflow-hidden">
                                                <img v-if="roadmapItem.character.image"
                                                    :src="roadmapItem.character.image" :alt="roadmapItem.character.name"
                                                    class="w-full h-full object-cover">
                                                <span v-else class="text-xs text-hypr-muted">{{
                                                    roadmapItem.character.name[0] }}</span>
                                            </div>
                                            <span class="text-xs text-hypr-subtext">{{ roadmapItem.character.name
                                                }}</span>
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
                                    <img v-if="character.image" :src="character.image" :alt="character.name"
                                        class="w-full h-full object-cover">
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
    </div>
</template>