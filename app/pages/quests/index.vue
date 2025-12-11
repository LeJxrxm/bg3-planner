<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Quest } from '~~/generated/prisma/client'

const UButton = resolveComponent('UButton');

const columns: Array<TableColumn<Quest>> = [
    {
        accessorKey: 'name',
        header: 'Quête',
    },
    {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            return h('div', { class: 'flex gap-2' }, [
                h(UButton, {
                    to: `/quests/${row.original.id}`,
                    icon: 'i-heroicons-pencil-square',
                    color: 'neutral',
                    variant: 'ghost',
                    size: 'xs'
                }),
                h(UButton, {
                    onClick: () => deleteQuest(row.original.id),
                    icon: 'i-heroicons-trash',
                    color: 'error',
                    variant: 'ghost',
                    size: 'xs'
                })
            ])
        }
    }

]

const page = ref(1)

const { data, refresh } = await useFetch<Quest[]>('/api/quests', {
    query: {
        page
    }
})

async function deleteQuest(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette quête ?')) return

    try {
        await $fetch(`/api/quests/${id}`, {
            method: 'DELETE'
        })
        refresh()
    } catch (error) {
        console.error('Erreur lors de la suppression', error)
        alert('Erreur lors de la suppression')
    }
}
</script>

<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold">Quêtes</h1>
            <UButton to="/quests/add" icon="i-heroicons-plus" color="primary">
                Ajouter une quête
            </UButton>
        </div>

        <UCard>
            <UTable :data="data.quests || []" :columns="columns" />
            <UPagination v-model:page="page" :total="data?.total || 0" :items-per-page="20" />
        </UCard>
    </div>
</template>
