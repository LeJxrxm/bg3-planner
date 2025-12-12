<script setup lang="ts">
import type { Character } from '~~/generated/prisma/client'

const route = useRoute()
const characterId = parseInt(route.params.id as string)

const { data: character } = await useFetch<Character>(`/api/characters/${characterId}`)
</script>

<template>
    <div class="p-6 max-w-2xl mx-auto">
        <div class="mb-6">
            <h1 class="text-2xl font-bold">Modifier le personnage</h1>
        </div>

        <UCard v-if="character">
            <FormCharacter :character-id="characterId" :initial-data="{
                name: character.name,
                classe: character.classe,
                subclass: character.subclass,
                image: character.image,
                runId: character.runId
            }" />
        </UCard>

        <div v-else class="text-center py-8 text-gray-500">
            Chargement...
        </div>
    </div>
</template>
