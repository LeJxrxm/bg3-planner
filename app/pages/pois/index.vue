<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Poi } from '~~/generated/prisma/client'

const UButton = resolveComponent('UButton');

const columns: Array<TableColumn<Poi>> = [
    {
        accessorKey: 'name',
        header: 'Point d\'intérêt',
    },
    {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            return h('div', { class: 'flex gap-2' }, [
                h(UButton, {
                    to: `/pois/${row.original.id}`,
                    icon: 'i-heroicons-pencil-square',
                    color: 'neutral',
                    variant: 'ghost',
                    size: 'xs'
                }),
                h(UButton, {
                    onClick: () => deletePoi(row.original.id),
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

const { data, refresh } = await useFetch<{ pois: Poi[], total: number }>('/api/pois', {
    query: {
        page
    }
})

async function deletePoi(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce point d\'intérêt ?')) return

    try {
        await $fetch(`/api/pois/${id}`, {
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
            <h1 class="text-2xl font-bold">Points d'intérêt</h1>
            <UButton to="/pois/add" icon="i-heroicons-plus" color="primary">
                Ajouter un POI
            </UButton>
        </div>

        <UCard>
            <UTable :data="data?.pois || []" :columns="columns" />
            <UPagination v-model:page="page" :total="data?.total || 0" :items-per-page="20" />
        </UCard>
    </div>
</template>
