<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const toast = useToast()

const questId = route.params.id
const { data: quest, pending } = await useFetch(`/api/quests/${questId}`)

async function onSubmit(data: any) {
  try {
    await $fetch(`/api/quests/${questId}`, {
      method: 'PUT',
      body: data
    })
    
    toast.add({
      title: 'Succès',
      description: 'La quête a été modifiée avec succès',
      color: 'success'
    })
    
    router.push('/quests')
  } catch (error) {
    console.error('Erreur lors de la modification', error)
    toast.add({
      title: 'Erreur',
      description: 'Une erreur est survenue lors de la modification de la quête',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class=" mx-auto space-y-4">
    <div class="flex items-center gap-4">
      <UButton to="/quests" icon="i-heroicons-arrow-left" color="neutral" variant="ghost" />
      <h1 class="text-2xl font-bold">Modifier la quête</h1>
    </div>

    <UCard v-if="!pending && quest">
      <FormQuest :initial-data="quest" @submit="onSubmit" />
    </UCard>
    <div v-else-if="pending" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
    </div>
    <div v-else class="text-center py-8 text-gray-500">
      Quête introuvable
    </div>
  </div>
</template>
