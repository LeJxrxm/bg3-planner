<script setup lang="ts">
import type { Run, Character } from '~~/generated/prisma/client'

const { data: runs, pending, refresh, error } = await useFetch<Run & Character[]>('/api/runs')

const newRunName = ref('')
const newRunDescription = ref('')

const createRun = async () => {
    if (!newRunName.value.trim()) return

    await $fetch('/api/runs', {
        method: 'POST',
        body: {
            name: newRunName.value,
            description: newRunDescription.value || undefined,
        },
    })

    newRunName.value = ''
    newRunDescription.value = ''
    await refresh()
}

const createDemoRun = async () => {
    await $fetch('/api/runs/demo', {
        method: 'POST',
    })
    await refresh()
}
</script>

<template>
    <main class="max-w-4xl mx-auto p-6 space-y-8">
        <header class="space-y-2">
            <h1 class="text-2xl font-bold">
                Mes runs Baldur's Gate 3
            </h1>
            <p class="text-sm text-gray-500">
                Crée une run, ou génère une run de test avec Tav, Karlach, Gale et Wyll pour valider le schéma.
            </p>
        </header>

        <!-- Formulaire création run -->
        <section class="border rounded-lg p-4 space-y-4">
            <h2 class="font-semibold">
                Nouvelle run
            </h2>

            <div class="space-y-3">
                <div class="space-y-1">
                    <label class="text-sm font-medium">Nom de la run</label>
                    <input v-model="newRunName" type="text" class="w-full border rounded px-3 py-2 text-sm"
                        placeholder="Ex: Honour mode Karlach Oathbreaker">
                </div>

                <div class="space-y-1">
                    <label class="text-sm font-medium">Description</label>
                    <textarea v-model="newRunDescription" rows="2" class="w-full border rounded px-3 py-2 text-sm"
                        placeholder="Notes optionnelles sur la run" />
                </div>

                <div class="flex gap-3">
                    <button type="button" class="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
                        :disabled="!newRunName.trim()" @click="createRun">
                        Créer la run
                    </button>

                    <button type="button" class="px-4 py-2 text-sm rounded border" @click="createDemoRun">
                        Créer une run de test (Tav / Karlach / Gale / Wyll)
                    </button>
                </div>
            </div>
        </section>

        <!-- Liste des runs -->
        <section class="space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="font-semibold">
                    Runs existantes
                </h2>
                <span v-if="pending" class="text-xs text-gray-500">
                    Chargement...
                </span>
            </div>

            <div v-if="error" class="text-sm text-red-600">
                Erreur lors du chargement des runs.
            </div>

            <div v-else-if="!runs || runs.length === 0" class="text-sm text-gray-500">
                Aucune run pour le moment. Crée-en une ci-dessus.
            </div>

            <ul v-else class="space-y-3">
                <li v-for="run in runs" :key="run.id" class="border rounded-lg p-4 space-y-2">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-semibold">
                                {{ run.name }}
                            </h3>
                            <p v-if="run.description" class="text-xs text-gray-500">
                                {{ run.description }}
                            </p>
                        </div>
                        <div class="text-xs text-gray-400">
                            Créée le
                            {{ new Date(run.createdAt).toLocaleString() }}
                        </div>
                    </div>

                    <div class="text-xs text-gray-600 mt-1">
                        {{ run.characters.length }} personnage(s)
                    </div>

                    <div v-if="run.characters.length" class="flex flex-wrap gap-2 mt-2">
                        <span v-for="char in run.characters" :key="char.id"
                            class="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs">
                            <span class="font-medium">{{ char.name }}</span>
                            <span v-if="char.classe" class="text-gray-500">
                                ({{ char.classe }}<span v-if="char.subclass"> – {{ char.subclass }}</span>)
                            </span>
                        </span>
                    </div>
                </li>
            </ul>
        </section>
    </main>
</template>
