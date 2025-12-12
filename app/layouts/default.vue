<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const isOpen = ref(true)

const route = useRoute().path;

const items = ref<NavigationMenuItem[][]>([
    [
        {
            label: 'Dashboard',
            icon: 'i-lucide-layout-dashboard',
            to: '/',
            active: route === '/',
        },
        {
            label: 'Runs',
            icon: 'i-lucide-gamepad-2',
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
            label: 'Items',
            icon: 'i-lucide-package',
            to: '/items',
            active: route.startsWith('/items'),
        },
        {
            label: 'Marchands',
            icon: 'i-lucide-shopping-bag',
            to: '/merchants',
            active: route.startsWith('/merchants'),
        },
        {
            label: 'Quêtes',
            icon: 'i-lucide-scroll-text',
            to: '/quests',
            active: route.startsWith('/quests'),
        },
        {
            label: 'Points d\'intérêt',
            icon: 'i-lucide-map-pin',
            to: '/pois',
            active: route.startsWith('/pois'),
        },
        {
            label: 'NPCs',
            icon: 'i-lucide-user',
            to: '/npcs',
            active: route.startsWith('/npcs'),
        },
    ]
])

watch(() => useRoute().path, (newPath) => {
    items.value.forEach(group => {
        group.forEach(item => {
            if (item.to === '/') {
                item.active = newPath === '/'
            } else {
                item.active = newPath.startsWith(item.to as string)
            }
        })
    })
})

</script>

<template>
    <div class="flex h-screen w-full overflow-hidden">
        <aside class="flex flex-col border-r transition-all duration-300" :class="[isOpen ? 'w-64' : 'w-16']">
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

        <main
            class="flex-1 flex flex-col min-w-0 overflow-hidden bg-linear-to-br from-primary/20 to-story/10 via-transparent">
            <div class="flex-1 overflow-y-auto py-4 px-4 md:px-8">
                <slot />
            </div>
        </main>
    </div>
</template>