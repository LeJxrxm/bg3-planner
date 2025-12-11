<script setup lang="ts">

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


</script>

<template>

    <UCard v-for="rarity in Rarity" :key="rarity"
        :class="[`border rounded bg-linear-to-b from-2% to-transparent via-transparent max-w-lg z-10 p-4 space-y-1 my-2 relative overflow-visible`, colors[rarity]]">
        <div class="grid grid-cols-2 lg:grid-cols-6">
            <div class="lg:col-span-2">
                <div class="text-lg" :class="textColors[rarity]">Item</div>
                <div class="text-xs">{{ rarity }}</div>
            </div>
            <div class="lg:col-span-4 flex items-center justify-end">
                <NuxtImg src="/images/Birthright_hat.webp" alt="Item Image" sizes="100"
                    class="rounded-xl object-contain z-40 bg-clip-content" format="png" />
            </div>
        </div>
        <USeparator :color="'warning'" class="my-5" />
        <p>
            Ceci est un objet de rareté <span :class="textColors[rarity]">{{ rarity }}</span>. Lorem ipsum dolor sit
            amet consectetur, adipisicing elit. Quibusdam ab nostrum explicabo distinctio? Eveniet dolorum in quisquam
            aliquam, sed aspernatur explicabo illum optio, labore quidem aut illo nobis! Necessitatibus, molestiae.
        </p>
    </UCard>
</template>