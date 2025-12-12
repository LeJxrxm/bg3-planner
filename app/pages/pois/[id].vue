<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const toast = useToast()

const poiId = route.params.id
const { data: poi, pending } = await useFetch(`/api/pois/${poiId}`)

async function onSubmit(data: any) {
  try {
    await $fetch(`/api/pois/${poiId}`, {
      method: 'PUT',
      body: data
    })
    
    toast.add({
      title: 'Succès',
      description: 'Le point d\'intérêt a été modifié avec succès',
      color: 'success'
    })
    
    router.push('/pois')
  } catch (error) {
    console.error('Erreur lors de la modification', error)
    toast.add({
      title: 'Erreur',
      description: 'Une erreur est survenue lors de la modification du POI',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class=" mx-auto space-y-4">
    <div class="flex items-center gap-4">
      <UButton to="/pois" icon="i-heroicons-arrow-left" color="neutral" variant="ghost" />
      <h1 class="text-2xl font-bold">Modifier le point d'intérêt</h1>
    </div>

    <UCard v-if="!pending && poi">
      <FormPoi :initial-data="poi" @submit="onSubmit" />
    </UCard>
    <div v-else-if="pending" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>
    <div v-else class="text-center py-8 text-gray-500">
      POI introuvable
    </div>
  </div>
</template>
