<script setup lang="ts">
import type { Run } from '~~/generated/prisma/client'


const { data: runs, pending, refresh, error } = await useFetch<Run[]>('/api/runs')

const toast = useToast()

const deleteRun = async (runId: number) => {
    try {
        await $fetch(`/api/runs/${runId}`, {
            method: 'DELETE',
        })

        toast.add({
            title: 'Run supprimée',
            color: 'success',
        })

        await refresh()
    } catch (e: any) {
        toast.add({
            title: 'Erreur',
            description: 'Impossible de supprimer la run.',
            color: 'error',
        })
    }
}
</script>

<template>
    <main class="mx-auto p-6 space-y-8">
        <header class="space-y-2">
            <h1 class="text-4xl font-bold">
                Mes runs Baldur's Gate 3
            </h1>
            <p class="text-sm text-gray-500">
                Crée une run, ou génère une run de test avec Tav, Karlach, Gale et Wyll pour valider le schéma.
            </p>
        </header>

        <!-- Formulaire création run -->
        <UCard
            class="bg-linear-to-b from-primary/10 from-5% to-very-rare/10 via-transparent via-50% relative texxt-white">
            <template #header class="z-10">
                <h2 class="font-semibold text-white text-2xl">
                    Créer une nouvelle run
                </h2>
            </template>

            <FormRun />
        </UCard>

        <!-- Liste des runs -->
        <UCard class="space-y-4">
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
                            <UButton type="button" class="ml-4 text-blue-600 underline p-0" @click="deleteRun(run.id)"
                                icon="lucide-trash" />
                        </div>
                    </div>


                </li>
            </ul>
        </UCard>
    </main>
</template>
