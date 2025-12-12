<script setup lang="ts">
import type { Run, Character } from '~~/generated/prisma/client'

type RunWithCharacters = Run & {
    runCharacters: Array<{
        character: Character
    }>
}

const { data: runs, pending, refresh, error } = await useFetch<RunWithCharacters[]>('/api/runs')

const toast = useToast()
const showDeleteModal = ref(false)
const runToDelete = ref<{ id: number, name: string } | null>(null)

const confirmDelete = (run: RunWithCharacters) => {
    runToDelete.value = { id: run.id, name: run.name }
    showDeleteModal.value = true
}

const deleteRun = async () => {
    if (!runToDelete.value) return

    try {
        await $fetch(`/api/runs/${runToDelete.value.id}`, {
            method: 'DELETE',
        })

        toast.add({
            title: 'Run supprimée',
            color: 'success',
        })

        showDeleteModal.value = false
        runToDelete.value = null
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
        <div>
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-semibold text-hypr-text">
                    Runs existantes
                </h2>
                <span v-if="pending" class="text-sm text-hypr-muted">
                    Chargement...
                </span>
            </div>

            <div v-if="error" class="text-sm text-red-600 p-4 bg-red-50 rounded-lg">
                Erreur lors du chargement des runs.
            </div>

            <div v-else-if="!runs || runs.length === 0" class="text-center py-12">
                <UIcon name="i-lucide-inbox" class="w-16 h-16 mx-auto mb-4 text-hypr-muted opacity-50" />
                <p class="text-hypr-muted">Aucune run pour le moment.</p>
                <p class="text-sm text-hypr-dim mt-2">Crée-en une ci-dessus pour commencer.</p>
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <NuxtLink v-for="run in runs" :key="run.id" :to="`/runs/${run.id}`"
                    class="group relative overflow-hidden">
                    <UCard class="h-full hover:border-hypr-accent transition-all duration-200 hover:shadow-lg">
                        <!-- Header avec titre et bouton supprimer -->
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex-1 min-w-0">
                                <h3
                                    class="text-xl font-bold text-hypr-text truncate group-hover:text-hypr-accent transition-colors">
                                    {{ run.name }}
                                </h3>
                                <p v-if="run.description" class="text-sm text-hypr-muted mt-1 line-clamp-2">
                                    {{ run.description }}
                                </p>
                            </div>
                            <UButton @click.prevent="confirmDelete(run)" icon="i-lucide-trash-2" size="xs" color="error"
                                variant="ghost" class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>

                        <!-- Party characters -->
                        <div class="mt-4 pt-4 border-t border-hypr-border">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-xs font-semibold text-hypr-subtext uppercase tracking-wide">
                                    Party
                                </span>
                                <span class="text-xs text-hypr-dim">
                                    {{ run.runCharacters.length }} / 4
                                </span>
                            </div>

                            <div v-if="run.runCharacters.length > 0" class="flex items-center gap-2">
                                <div v-for="runChar in run.runCharacters.slice(0, 4)" :key="runChar.character.id"
                                    class="relative">
                                    <div
                                        class="w-12 h-12 rounded-full bg-hypr-overlay flex items-center justify-center overflow-hidden border-2 border-hypr-border">
                                        <NuxtImg v-if="runChar.character.image" :src="runChar.character.image"
                                            :alt="runChar.character.name" :title="runChar.character.name"
                                            class="w-full h-full object-cover" />
                                        <span v-else class="text-lg text-hypr-muted" :title="runChar.character.name">
                                            {{ runChar.character.name[0] }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="text-xs text-hypr-dim italic">
                                Aucun personnage assigné
                            </div>
                        </div>

                        <!-- Footer avec date -->
                        <div class="mt-4 pt-3 border-t border-hypr-border">
                            <div class="flex items-center gap-2 text-xs text-hypr-dim">
                                <UIcon name="i-lucide-calendar" class="w-3 h-3" />
                                <span>{{ new Date(run.createdAt).toLocaleDateString('fr-FR') }}</span>
                            </div>
                        </div>
                    </UCard>
                </NuxtLink>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <UModal v-model:open="showDeleteModal">

            <template #header>
                <div class="flex items-center gap-3">
                    <UIcon name="i-lucide-alert-triangle" class="w-6 h-6 text-error" />
                    <h3 class="text-lg font-semibold">Confirmer la suppression</h3>
                </div>
            </template>

            <template #body>
                <div class="space-y-4">
                    <p class="text-hypr-muted">
                        Êtes-vous sûr de vouloir supprimer la run
                        <strong class="text-hypr-text">{{ runToDelete?.name }}</strong> ?
                    </p>
                    <p class="text-sm text-hypr-dim">
                        Cette action est irréversible et supprimera également toutes les assignations de
                        personnages
                        et d'items
                        associés.
                    </p>
                </div>
            </template>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <UButton @click="showDeleteModal = false" variant="outline">
                        Annuler
                    </UButton>
                    <UButton @click="deleteRun" color="error">
                        Supprimer
                    </UButton>
                </div>
            </template>

        </UModal>
    </main>
</template>
