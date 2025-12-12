<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { data: stats } = await useFetch('/api/dashboard/stats')

const quickActions = [
    { label: 'Nouvelle Run', icon: 'i-lucide-plus-circle', to: '/runs', color: 'primary' as const },
    { label: 'Nouvel Item', icon: 'i-lucide-package-plus', to: '/items/add', color: 'success' as const },
    { label: 'Nouveau Personnage', icon: 'i-lucide-user-plus', to: '/characters/add', color: 'info' as const },
    { label: 'Nouvelle Quête', icon: 'i-lucide-scroll-text', to: '/quests/add', color: 'secondary' as const }
]

const navigation = [
    { label: 'Runs', icon: 'i-lucide-gamepad-2', to: '/runs', description: 'Gérer vos parties' },
    { label: 'Items', icon: 'i-lucide-package', to: '/items', description: 'Catalogue d\'items' },
    { label: 'Personnages', icon: 'i-lucide-users', to: '/characters', description: 'Vos personnages' },
    { label: 'Marchands', icon: 'i-lucide-shopping-bag', to: '/merchants', description: 'Liste des marchands' },
    { label: 'Quêtes', icon: 'i-lucide-scroll-text', to: '/quests', description: 'Quêtes du jeu' },
    { label: 'POIs', icon: 'i-lucide-map-pin', to: '/pois', description: 'Points d\'intérêt' },
    { label: 'NPCs', icon: 'i-lucide-user', to: '/npcs', description: 'Personnages non-joueurs' }
]

// Initialize search from URL query parameter
const search = ref((route.query.search as string) || '')

// Watch for search changes and update URL
watch(search, (newSearch) => {
    router.push({
        query: {
            ...route.query,
            search: newSearch || undefined
        }
    })
})
</script>

<template>
    <div class="min-h-screen bg-hypr-bg">
        <!-- Header -->
        <div class="bg-linear-to-r from-hypr-surface to-hypr-overlay border-b border-hypr-border">
            <div class="max-w-7xl mx-auto px-6 py-12">
                <h1 class="text-4xl font-bold text-hypr-text mb-2">BG3 Planner</h1>
                <p class="text-hypr-muted text-lg mb-4">Planifiez vos runs Baldur's Gate 3</p>
                <UInput 
                    v-model="search" 
                    placeholder="Rechercher..." 
                    icon="i-lucide-search"
                    class="max-w-md"
                />
            </div>
        </div>

        <div class="max-w-7xl mx-auto px-6 py-8">
            <!-- Stats Overview -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <UCard class="bg-hypr-surface border-hypr-border">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-hypr-muted mb-1">Runs</p>
                            <p class="text-3xl font-bold text-hypr-text">{{ stats?.runs || 0 }}</p>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-hypr-accent/20 flex items-center justify-center">
                            <UIcon name="i-lucide-gamepad-2" class="w-6 h-6 text-hypr-accent" />
                        </div>
                    </div>
                </UCard>

                <UCard class="bg-hypr-surface border-hypr-border">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-hypr-muted mb-1">Items</p>
                            <p class="text-3xl font-bold text-hypr-text">{{ stats?.items || 0 }}</p>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <UIcon name="i-lucide-package" class="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                </UCard>

                <UCard class="bg-hypr-surface border-hypr-border">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-hypr-muted mb-1">Personnages</p>
                            <p class="text-3xl font-bold text-hypr-text">{{ stats?.characters || 0 }}</p>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <UIcon name="i-lucide-users" class="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                </UCard>

                <UCard class="bg-hypr-surface border-hypr-border">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-hypr-muted mb-1">Quêtes</p>
                            <p class="text-3xl font-bold text-hypr-text">{{ stats?.quests || 0 }}</p>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <UIcon name="i-lucide-scroll-text" class="w-6 h-6 text-purple-500" />
                        </div>
                    </div>
                </UCard>
            </div>

            <!-- Quick Actions -->
            <div class="mb-8">
                <h2 class="text-2xl font-bold text-hypr-text mb-4">Actions rapides</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <UButton v-for="action in quickActions" :key="action.to" :to="action.to" :color="action.color"
                        size="lg" block variant="soft" class="h-auto py-6">
                        <div class="flex flex-col items-center gap-2">
                            <UIcon :name="action.icon" class="w-8 h-8" />
                            <span>{{ action.label }}</span>
                        </div>
                    </UButton>
                </div>
            </div>

            <!-- Navigation Grid -->
            <div>
                <h2 class="text-2xl font-bold text-hypr-text mb-4">Navigation</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <NuxtLink v-for="item in navigation" :key="item.to" :to="item.to"
                        class="block group">
                        <UCard class="bg-hypr-surface border-hypr-border hover:border-hypr-accent transition-all h-full">
                            <div class="flex items-start gap-4">
                                <div
                                    class="w-12 h-12 rounded-lg bg-hypr-overlay group-hover:bg-hypr-accent/20 flex items-center justify-center transition-all shrink-0">
                                    <UIcon :name="item.icon" class="w-6 h-6 text-hypr-muted group-hover:text-hypr-accent transition-all" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h3 class="font-semibold text-hypr-text mb-1 group-hover:text-hypr-accent transition-all">
                                        {{ item.label }}
                                    </h3>
                                    <p class="text-sm text-hypr-muted">{{ item.description }}</p>
                                </div>
                                <UIcon name="i-lucide-chevron-right" class="w-5 h-5 text-hypr-muted group-hover:text-hypr-accent transition-all" />
                            </div>
                        </UCard>
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>
