<script setup lang="ts">
import type { Item } from '~~/generated/prisma/client';
import { Rarity } from '~~/generated/prisma/enums';

const colors = {
    [Rarity.COMMON]: 'from-common/10 #to-common/10 border-common',
    [Rarity.UNCOMMON]: 'from-uncommon/10 #to-uncommon/10 border-uncommon',
    [Rarity.RARE]: 'from-rare/10 #to-rare/10 border-rare',
    [Rarity.VERY_RARE]: 'from-very-rare/10 #to-very-rare/10 border-very-rare',
    [Rarity.LEGENDARY]: 'from-legendary/10 #to-legendary/10 border-legendary',
    [Rarity.STORY]: 'from-story/10 #to-story/10 border-story',
} as const;

const textColors = {
    [Rarity.COMMON]: 'text-common',
    [Rarity.UNCOMMON]: 'text-uncommon',
    [Rarity.RARE]: 'text-rare',
    [Rarity.VERY_RARE]: 'text-very-rare',
    [Rarity.LEGENDARY]: 'text-legendary',
    [Rarity.STORY]: 'text-story',
}

const props = defineProps<{
    item: Item
}>();
</script>

<template>

    <UCard :class="[
        `h-full border transition ease-in duration-100 rounded bg-linear-to-b from-2% to-transparent via-transparent max-w-lg z-10 p-4 space-y-1 my-2 relative overflow-visible`,
        colors[item.rarity],
        'hover:scale-[1.02]'
    ]">
        <div class="grid grid-cols-2 lg:grid-cols-6">
            <div class="lg:col-span-2">
                <div class="text-lg" :class="textColors[item.rarity]">{{ item.name }}</div>
                <div class="text-xs">{{ item.rarity }}</div>
            </div>
            <div class="lg:col-span-4 flex items-center justify-end">
                <NuxtImg :src="item.image || '/images/Birthright_hat.webp'" alt="Item Image" sizes="100"
                    class="rounded-xl object-contain z-40 bg-clip-content" format="png" />
            </div>
        </div>
        <USeparator :color="'warning'" class="my-5" />
        <p v-if="item.description">
            {{ item.description }}
        </p>
    </UCard>
</template>