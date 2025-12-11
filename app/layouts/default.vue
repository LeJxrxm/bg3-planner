<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const isOpen = ref(true)

const route = useRoute().path;

const items = ref<NavigationMenuItem[][]>([
    [
        {
            label: 'Plans',
            icon: 'i-lucide-map',
            to: '/runs',
            active: route.startsWith('/runs'),
        },
        {
            label: 'Personnages',
            icon: 'i-lucide-users',
            to: '/characters',
            active: route.startsWith('/characters'),
        },
        {
            label: 'Objets',
            icon: 'i-lucide-box',
            to: '/test',
            active: route.startsWith('/test'),
        },
        {
            label: 'Marchands',
            icon: 'i-lucide-store',
            to: '/test',
            active: route.startsWith('/test'),
        },
        {
            label: 'Quêtes',
            icon: 'i-lucide-bookmark',
            to: '/test',
            active: route.startsWith('/test'),
        },
        {
            label: 'Points d\'intérêt',
            icon: 'i-lucide-compass',
            to: '/test',
            active: route.startsWith('/test'),
        },
        {
            label: 'Boss / Autres NPCs',
            icon: 'i-lucide-drama',
            to: '/settings',
            active: route.startsWith('/settings'),
        }
    ]
])

watch(() => useRoute().path, (newPath) => {
    if (!items.value[0]) return;
    items.value[0].forEach(item => {
        item.active = newPath.startsWith(item.to as string);
    });
});

</script>

<template>
    <div class="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950">
        <aside
            class="flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300"
            :class="[isOpen ? 'w-64' : 'w-16']">
            <div class="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800"
                :class="[isOpen ? 'justify-between' : 'justify-center']">
                <h1 v-if="isOpen" class="font-bold text-xl truncate">BG3 Planner</h1>
                <UButton icon="i-heroicons-bars-3" color="neutral" variant="ghost" @click="isOpen = !isOpen" />
            </div>

            <UNavigationMenu :collapsed="!isOpen" orientation="vertical" :items="items" :ui="{
                list: 'space-y-3',
                childList: !isOpen ? '' : 'space-y-1'
            }" />

        </aside>

        <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div class="flex-1 overflow-y-auto p-4">
                <div class="flex flex-wrap gap-4 mb-6">
                    <Item />
                </div>
                <slot />
            </div>
        </main>
    </div>
</template>