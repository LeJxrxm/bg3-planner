<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const toast = useToast()

const itemId = route.params.id
const { data: item, pending } = await useFetch(`/api/items/${itemId}`)

async function onSubmit(data: any) {
    try {
        await $fetch(`/api/items/${itemId}`, {
            method: 'PUT',
            body: data
        })

        toast.add({
            title: 'Succès',
            description: 'L\'item a été modifié avec succès',
            color: 'success'
        })
        
        router.push('/items')
    } catch (error) {
        console.error('Erreur lors de la modification', error)
        toast.add({
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la modification de l\'item',
            color: 'error'
        })
    }
}
</script>

<template>
    <div class="mx-auto space-y-4">
    <div class="flex items-center gap-4">
      <UButton to="/items" icon="i-heroicons-arrow-left" color="neutral" variant="ghost" />
      <h1 class="text-2xl font-bold">Modifier l'item</h1>
    </div>        <UCard v-if="!pending && item">
            <FormItem :initial-data="item" @submit="onSubmit" />
        </UCard>
        <div v-else-if="pending" class="flex justify-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
        </div>
        <div v-else class="text-center py-8 text-gray-500">
            Item introuvable
        </div>
    </div>
</template>
