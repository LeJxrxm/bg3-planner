<script setup lang="ts">
import type { Item } from '~~/generated/prisma/client'


const itemsPerPage = ref<number>(20);
const page = ref<number>(1);
const search = ref<string>('');

interface ItemsResponse {
    items: Item[]
    total: number
}

const { data: items, refresh } = await useFetch<ItemsResponse>('/api/items', {
    query: {
        page,
        itemsPerPage,
        search
    },
    watch: false
})

// Watch for search changes with debounce
let debounceTimer: NodeJS.Timeout | null = null
watch(search, () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
        page.value = 1 // Reset to first page when searching
        refresh()
    }, 300)
})

// Clean up timer on unmount
onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
})

// const handlePageUpdate = (newPage: number) => {
//     page.value = newPage;
//     refresh();
// }

async function deleteItem(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet item ?')) return

    try {
        await $fetch(`/api/items/${id}`, {
            method: 'DELETE'
        })
        refresh()
    } catch (error) {
        console.error('Erreur lors de la suppression', error)
        alert('Erreur lors de la suppression')
    }
}

function getRarityColor(rarity: string | null) {
    switch (rarity) {
        case 'LEGENDARY': return 'warning'
        case 'VERY_RARE': return 'secondary'
        case 'RARE': return 'info'
        case 'UNCOMMON': return 'success'
        default: return 'neutral'
    }
}
</script>

<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold">Items</h1>
            <UButton to="/items/add" icon="i-heroicons-plus" color="primary">
                Ajouter un item
            </UButton>
        </div>

        <UInput v-model="search" placeholder="Rechercher un item..." icon="i-lucide-search" />

        <div v-if="items?.items.length" class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <NuxtLink v-for="item in items.items" :key="item.id" :to="`/items/${item.id}`">
                <Item :item="item" />
            </NuxtLink>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
            Aucun item trouvé.
        </div>

        <UPagination v-if="items && items.total > itemsPerPage" :total="items.total" :items-per-page="itemsPerPage"
            v-model:page="page" />
    </div>
</template>
