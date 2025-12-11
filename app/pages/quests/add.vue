<script setup lang="ts">
const router = useRouter()
const toast = useToast()

async function onSubmit(data: any) {
  try {
    await $fetch('/api/quests', {
      method: 'POST',
      body: data
    })
    
    toast.add({
      title: 'Succès',
      description: 'La quête a été créée avec succès',
      color: 'success'
    })
    
    router.push('/quests')
  } catch (error) {
    console.error('Erreur lors de la création', error)
    toast.add({
      title: 'Erreur',
      description: 'Une erreur est survenue lors de la création de la quête',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class=" mx-auto space-y-4">
    <div class="flex items-center gap-4">
      <UButton to="/quests" icon="i-heroicons-arrow-left" color="neutral" variant="ghost" />
      <h1 class="text-2xl font-bold">Ajouter une quête</h1>
    </div>

    <UCard>
      <FormQuest @submit="onSubmit" />
    </UCard>
  </div>
</template>
