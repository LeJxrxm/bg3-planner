<script setup lang="ts">
import type { Character, Run } from '~~/generated/prisma/client'
import type { TableColumn } from '@nuxt/ui'

type CharacterWithRun = Character & { run: Run }

const page = ref(1)
const { data, pending, error } = await useFetch<{ characters: CharacterWithRun[], total: number }>('/api/characters', {
    query: {
        page,
        itemsPerPage: 20
    }
})

const toast = useToast()
const UButton = resolveComponent('UButton')

const columns: Array<TableColumn<CharacterWithRun>> = [
    {
        accessorKey: 'name',
        header: 'Nom',
        cell: ({ row }) => {
            const char = row.original
            return h('div', { class: 'flex items-center gap-2' }, [
                char.image ? h('img', {
                    src: char.image,
                    alt: char.name,
                    class: 'w-8 h-8 rounded-full object-cover'
                }) : null,
                h('span', { class: 'font-medium' }, char.name)
            ])
        }
    },
    {
        accessorKey: 'classe',
        header: 'Classe',
        cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.classe || '-')
    },
    {
        accessorKey: 'subclass',
        header: 'Sous-classe',
        cell: ({ row }) => h('span', { class: 'text-sm text-gray-500' }, row.original.subclass || '-')
    },
    {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            return h('div', { class: 'flex gap-2' }, [
                h(UButton, {
                    to: `/characters/${row.original.id}`,
                    size: 'xs',
                    variant: 'outline',
                    icon: 'i-lucide-pencil'
                }),
                h(UButton, {
                    onClick: () => deleteCharacter(row.original.id),
                    size: 'xs',
                    color: 'error',
                    variant: 'outline',
                    icon: 'i-lucide-trash'
                })
            ])
        }
    }
]

const deleteCharacter = async (id: number) => {
    try {
        await $fetch(`/api/characters/${id}`, {
            method: 'DELETE'
        })

        toast.add({
            title: 'Personnage supprimé',
            color: 'success'
        })

        await refreshNuxtData()
    } catch (e: any) {
        toast.add({
            title: 'Erreur',
            description: 'Impossible de supprimer le personnage',
            color: 'error'
        })
    }
}
</script>

<template>
    <div class="p-6 space-y-6">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold">Personnages</h1>
            <UButton to="/characters/add" trailing-icon="lucide-plus">
                Nouveau personnage
            </UButton>
        </div>

        <UCard>
            <div v-if="pending" class="text-center py-8 text-gray-500">
                Chargement...
            </div>

            <div v-else-if="error" class="text-center py-8 text-red-500">
                Erreur lors du chargement des personnages <br>
                {{ error }}
            </div>

            <div v-else-if="!data?.characters || data.characters.length === 0" class="text-center py-8 text-gray-500">
                Aucun personnage pour le moment
            </div>

            <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4 space-y-2">
                <NuxtLink v-for="character in data?.characters" :key="character.id" class="group relative w-40 mx-auto"
                    :to="`/characters/${character.id}`">
                    <div class="relative w-auto justify-center">
                        <div class="bg-black/20 w-40 absolute inset-0 rounded-lg"></div>
                        <NuxtImg quality="100" :src="character.image || '/default-character.png'" :alt="character.name"
                            class="w-40 h-40 object-cover rounded-lg mb-2" />
                    </div>

                    <div class="text-center font-medium absolute bottom-2 left-2">
                        {{ character.name }}
                    </div>
                </NuxtLink>
            </div>
        </UCard>
    </div>
</template>
