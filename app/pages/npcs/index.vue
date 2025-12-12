<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Npc } from '~~/generated/prisma/client'

const UButton = resolveComponent('UButton');
const UAvatar = resolveComponent('UAvatar');

const columns: Array<TableColumn<Npc>> = [
    {
        accessorKey: 'name',
        header: 'NPC',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                row.original.image ? h(UAvatar, {
                    src: row.original.image,
                    alt: row.original.name,
                    size: 'sm'
                }) : null,
                h('span', row.original.name)
            ])
        }
    },
    {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            return h('div', { class: 'flex gap-2' }, [
                h(UButton, {
                    to: `/npcs/${row.original.id}`,
                    icon: 'i-heroicons-pencil-square',
                    color: 'neutral',
                    variant: 'ghost',
                    size: 'xs'
                }),
                h(UButton, {
                    onClick: () => deleteNpc(row.original.id),
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

const { data, refresh } = await useFetch<{ npcs: Npc[], total: number }>('/api/npcs', {
    query: {
        page
    }
})

async function deleteNpc(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce PNJ ?')) return

    try {
        await $fetch(`/api/npcs/${id}`, {
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
            <h1 class="text-2xl font-bold">PNJs</h1>
            <UButton to="/npcs/add" icon="i-heroicons-plus" color="primary">
                Ajouter un PNJ
            </UButton>
        </div>

        <UCard>
            <UTable :data="data?.npcs || []" :columns="columns" />
            <UPagination v-model:page="page" :total="data?.total || 0" :items-per-page="20" />
        </UCard>
    </div>
</template>
