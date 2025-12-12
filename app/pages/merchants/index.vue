<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Merchant } from '~~/generated/prisma/client'

const UButton = resolveComponent('UButton');

const columns: Array<TableColumn<Merchant>> = [
    {
        accessorKey: 'name',
        header: 'Marchand',
    },
    {
        accessorKey: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            return h('div', { class: 'flex gap-2' }, [
                h(UButton, {
                    to: `/merchants/${row.original.id}`,
                    icon: 'i-heroicons-pencil-square',
                    color: 'neutral',
                    variant: 'ghost',
                    size: 'xs'
                }),
                h(UButton, {
                    onClick: () => deleteMerchant(row.original.id),
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

const { data, refresh } = await useFetch<{ merchants: Merchant[], total: number }>('/api/merchants', {
    query: {
        page
    }
})

async function deleteMerchant(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce marchand ?')) return

    try {
        await $fetch(`/api/merchants/${id}`, {
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
            <h1 class="text-2xl font-bold">Marchands</h1>
            <UButton to="/merchants/add" icon="i-heroicons-plus" color="primary">
                Ajouter un marchand
            </UButton>
        </div>

        <UCard>
            <UTable :data="data?.merchants || []" :columns="columns" />
            <UPagination v-model:page="page" :total="data?.total || 0" :items-per-page="20" />
        </UCard>
    </div>
</template>
