<script setup lang="ts">
import type { Run, Character, Item, CharacterItem } from '~~/generated/prisma/client'

type CharacterWithItems = Pick<Character, 'id' | 'name' | 'classe' | 'subclass' | 'image' | 'createdAt' | 'updatedAt'> & {
    items: Array<CharacterItem & { item: Item }>
}

type RunWithDetails = Run & {
    runCharacters: Array<{
        character: CharacterWithItems
    }>
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

        toast.add({
            title: 'Personnage ajouté',
            description: `${character.name} a été ajouté à l'équipe`,
            color: 'success'
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

const removeCharacter = (characterId: number) => {
    // TODO: API call to remove character from run
    console.log('Removing character from run:', characterId)
}

// Fetch all available items
const { data: itemsData } = await useFetch<{ items: Item[], total: number }>('/api/items', {
    query: {
        page: 1,
        itemsPerPage: 100
    }
})

const availableItems = computed(() => itemsData.value?.items || [])

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

        toast.add({
            title: 'Item ajouté',
            description: `${item.name} a été ajouté à ${selectedCharacter.value.name}`,
            color: 'success'
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

        toast.add({
            title: 'Item retiré',
            description: 'L\'item a été retiré du personnage',
            color: 'success'
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

        <div class="flex gap-6 items-start">
            <!-- Character Selection Sidebar -->
            <div class="w-80 shrink-0 space-y-3">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold text-hypr-text">Party</h2>
                    <UButton @click="showCharacterSelector = true" icon="i-lucide-user-plus" size="xs"
                        variant="outline" />
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
                                <div class="font-semibold text-hypr-text truncate">{{ runChar.character.name }}</div>
                                <div v-if="runChar.character.classe" class="text-sm text-hypr-muted">{{
                                    runChar.character.classe }}</div>
                                <div v-if="runChar.character.subclass" class="text-xs text-hypr-dim">{{
                                    runChar.character.subclass }}</div>
                            </div>
                            <UButton @click.stop="removeCharacter(runChar.character.id)" icon="i-lucide-x" size="xs"
                                color="error" variant="ghost"
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
                                <h2 class="text-2xl font-bold text-hypr-text mb-1">{{ selectedCharacter.name }}</h2>
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
                                        :alt="item.item.name" :title="item.item.name" size="lg" class="border" />

                                    <UButton @click="removeItemFromCharacter(item.item.id)" icon="i-lucide-x" size="xs"
                                        color="error"
                                        class="absolute rounded-full -top-2 -left-2 opacity-0 group-hover:opacity-100 z-50 transition-opacity" />
                                </div>


                            </div>
                            <div class="text-right">
                                <div class="text-sm text-hypr-muted mb-1">Items équipés</div>
                                <div class="text-3xl font-bold text-hypr-accent">{{ selectedCharacter.items?.length || 0
                                    }} / 12</div>
                            </div>
                        </div>
                    </UCard>

                    <!-- Items Grid -->
                    <div>
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xl font-semibold text-hypr-text">Items disponibles</h3>
                            <div class="flex gap-2">
                                <UInput placeholder="Rechercher un item..." icon="i-lucide-search" class="w-64" />
                                <UButton icon="i-lucide-filter" variant="outline">Filtrer</UButton>
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

        <!-- Character Selector Modal -->
        <UModal v-model:open="showCharacterSelector">
            <template #body>
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
    </div>
</template>